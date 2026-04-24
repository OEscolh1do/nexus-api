import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { calculateProjectionStats } from '@/modules/engineering/utils/projectionMath';
import { ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Pages
import { ProposalPageCover } from './pages/ProposalPageCover';
import { ProposalPageInvestment } from './pages/ProposalPageInvestment';
import { ProposalPageTechnical } from './pages/ProposalPageTechnical';
import { ProposalPageSchedule } from './pages/ProposalPageSchedule';
import { ProposalPageContact } from './pages/ProposalPageContact';

export const ProposalDocumentPreview: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const getSimulatedTotal = useSolarStore(s => s.getSimulatedTotal);
  const proposalData = useSolarStore(s => s.proposalData);
  const modules = useSolarStore(selectModules);
  const activePage = useSolarStore(s => s.proposalActivePage);
  const setActivePage = useSolarStore(s => s.setProposalActivePage);
  const isExportingPdf = useSolarStore(s => s.isExportingPdf);
  const setExportingPdf = useSolarStore(s => s.setExportingPdf);

  const inverters = useTechStore(s => s.inverters.entities);
  const inverterIds = useTechStore(s => s.inverters.ids);
  const techState = useTechStore(s => s);

  // Derived calculations
  const totalPowerKwp = modules.reduce((acc, m) => acc + (m.power * (m.quantity || 1)), 0) / 1000;
  const totalModules = modules.reduce((acc, m) => acc + (m.quantity || 1), 0);
  const firstModule = modules[0];
  const firstInverter = inverterIds.length > 0 ? inverters[inverterIds[0]] : null;

  const stats = useMemo(() => {
    const prDecimal = techState.prCalculationMode === 'additive'
      ? techState.getAdditivePerformanceRatio()
      : techState.getPerformanceRatio();

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
      cosip: techState.cosip,
    });
  }, [modules, clientData, techState, getSimulatedTotal]);

  const monthlyGenAvg = Math.round(stats.totalGen / 12);

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
    monthlyGenAvg,
    isExportingPdf,
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const newScale = Math.min(1, (width - 2) / 794);
      setScale(newScale);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── MOTOR DE IMPRESSÃO NATIVO (Browser Print) ────────────────────
  React.useEffect(() => {
    if (!isExportingPdf) return;

    const handlePrint = async () => {
      
      // Aguarda os componentes carregarem no Portal
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Dispara a impressão
      window.print();

      // O reset do estado ocorre logo após o diálogo de impressão fechar
      setExportingPdf(false);
    };

    handlePrint();
  }, [isExportingPdf, setExportingPdf]);
  // ─────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  const pages = [
    <ProposalPageCover key="cover" {...pageData} />,
    <ProposalPageInvestment key="investment" {...pageData} />,
    <ProposalPageTechnical key="technical" {...pageData} />,
    <ProposalPageSchedule key="schedule" {...pageData} />,
    <ProposalPageContact key="contact" {...pageData} />,
  ];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[794px]">
      <div ref={containerRef} className="w-full flex flex-col items-center">
        {proposalData.excludedPages?.includes(activePage) && (
          <div className="w-[794px] max-w-full bg-amber-500/10 border border-amber-500/30 py-2 px-4 mb-4 rounded-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <EyeOff size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
              Esta página não será incluída no PDF final
            </span>
          </div>
        )}

        <div
          style={{
            width: `${794 * scale}px`,
            height: `${1123 * scale}px`,
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            className="w-[794px] h-[1123px] bg-white shadow-2xl"
            style={{
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
            }}
          >
            {pages[activePage]}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2 sm:gap-4 pb-12 sm:pb-8 pt-4">
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
            {activePage + 1} <span className="text-slate-600">/</span> {pages.length}
          </span>
        </div>

        <button
          onClick={() => setActivePage(activePage + 1)}
          disabled={activePage === pages.length - 1}
          className={cn(
            "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border",
            activePage === pages.length - 1
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
          {pages.map((page, i) => {
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
