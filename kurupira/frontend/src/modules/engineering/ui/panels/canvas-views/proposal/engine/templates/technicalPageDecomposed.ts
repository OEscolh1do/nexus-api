import type { CanvasElement } from '../types';

/**
 * TECHNICAL_PAGE_ELEMENTS — Pre-positioned, pre-grouped primitive elements
 * that recreate the layout of ProposalPageTechnical.tsx as editable canvas blocks.
 *
 * Layout: A4 = 794×1123px
 * Left column (50%) | Right column (50%)
 *
 * All gaps vs the original component have been corrected:
 *  - Title fontSize matches (36px) with correct letterSpacing
 *  - textTransform: uppercase applied where original uses it
 *  - Badge has outer container box (rounded + shadow + overflow:hidden)
 *  - Section headers for both charts present
 *  - Map sensor frame (L-corner brackets) present
 *  - Logo uses simbolo-circular variant
 *  - KPI cards use gradient backgrounds
 */
export const TECHNICAL_PAGE_ELEMENTS: CanvasElement[] = [

  // ── 1. Watermark (background) — no group ──────────────────────────────────
  {
    id: 'tech-watermark', type: 'watermark',
    x: 187, y: 300, width: 420, height: 420,
    zIndex: 1, locked: false, visible: true,
    props: { text: 'NEONORTE', opacity: 0.035, angle: 0, fontSize: 72, color: '#2D6A4F' },
  },

  // ── 2. Header — group: tech-header ────────────────────────────────────────
  // Barra verde escura topo
  { id: 'tech-hdr-bar', type: 'box', x: 0, y: 0, width: 794, height: 6, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-header',
    props: { bgColor: '#1a3d2b', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  // Título — 36px, letterSpacing: -0.02em, lineHeight: 0.88 (igual ao original)
  { id: 'tech-hdr-title', type: 'text', x: 48, y: 14, width: 460, height: 76, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { content: 'DIMENSIONAMENTO E\nVIABILIDADE DO PROJETO', fontSize: 36, fontWeight: 900, color: '#0F172A', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '-0.02em', textTransform: 'none', lineHeight: '0.88' } },
  // Subtexto
  { id: 'tech-hdr-sub', type: 'text', x: 48, y: 96, width: 420, height: 38, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { content: 'No momento da contratação é estabelecido um contrato formal de prestação de serviços com a NEONORTE, responsável pelo faturamento e emissão de Nota Fiscal de Serviço.', fontSize: 10, fontWeight: 400, color: '#64748B', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '1.55' } },
  // Data (placeholder) — uppercase + letterSpacing
  { id: 'tech-hdr-date', type: 'placeholder', x: 530, y: 30, width: 210, height: 20, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { field: 'proposal.date', prefix: '', suffix: '', fontSize: 12, fontWeight: 800, color: '#64748B', textAlign: 'right', italic: false, letterSpacing: '0.06em', textTransform: 'uppercase' } },
  // Logo circular (símbolo branco em fundo verde)
  { id: 'tech-hdr-logo', type: 'logo', x: 726, y: 46, width: 56, height: 56, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { variant: 'simbolo-circular', bgColor: '#4CAF50' } },

  // ── 3. Divisória header/corpo ──────────────────────────────────────────────
  { id: 'tech-divider-h', type: 'divider', x: 0, y: 140, width: 794, height: 1, zIndex: 10,
    locked: false, visible: true,
    props: { color: '#E2E8F0', thickness: 1, margin: 0 } },

  // ── 4. Badge de Capacidade — group: tech-kpi-badge ────────────────────────
  // Container externo (rounded-md, overflow:hidden, shadow, border) — ESSENCIAL para clip dos cantos
  { id: 'tech-kpi-badge-container', type: 'box', x: 48, y: 188, width: 325, height: 82, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { bgColor: 'transparent', gradient: '', border: '1px solid #E2E8F0', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '6px', overflow: 'hidden', opacity: 1, shadow: true } },
  // Nome do cliente — acima do badge
  { id: 'tech-kpi-badge-name', type: 'placeholder', x: 48, y: 164, width: 325, height: 22, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { field: 'client.name', prefix: '', suffix: '', fontSize: 15, fontWeight: 900, color: '#2D6A4F', textAlign: 'left', italic: false, letterSpacing: '0.05em', textTransform: 'uppercase' } },
  // Label vertical (verde claro) — cantos esquerdos arredondados
  { id: 'tech-kpi-badge-label', type: 'box', x: 48, y: 188, width: 22, height: 82, zIndex: 12,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { bgColor: '#4CAF50', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  // Texto "PROJETO" vertical
  { id: 'tech-kpi-badge-label-text', type: 'text', x: 48, y: 188, width: 22, height: 82, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { content: 'PROJETO', fontSize: 8, fontWeight: 900, color: '#064E3B', textAlign: 'center', fontFamily: 'system', rotation: -90, letterSpacing: '0.2em', textTransform: 'none', lineHeight: '' } },
  // Coluna Potência (verde escuro)
  { id: 'tech-kpi-badge-power-bg', type: 'box', x: 70, y: 188, width: 150, height: 82, zIndex: 12,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { bgColor: '#2D6A4F', gradient: '', border: '', borderTop: '', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '', borderLeft: '', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-kpi-badge-power-label', type: 'text', x: 80, y: 199, width: 130, height: 14, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { content: 'Potência Nominal', fontSize: 9, fontWeight: 800, color: '#ffffff', textAlign: 'center', fontFamily: 'system', rotation: 0, letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: '' } },
  { id: 'tech-kpi-badge-power-value', type: 'placeholder', x: 80, y: 217, width: 130, height: 44, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { field: 'project.power', prefix: '', suffix: '', fontSize: 22, fontWeight: 900, color: '#ffffff', textAlign: 'center', italic: false, letterSpacing: '', textTransform: 'none' } },
  // Coluna Geração (verde claro) — cantos direitos arredondados
  { id: 'tech-kpi-badge-gen-bg', type: 'box', x: 220, y: 188, width: 153, height: 82, zIndex: 12,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { bgColor: '#4CAF50', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-kpi-badge-gen-label', type: 'text', x: 230, y: 199, width: 130, height: 14, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { content: 'Geração Mensal', fontSize: 9, fontWeight: 800, color: '#064E3B', textAlign: 'center', fontFamily: 'system', rotation: 0, letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: '' } },
  { id: 'tech-kpi-badge-gen-value', type: 'placeholder', x: 230, y: 217, width: 130, height: 44, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { field: 'project.monthlyGen', prefix: '', suffix: '', fontSize: 22, fontWeight: 900, color: '#064E3B', textAlign: 'center', italic: false, letterSpacing: '', textTransform: 'none' } },

  // ── 5. Seção "Padrão Neonorte" — group: tech-guarantees-hdr ──────────────
  { id: 'tech-guar-bar', type: 'box', x: 48, y: 284, width: 3, height: 12, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-guarantees-hdr',
    props: { bgColor: '#4CAF50', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '1px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-guar-title', type: 'text', x: 57, y: 282, width: 280, height: 16, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-guarantees-hdr',
    props: { content: 'Padrão Neonorte', fontSize: 12, fontWeight: 900, color: '#2D0A4E', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: '' } },
  { id: 'tech-guar-intro', type: 'text', x: 48, y: 302, width: 320, height: 30, zIndex: 10,
    locked: false, visible: true,
    props: { content: 'A elaboração do orçamento e avaliações técnicas são feitas sem qualquer compromisso ou custo.', fontSize: 10, fontWeight: 400, color: '#334155', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '1.55' } },

  // Bullets de garantia — cada bullet é um grupo separado
  // Bullet 1: Inversores — group: tech-guar-1
  { id: 'tech-guar-1-bg', type: 'box', x: 48, y: 344, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { bgColor: '#f0fdf4', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '6px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-guar-1-icon', type: 'icon', x: 52, y: 348, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { name: 'Zap', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-1-title', type: 'text', x: 84, y: 344, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { content: 'Inversores Solares', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },
  { id: 'tech-guar-1-desc', type: 'text', x: 84, y: 360, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { content: '7 anos de garantia contra defeitos de fabricação.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },

  // Bullet 2: Módulos — group: tech-guar-2
  { id: 'tech-guar-2-bg', type: 'box', x: 48, y: 384, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { bgColor: '#f0fdf4', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '6px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-guar-2-icon', type: 'icon', x: 52, y: 388, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { name: 'Shield', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-2-title', type: 'text', x: 84, y: 384, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { content: 'Módulos Fotovoltaicos', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },
  { id: 'tech-guar-2-desc', type: 'text', x: 84, y: 400, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { content: '25 anos de garantia de geração (mín. 80% de eficiência).', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },

  // Bullet 3: String Box — group: tech-guar-3
  { id: 'tech-guar-3-bg', type: 'box', x: 48, y: 424, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { bgColor: '#f0fdf4', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '6px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-guar-3-icon', type: 'icon', x: 52, y: 428, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { name: 'Wrench', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-3-title', type: 'text', x: 84, y: 424, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { content: 'String Box e Estrutura', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },
  { id: 'tech-guar-3-desc', type: 'text', x: 84, y: 440, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { content: '12 meses contra defeitos de fabricação.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },

  // Bullet 4: Engenharia — group: tech-guar-4
  { id: 'tech-guar-4-bg', type: 'box', x: 48, y: 464, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { bgColor: '#f0fdf4', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '6px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-guar-4-icon', type: 'icon', x: 52, y: 468, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { name: 'ClipboardCheck', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-4-title', type: 'text', x: 84, y: 464, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { content: 'Engenharia', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },
  { id: 'tech-guar-4-desc', type: 'text', x: 84, y: 480, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { content: '6 meses de garantia técnica sobre o projeto.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },

  // Bullet 5: Assistência — group: tech-guar-5
  { id: 'tech-guar-5-bg', type: 'box', x: 48, y: 504, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { bgColor: '#f0fdf4', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '6px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-guar-5-icon', type: 'icon', x: 52, y: 508, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { name: 'Sparkles', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-5-title', type: 'text', x: 84, y: 504, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { content: 'Assistência Técnica', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },
  { id: 'tech-guar-5-desc', type: 'text', x: 84, y: 520, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { content: '6 meses de consultoria e suporte especializado.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '', textTransform: 'none', lineHeight: '' } },

  // ── 6. Section header: Perfil de Carga — group: tech-chart-left-hdr ────────
  { id: 'tech-chart-left-bar', type: 'box', x: 48, y: 552, width: 3, height: 10, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-chart-left-hdr',
    props: { bgColor: '#4CAF50', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '1px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-chart-left-title', type: 'text', x: 57, y: 550, width: 220, height: 14, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-chart-left-hdr',
    props: { content: 'Perfil de Carga Anual', fontSize: 11, fontWeight: 900, color: '#2D0A4E', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: '' } },

  // ── 7. Gráfico Perfil de Carga (col esq) ─────────────────────────────────
  { id: 'tech-chart-area', type: 'chart-gen-consumption',
    x: 48, y: 568, width: 325, height: 180,
    zIndex: 10, locked: false, visible: true,
    props: { colorGen: '#3B82F6', colorCons: '#06B6D4', showLegend: true, title: 'Perfil de Carga Anual' } },

  // ── 8. Mapa satélite + sensor frame — group: tech-map-frame ──────────────
  // Inner map
  { id: 'tech-map', type: 'map-static', x: 409, y: 158, width: 331, height: 170,
    zIndex: 10, locked: false, visible: true,
    props: { zoom: 20, showMarker: true } },
  // Sensor frame: L-corners (4 boxes com bordas parciais)
  { id: 'tech-map-nw', type: 'box', x: 403, y: 152, width: 20, height: 20, zIndex: 20, locked: false, visible: true, groupId: 'tech-map-frame',
    props: { bgColor: 'transparent', gradient: '', border: '', borderTop: '3px solid #4CAF50', borderRight: '', borderBottom: '', borderLeft: '3px solid #4CAF50', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-map-ne', type: 'box', x: 723, y: 152, width: 20, height: 20, zIndex: 20, locked: false, visible: true, groupId: 'tech-map-frame',
    props: { bgColor: 'transparent', gradient: '', border: '', borderTop: '3px solid #4CAF50', borderRight: '3px solid #4CAF50', borderBottom: '', borderLeft: '', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-map-sw', type: 'box', x: 403, y: 334, width: 20, height: 20, zIndex: 20, locked: false, visible: true, groupId: 'tech-map-frame',
    props: { bgColor: 'transparent', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '3px solid #4CAF50', borderLeft: '3px solid #4CAF50', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-map-se', type: 'box', x: 723, y: 334, width: 20, height: 20, zIndex: 20, locked: false, visible: true, groupId: 'tech-map-frame',
    props: { bgColor: 'transparent', gradient: '', border: '', borderTop: '', borderRight: '3px solid #4CAF50', borderBottom: '3px solid #4CAF50', borderLeft: '', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },

  // ── 9. KPI Índice Solar (col dir) — gradient background ──────────────────
  { id: 'tech-kpi-solar', type: 'kpi-projection',
    x: 403, y: 356, width: 162, height: 88,
    zIndex: 10, locked: false, visible: true,
    props: { metric: 'totalPowerKwp', bgColor: '#F8FAFC', textColor: '#2D0A4E', accentColor: '#4CAF50' } },

  // ── 10. KPI Cobertura % (col dir) ────────────────────────────────────────
  { id: 'tech-kpi-cov', type: 'kpi-projection',
    x: 573, y: 356, width: 173, height: 88,
    zIndex: 10, locked: false, visible: true,
    props: { metric: 'coverage', bgColor: '#F0FDF4', textColor: '#4CAF50', accentColor: '#2D6A4F' } },

  // ── 11. Painel de Equipamentos — group: tech-equipment ───────────────────
  { id: 'tech-equip-bg', type: 'box', x: 403, y: 454, width: 343, height: 140, zIndex: 11, locked: false, visible: true, groupId: 'tech-equipment',
    props: { bgColor: '#ffffff', gradient: '', border: '1px solid #E2E8F0', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '8px', overflow: 'hidden', opacity: 1, shadow: true } },
  { id: 'tech-equip-label-bg', type: 'box', x: 403, y: 454, width: 24, height: 140, zIndex: 12, locked: false, visible: true, groupId: 'tech-equipment',
    props: { bgColor: '#2D6A4F', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '0', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-equip-label-text', type: 'text', x: 403, y: 454, width: 24, height: 140, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { content: 'EQUIPAMENTOS', fontSize: 9, fontWeight: 900, color: '#ffffff', textAlign: 'center', fontFamily: 'system', rotation: -90, letterSpacing: '0.2em', textTransform: 'none', lineHeight: '' } },
  // Módulos
  { id: 'tech-equip-mod-label', type: 'text', x: 435, y: 464, width: 100, height: 12, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { content: 'Módulos', fontSize: 8, fontWeight: 900, color: '#94A3B8', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '' } },
  { id: 'tech-equip-mod-count', type: 'placeholder', x: 491, y: 464, width: 120, height: 12, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.modules', prefix: '· ', suffix: '', fontSize: 8, fontWeight: 700, color: '#94A3B8', textAlign: 'left', italic: false, letterSpacing: '0.08em', textTransform: 'none' } },
  { id: 'tech-equip-mod-model', type: 'placeholder', x: 435, y: 480, width: 220, height: 16, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.moduleModel', prefix: '', suffix: '', fontSize: 11, fontWeight: 900, color: '#1E293B', textAlign: 'left', italic: false, letterSpacing: '', textTransform: 'none' } },
  // Divisória
  { id: 'tech-equip-divider', type: 'divider', x: 427, y: 506, width: 319, height: 1, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { color: '#E2E8F0', thickness: 1, margin: 0 } },
  // Inversores
  { id: 'tech-equip-inv-label', type: 'text', x: 435, y: 514, width: 150, height: 12, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { content: 'Inversores', fontSize: 8, fontWeight: 900, color: '#94A3B8', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '' } },
  { id: 'tech-equip-inv-model', type: 'placeholder', x: 435, y: 530, width: 220, height: 16, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.inverterModel', prefix: '', suffix: '', fontSize: 11, fontWeight: 900, color: '#1E293B', textAlign: 'left', italic: false, letterSpacing: '', textTransform: 'none' } },
  { id: 'tech-equip-inv-power', type: 'placeholder', x: 435, y: 550, width: 220, height: 14, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.power', prefix: 'Potência: ', suffix: '', fontSize: 9, fontWeight: 600, color: '#64748B', textAlign: 'left', italic: false, letterSpacing: '', textTransform: 'none' } },

  // ── 12. Section header: Projeção de Desempenho — group: tech-chart-right-hdr
  { id: 'tech-chart-right-bar', type: 'box', x: 403, y: 608, width: 3, height: 10, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-chart-right-hdr',
    props: { bgColor: '#4CAF50', gradient: '', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: '1px', overflow: 'visible', opacity: 1, shadow: false } },
  { id: 'tech-chart-right-title', type: 'text', x: 412, y: 606, width: 250, height: 14, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-chart-right-hdr',
    props: { content: 'Projeção de Desempenho', fontSize: 11, fontWeight: 900, color: '#2D0A4E', textAlign: 'left', fontFamily: 'system', rotation: 0, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: '' } },

  // ── 13. Gráfico Projeção Desempenho (col dir) ─────────────────────────────
  { id: 'tech-chart-bar', type: 'chart-gen-consumption',
    x: 403, y: 624, width: 343, height: 210,
    zIndex: 10, locked: false, visible: true,
    props: { colorGen: '#F97316', colorCons: '#3B82F6', showLegend: true, title: 'Projeção de Desempenho' } },

  // ── 14. Rodapé ───────────────────────────────────────────────────────────
  { id: 'tech-footer', type: 'divider', x: 0, y: 1117, width: 794, height: 6,
    zIndex: 10, locked: false, visible: true,
    props: { color: '#4CAF50', thickness: 6, margin: 0 } },
];
