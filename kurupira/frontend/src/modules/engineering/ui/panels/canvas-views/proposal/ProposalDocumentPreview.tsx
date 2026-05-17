import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { calculateProjectionStats } from '@/modules/engineering/utils/projectionMath';
import {
  ChevronLeft, ChevronRight, EyeOff,
  Maximize2, MoveHorizontal, ZoomIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Pages
import { ProposalPageTechnical } from './pages/ProposalPageTechnical';
import { CanvasElementRenderer } from './engine/CanvasElementRenderer';
import { getPageDimensions } from './engine/types';

export const ProposalDocumentPreview: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const getSimulatedTotal = useSolarStore(s => s.getSimulatedTotal);
  const proposalData = useSolarStore(s => s.proposalData);
  const modules = useSolarStore(selectModules);
  const activePage = useSolarStore(s => s.proposalActivePage);
  const setActivePage = useSolarStore(s => s.setProposalActivePage);
  const isExportingPdf = useSolarStore(s => s.isExportingPdf);
  const setExportingPdf = useSolarStore(s => s.setExportingPdf);
  const activeLayout = useSolarStore(s => s.proposalData.activeLayout);

  const inverters = useTechStore(s => s.inverters.entities);
  const inverterIds = useTechStore(s => s.inverters.ids);
  const prCalculationMode = useTechStore(s => s.prCalculationMode);
  const getAdditivePerformanceRatio = useTechStore(s => s.getAdditivePerformanceRatio);
  const getPerformanceRatio = useTechStore(s => s.getPerformanceRatio);
  const cosip = useTechStore(s => s.cosip);

  // Derived calculations
  const totalPowerKwp = modules.reduce((acc, m) => acc + (m.power * (m.quantity || 1)), 0) / 1000;
  const totalModules = modules.reduce((acc, m) => acc + (m.quantity || 1), 0);
  const firstModule = modules[0];
  const firstInverter = inverterIds.length > 0 ? inverters[inverterIds[0]] : null;

  const stats = useMemo(() => {
    const prDecimal = prCalculationMode === 'additive'
      ? getAdditivePerformanceRatio()
      : getPerformanceRatio();

    const simulatedAddedLoad = getSimulatedTotal();
    const additionalLoadsMonthly = Array(12).fill(simulatedAddedLoad);

    return calculateProjectionStats({
      totalPowerKw: totalPowerKwp,
      hsp: (clientData.monthlyIrradiation || Array(12).fill(0)) as number[],
      monthlyConsumption: (clientData.invoices?.[0]?.monthlyHistory || Array(12).fill(clientData.averageConsumption)) as number[],
      additionalLoadsMonthly,
      prDecimal: prDecimal || 0.75,
      tariffRate: clientData.tariffRate || 0.92,
      connectionType: clientData.connectionType,
      cosip,
    });
  }, [modules, clientData, prCalculationMode, getAdditivePerformanceRatio, getPerformanceRatio, cosip, getSimulatedTotal, totalPowerKwp]);

  // Common data passed to page components
  const pageData = {
    clientData,
    proposalData,
    modules,
    totalPowerKwp,
    totalModules,
    firstModule,
    firstInverter,
    inverterIds,
    stats,
    isExportingPdf,
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [zoomMode, setZoomMode] = React.useState<'fit' | 'width' | 'original'>('fit');

  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      
      // 1. Reservar espaço para elementos de UI fixos
      const navControlsHeight = 80;
      const bannerHeight = proposalData.excludedPages?.includes(activePage) ? 50 : 0;
      const padding = 32; // Respiro visual lateral/vertical

      const availableWidth = width - padding;
      const availableHeight = height - navControlsHeight - bannerHeight - padding;

      // 2. Calcular escala baseada no modo selecionado
      let newScale = 1;

      if (zoomMode === 'fit') {
        const scaleW = availableWidth / 794;
        const scaleH = availableHeight / 1123;
        newScale = Math.min(scaleW, scaleH, 1);
      } else if (zoomMode === 'width') {
        newScale = Math.min(availableWidth / 794, 1.2); // Cap em 1.2x para não estourar demais
      } else {
        newScale = 1;
      }
      
      setScale(newScale);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activePage, proposalData.excludedPages, zoomMode]);

  // ── MOTOR DE IMPRESSÃO NATIVO (Browser Print) ────────────────────
  React.useEffect(() => {
    if (!isExportingPdf) return;
    // Cancelled flag prevents the async body from running if the component unmounts
    // during the 1.5 s delay (e.g. user navigates away before print dialog opens).
    let cancelled = false;
    const handlePrint = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (cancelled) return;

      // Inject @page orientation rule based on the first page's orientation
      const layout = useSolarStore.getState().proposalData.activeLayout;
      const firstOrientation = layout?.pages?.[0]?.orientation ?? 'portrait';
      const styleEl = document.createElement('style');
      styleEl.id = 'kurupira-print-orientation';
      styleEl.textContent = `@page { size: A4 ${firstOrientation}; margin: 0; }`;
      document.head.appendChild(styleEl);

      window.print();
    };
    const handleAfterPrint = () => {
      setExportingPdf(false);
      document.getElementById('kurupira-print-orientation')?.remove();
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    handlePrint();
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isExportingPdf, setExportingPdf]);
  // ─────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  // Classic mode pages (used when activeLayout is null)
  const classicPages = [
    <ProposalPageTechnical key="technical" {...pageData} />,
  ];

  // Unified page count — drives navigation controls
  const pageCount = activeLayout ? activeLayout.pages.length : classicPages.length;

  // Clamp activePage when the layout switches to one with fewer pages (e.g. user applies
  // a 2-page template while previewing page 5 of a 6-page custom layout). Without this
  // the counter shows "Página 5 / 2" and activeLayout.pages[activePage] returns undefined.
  React.useEffect(() => {
    if (pageCount > 0 && activePage >= pageCount) {
      setActivePage(Math.max(0, pageCount - 1));
    }
  }, [activePage, pageCount, setActivePage]);

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full h-full overflow-hidden">
      
      {/* 1. Header Area (Status/Alerts) */}
      <div className="w-full flex flex-col items-center pt-4 shrink-0">
        {proposalData.excludedPages?.includes(activePage) && (
          <div className="w-[794px] max-w-full bg-amber-500/10 border border-amber-500/30 py-2 px-4 mb-2 rounded-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <EyeOff size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 text-center">
              Esta página não será incluída no PDF final
            </span>
          </div>
        )}
      </div>

      {/* 2. Main Content (The A4 Page) - Centered in remaining space */}
      <div className={cn(
        "flex-1 w-full flex justify-center min-h-0 relative",
        zoomMode === 'fit' ? "items-center overflow-hidden" : "items-start overflow-y-auto pt-8 pb-8 custom-scrollbar"
      )}>
        <div
          style={{
            width: `${794 * scale}px`,
            height: `${1123 * scale}px`,
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            transition: 'width 0.2s ease-out, height 0.2s ease-out',
          }}
        >
          <div
            className="w-[794px] h-[1123px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            style={{
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            {activeLayout ? (() => {
              const page = activeLayout.pages[activePage];
              if (!page) return null;
              const { width: pw, height: ph } = getPageDimensions(page.orientation);
              return (
                <div
                  style={{
                    width: pw,
                    height: ph,
                    position: 'relative',
                    overflow: 'hidden',
                    background: page.background.color ?? '#ffffff',
                  }}
                >
                  {[...page.elements]
                    .sort((a, b) => a.zIndex - b.zIndex)
                    .map((el) => (
                      <div
                        key={el.id}
                        style={{
                          position: 'absolute',
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          opacity: el.opacity ?? 1,
                          transform: `rotate(${el.rotation ?? 0}deg) scaleX(${el.flipX ? -1 : 1}) scaleY(${el.flipY ? -1 : 1})`,
                          visibility: el.visible ? 'visible' : 'hidden',
                          zIndex: el.zIndex,
                          overflow: 'hidden',
                        }}
                      >
                        <CanvasElementRenderer element={el} />
                      </div>
                    ))}
                </div>
              );
            })() : classicPages[activePage]}
          </div>
        </div>

        {/* 2.1 Zoom HUD (Floating) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-md shadow-2xl z-10">
          <button
            onClick={() => setZoomMode('fit')}
            title="Ajustar à Tela"
            className={cn(
              "p-2 rounded-sm transition-colors",
              zoomMode === 'fit' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={() => setZoomMode('width')}
            title="Ajustar à Largura"
            className={cn(
              "p-2 rounded-sm transition-colors",
              zoomMode === 'width' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <MoveHorizontal size={16} />
          </button>
          <button
            onClick={() => setZoomMode('original')}
            title="Tamanho Real (100%)"
            className={cn(
              "p-2 rounded-sm transition-colors",
              zoomMode === 'original' ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* 3. Navigation Controls - Fixed at bottom */}
      <div className="flex items-center gap-2 sm:gap-4 pb-6 pt-2 shrink-0">
        <button
          onClick={() => setActivePage(activePage - 1)}
          disabled={activePage === 0}
          className={cn(
            "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border",
            activePage === 0
              ? "text-slate-800 border-slate-900 cursor-not-allowed bg-slate-900/20"
              : "text-slate-400 border-slate-800 hover:text-indigo-400 hover:bg-slate-800 hover:border-indigo-500/50 bg-slate-900/40 shadow-sm"
          )}
        >
          <ChevronLeft size={14} strokeWidth={3} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex flex-col items-center min-w-[80px] sm:min-w-[100px]">
          <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest tabular-nums">
            Página
          </span>
          <span className="text-[11px] sm:text-[12px] font-mono font-bold text-slate-300 tabular-nums">
            {activePage + 1} <span className="text-slate-600">/</span> {pageCount}
          </span>
        </div>

        <button
          onClick={() => setActivePage(activePage + 1)}
          disabled={activePage === pageCount - 1}
          className={cn(
            "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border",
            activePage === pageCount - 1
              ? "text-slate-800 border-slate-900 cursor-not-allowed bg-slate-900/20"
              : "text-slate-400 border-slate-800 hover:text-indigo-400 hover:bg-slate-800 hover:border-indigo-500/50 bg-slate-900/40 shadow-sm"
          )}
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight size={14} strokeWidth={3} />
        </button>
      </div>

      {/* ── EXPORT PORTAL CONTAINER ──────────────────────── */}
      {isExportingPdf && createPortal(
        <div
          id="pdf-export-container"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '794px',
            pointerEvents: 'none',
            zIndex: -1000,
            opacity: 0.01,
            visibility: 'visible',
            display: 'block'
          }}
        >
          {activeLayout
            ? activeLayout.pages.map((page, i) => {
                if (proposalData.excludedPages?.includes(i)) return null;
                const isLandscape = page.orientation === 'landscape';
                return (
                  <div
                    key={`export-page-${i}`}
                    id={`export-page-${i}`}
                    className="export-page"
                    style={{
                      width: isLandscape ? '297mm' : '210mm',
                      height: isLandscape ? '210mm' : '297mm',
                      display: 'block',
                      backgroundColor: page.background.color ?? 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {[...page.elements]
                      .sort((a, b) => a.zIndex - b.zIndex)
                      .map((el) => (
                        <div
                          key={el.id}
                          style={{
                            position: 'absolute',
                            left: el.x,
                            top: el.y,
                            width: el.width,
                            height: el.height,
                            opacity: el.opacity ?? 1,
                            transform: `rotate(${el.rotation ?? 0}deg) scaleX(${el.flipX ? -1 : 1}) scaleY(${el.flipY ? -1 : 1})`,
                            visibility: el.visible ? 'visible' : 'hidden',
                            zIndex: el.zIndex,
                            overflow: 'hidden',
                          }}
                        >
                          <CanvasElementRenderer element={el} />
                        </div>
                      ))}
                  </div>
                );
              })
            : classicPages.map((page, i) => {
                if (proposalData.excludedPages?.includes(i)) return null;
                return (
                  <div
                    key={`export-page-${i}`}
                    id={`export-page-${i}`}
                    className="export-page"
                    style={{
                      width: '210mm',
                      height: '297mm',
                      display: 'block',
                      backgroundColor: 'white',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {page}
                  </div>
                );
              })}
        </div>,
        document.body
      )}
    </div>
  );
};
