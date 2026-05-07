import type { CanvasElement } from '../types';

/**
 * TECHNICAL_PAGE_ELEMENTS — Pre-positioned, pre-grouped primitive elements
 * that recreate the layout of ProposalPageTechnical.tsx as editable canvas blocks.
 *
 * Layout: A4 = 794×1123px
 * Left column (50%) | Right column (50%)
 */
export const TECHNICAL_PAGE_ELEMENTS: CanvasElement[] = [
  // 1. Watermark (background) — no group
  {
    id: 'tech-watermark',
    type: 'watermark',
    x: 187, y: 300, width: 420, height: 420,
    zIndex: 1, locked: false, visible: true,
    props: { text: 'NEONORTE', opacity: 0.035, angle: 0, fontSize: 72, color: '#2D6A4F' },
  },

  // 2. Header section — group: tech-header
  // Box borda topo
  { id: 'tech-hdr-bar', type: 'box', x: 0, y: 0, width: 794, height: 6, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-header',
    props: { bgColor: '#1a3d2b', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
  // Título
  { id: 'tech-hdr-title', type: 'text', x: 48, y: 14, width: 460, height: 68, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { content: 'DIMENSIONAMENTO E\nVIABILIDADE DO PROJETO', fontSize: 28, fontWeight: 900, color: '#0F172A', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  // Subtexto
  { id: 'tech-hdr-sub', type: 'text', x: 48, y: 88, width: 430, height: 40, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { content: 'No momento da contratação é estabelecido um contrato formal de prestação de serviços com a NEONORTE, responsável pelo faturamento e emissão de Nota Fiscal de Serviço.', fontSize: 10, fontWeight: 400, color: '#64748B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  // Data (placeholder)
  { id: 'tech-hdr-date', type: 'placeholder', x: 560, y: 30, width: 186, height: 20, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { field: 'proposal.date', prefix: '', suffix: '', fontSize: 11, fontWeight: 800, color: '#64748B', textAlign: 'right', italic: false } },
  // Logo
  { id: 'tech-hdr-logo', type: 'logo', x: 718, y: 46, width: 56, height: 56, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-header',
    props: { variant: 'verde' } },

  // 3. Divisória horizontal — no group
  { id: 'tech-divider-h', type: 'divider', x: 0, y: 132, width: 794, height: 1, zIndex: 10,
    locked: false, visible: true,
    props: { color: '#E2E8F0', thickness: 1, margin: 0 } },

  // 4. Badge de Capacidade (col esq) — group: tech-kpi-badge
  // Nome do cliente
  { id: 'tech-kpi-badge-name', type: 'placeholder', x: 48, y: 150, width: 325, height: 20, zIndex: 11,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { field: 'client.name', prefix: '', suffix: '', fontSize: 13, fontWeight: 900, color: '#2D6A4F', textAlign: 'left', italic: false } },
  // Label vertical (verde claro)
  { id: 'tech-kpi-badge-label', type: 'box', x: 48, y: 172, width: 22, height: 78, zIndex: 12,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { bgColor: '#4CAF50', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
  // Texto "PROJETO" vertical
  { id: 'tech-kpi-badge-label-text', type: 'text', x: 48, y: 172, width: 22, height: 78, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { content: 'PROJETO', fontSize: 8, fontWeight: 900, color: '#064E3B', textAlign: 'center', fontFamily: 'system', rotation: -90 } },
  // Coluna Potência (verde escuro)
  { id: 'tech-kpi-badge-power-bg', type: 'box', x: 70, y: 172, width: 150, height: 78, zIndex: 12,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { bgColor: '#2D6A4F', border: '', borderTop: '', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
  { id: 'tech-kpi-badge-power-label', type: 'text', x: 80, y: 180, width: 130, height: 14, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { content: 'Potência Nominal', fontSize: 9, fontWeight: 800, color: '#ffffff', textAlign: 'center', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-kpi-badge-power-value', type: 'placeholder', x: 80, y: 198, width: 130, height: 40, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { field: 'project.power', prefix: '', suffix: '', fontSize: 22, fontWeight: 900, color: '#ffffff', textAlign: 'center', italic: false } },
  // Coluna Geração (verde claro)
  { id: 'tech-kpi-badge-gen-bg', type: 'box', x: 220, y: 172, width: 153, height: 78, zIndex: 12,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { bgColor: '#4CAF50', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
  { id: 'tech-kpi-badge-gen-label', type: 'text', x: 230, y: 180, width: 130, height: 14, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { content: 'Geração Mensal', fontSize: 9, fontWeight: 800, color: '#064E3B', textAlign: 'center', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-kpi-badge-gen-value', type: 'placeholder', x: 230, y: 198, width: 130, height: 40, zIndex: 13,
    locked: false, visible: true, groupId: 'tech-kpi-badge',
    props: { field: 'project.monthlyGen', prefix: '', suffix: '', fontSize: 16, fontWeight: 900, color: '#064E3B', textAlign: 'center', italic: false } },

  // 5. Seção "Padrão Neonorte" — group: tech-guarantees-hdr
  { id: 'tech-guar-bar', type: 'box', x: 48, y: 262, width: 3, height: 12, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-guarantees-hdr',
    props: { bgColor: '#4CAF50', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 1, opacity: 1, shadow: false } },
  { id: 'tech-guar-title', type: 'text', x: 57, y: 260, width: 280, height: 16, zIndex: 10,
    locked: false, visible: true, groupId: 'tech-guarantees-hdr',
    props: { content: 'PADRÃO NEONORTE', fontSize: 12, fontWeight: 900, color: '#2D0A4E', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-guar-intro', type: 'text', x: 48, y: 280, width: 320, height: 30, zIndex: 10,
    locked: false, visible: true,
    props: { content: 'A elaboração do orçamento e avaliações técnicas são feitas sem qualquer compromisso ou custo.', fontSize: 10, fontWeight: 400, color: '#334155', textAlign: 'left', fontFamily: 'system', rotation: 0 } },

  // Bullets de garantia (cada um é um grupo separado)
  // Bullet 1: Inversores — group: tech-guar-1
  { id: 'tech-guar-1-bg', type: 'box', x: 48, y: 322, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { bgColor: '#f0fdf4', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 6, opacity: 1, shadow: false } },
  { id: 'tech-guar-1-icon', type: 'icon', x: 52, y: 326, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { name: 'Zap', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-1-title', type: 'text', x: 84, y: 322, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { content: 'Inversores Solares', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-guar-1-desc', type: 'text', x: 84, y: 338, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-1',
    props: { content: '7 anos de garantia contra defeitos de fabricação.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0 } },

  // Bullet 2: Módulos — group: tech-guar-2
  { id: 'tech-guar-2-bg', type: 'box', x: 48, y: 366, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { bgColor: '#f0fdf4', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 6, opacity: 1, shadow: false } },
  { id: 'tech-guar-2-icon', type: 'icon', x: 52, y: 370, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { name: 'Shield', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-2-title', type: 'text', x: 84, y: 366, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { content: 'Módulos Fotovoltaicos', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-guar-2-desc', type: 'text', x: 84, y: 382, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-2',
    props: { content: '25 anos de garantia de geração (mín. 80% de eficiência).', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0 } },

  // Bullet 3: String Box — group: tech-guar-3
  { id: 'tech-guar-3-bg', type: 'box', x: 48, y: 410, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { bgColor: '#f0fdf4', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 6, opacity: 1, shadow: false } },
  { id: 'tech-guar-3-icon', type: 'icon', x: 52, y: 414, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { name: 'Wrench', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-3-title', type: 'text', x: 84, y: 410, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { content: 'String Box e Estrutura', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-guar-3-desc', type: 'text', x: 84, y: 426, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-3',
    props: { content: '12 meses contra defeitos de fabricação.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0 } },

  // Bullet 4: Engenharia — group: tech-guar-4
  { id: 'tech-guar-4-bg', type: 'box', x: 48, y: 454, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { bgColor: '#f0fdf4', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 6, opacity: 1, shadow: false } },
  { id: 'tech-guar-4-icon', type: 'icon', x: 52, y: 458, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { name: 'ClipboardCheck', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-4-title', type: 'text', x: 84, y: 454, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { content: 'Engenharia', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-guar-4-desc', type: 'text', x: 84, y: 470, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-4',
    props: { content: '6 meses de garantia técnica sobre o projeto.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0 } },

  // Bullet 5: Assistência — group: tech-guar-5
  { id: 'tech-guar-5-bg', type: 'box', x: 48, y: 498, width: 28, height: 28, zIndex: 11, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { bgColor: '#f0fdf4', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 6, opacity: 1, shadow: false } },
  { id: 'tech-guar-5-icon', type: 'icon', x: 52, y: 502, width: 20, height: 20, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { name: 'Sparkles', size: 14, color: '#16a34a', bgColor: '', bgRadius: 0 } },
  { id: 'tech-guar-5-title', type: 'text', x: 84, y: 498, width: 280, height: 14, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { content: 'Assistência Técnica', fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-guar-5-desc', type: 'text', x: 84, y: 514, width: 280, height: 16, zIndex: 12, locked: false, visible: true, groupId: 'tech-guar-5',
    props: { content: '6 meses de consultoria e suporte especializado.', fontSize: 9, fontWeight: 400, color: '#475569', textAlign: 'left', fontFamily: 'system', rotation: 0 } },

  // 6. Gráfico Perfil de Carga (col esq) — no group
  { id: 'tech-chart-area', type: 'chart-gen-consumption', x: 48, y: 550, width: 325, height: 190,
    zIndex: 10, locked: false, visible: true,
    props: { colorGen: '#3B82F6', colorCons: '#06B6D4', showLegend: true, title: 'Perfil de Carga Anual' } },

  // 7. Mapa satélite (col dir) — no group
  { id: 'tech-map', type: 'map-static', x: 403, y: 150, width: 343, height: 175,
    zIndex: 10, locked: false, visible: true,
    props: { zoom: 20, showMarker: true } },

  // 8. KPI Índice Solar (col dir) — no group
  { id: 'tech-kpi-solar', type: 'kpi-projection', x: 403, y: 335, width: 162, height: 88,
    zIndex: 10, locked: false, visible: true,
    props: { metric: 'totalPowerKwp', bgColor: '#F8FAFC', textColor: '#2D0A4E', accentColor: '#4CAF50' } },

  // 9. KPI Cobertura % (col dir) — no group
  { id: 'tech-kpi-cov', type: 'kpi-projection', x: 573, y: 335, width: 173, height: 88,
    zIndex: 10, locked: false, visible: true,
    props: { metric: 'coverage', bgColor: '#F0FDF4', textColor: '#4CAF50', accentColor: '#2D6A4F' } },

  // 10. Painel de Equipamentos (col dir) — group: tech-equipment
  // Fundo geral
  { id: 'tech-equip-bg', type: 'box', x: 403, y: 433, width: 343, height: 155, zIndex: 11, locked: false, visible: true, groupId: 'tech-equipment',
    props: { bgColor: '#ffffff', border: '1px solid #E2E8F0', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 8, opacity: 1, shadow: true } },
  // Label lateral (verde escuro)
  { id: 'tech-equip-label-bg', type: 'box', x: 403, y: 433, width: 24, height: 155, zIndex: 12, locked: false, visible: true, groupId: 'tech-equipment',
    props: { bgColor: '#2D6A4F', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false } },
  { id: 'tech-equip-label-text', type: 'text', x: 403, y: 433, width: 24, height: 155, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { content: 'EQUIPAMENTOS', fontSize: 9, fontWeight: 900, color: '#ffffff', textAlign: 'center', fontFamily: 'system', rotation: -90 } },
  // Seção Módulos
  { id: 'tech-equip-mod-label', type: 'text', x: 435, y: 443, width: 100, height: 12, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { content: 'Módulos', fontSize: 8, fontWeight: 900, color: '#94A3B8', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-equip-mod-count', type: 'placeholder', x: 491, y: 443, width: 120, height: 12, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.modules', prefix: '· ', suffix: '', fontSize: 8, fontWeight: 700, color: '#94A3B8', textAlign: 'left', italic: false } },
  { id: 'tech-equip-mod-model', type: 'placeholder', x: 435, y: 459, width: 220, height: 16, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.moduleModel', prefix: '', suffix: '', fontSize: 11, fontWeight: 900, color: '#1E293B', textAlign: 'left', italic: false } },
  // Divisória
  { id: 'tech-equip-divider', type: 'divider', x: 427, y: 513, width: 319, height: 1, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { color: '#E2E8F0', thickness: 1, margin: 0 } },
  // Seção Inversores
  { id: 'tech-equip-inv-label', type: 'text', x: 435, y: 523, width: 150, height: 12, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { content: 'Inversores', fontSize: 8, fontWeight: 900, color: '#94A3B8', textAlign: 'left', fontFamily: 'system', rotation: 0 } },
  { id: 'tech-equip-inv-model', type: 'placeholder', x: 435, y: 539, width: 220, height: 16, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.inverterModel', prefix: '', suffix: '', fontSize: 11, fontWeight: 900, color: '#1E293B', textAlign: 'left', italic: false } },
  { id: 'tech-equip-inv-power', type: 'placeholder', x: 435, y: 559, width: 220, height: 14, zIndex: 13, locked: false, visible: true, groupId: 'tech-equipment',
    props: { field: 'project.power', prefix: 'Potência: ', suffix: '', fontSize: 9, fontWeight: 600, color: '#64748B', textAlign: 'left', italic: false } },

  // 11. Gráfico Projeção Desempenho (col dir) — no group
  { id: 'tech-chart-bar', type: 'chart-gen-consumption', x: 403, y: 598, width: 343, height: 225,
    zIndex: 10, locked: false, visible: true,
    props: { colorGen: '#F97316', colorCons: '#3B82F6', showLegend: true, title: 'Projeção de Desempenho' } },

  // 12. Rodapé (sem grupo)
  { id: 'tech-footer', type: 'divider', x: 0, y: 1117, width: 794, height: 6,
    zIndex: 10, locked: false, visible: true,
    props: { color: '#4CAF50', thickness: 6, margin: 0 } },
];
