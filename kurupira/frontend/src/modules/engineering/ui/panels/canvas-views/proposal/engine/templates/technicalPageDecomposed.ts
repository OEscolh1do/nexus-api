import type { CanvasElement } from '../types';
import { DEFAULT_ELEMENT_PROPS } from '../types';

/**
 * TECHNICAL_PAGE_ELEMENTS — Pre-positioned elements that recreate the layout
 * of ProposalPageTechnical.tsx as editable canvas blocks.
 *
 * Layout: A4 = 794×1123px
 * Left column (50%) | Right column (50%)
 */
export const TECHNICAL_PAGE_ELEMENTS: CanvasElement[] = [
  // 1. Watermark (background)
  {
    id: 'tech-watermark',
    type: 'watermark',
    x: 187,
    y: 300,
    width: 420,
    height: 420,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      text: 'NEONORTE',
      opacity: 0.035,
      angle: 0,
      fontSize: 72,
      color: '#2D6A4F',
      imageUrl: '/logos/simbolo-verde.png',
    },
  },

  // 2. Header section
  {
    id: 'tech-header',
    type: 'section-header',
    x: 0,
    y: 0,
    width: 500,
    height: 130,
    zIndex: 10,
    locked: false,
    visible: true,
    props: DEFAULT_ELEMENT_PROPS['section-header'],
  },

  // 3. Date placeholder
  {
    id: 'tech-date',
    type: 'placeholder',
    x: 556,
    y: 28,
    width: 190,
    height: 22,
    zIndex: 10,
    locked: false,
    visible: true,
    props: {
      field: 'proposal.date',
      prefix: '',
      suffix: '',
      fontSize: 11,
      fontWeight: 800,
      color: '#64748B',
      textAlign: 'right',
      italic: false,
    },
  },

  // 4. Circular logo
  {
    id: 'tech-logo',
    type: 'logo',
    x: 718,
    y: 44,
    width: 56,
    height: 56,
    zIndex: 10,
    locked: false,
    visible: true,
    props: { variant: 'verde' },
  },

  // 5. Horizontal divider header/body
  {
    id: 'tech-divider-h',
    type: 'divider',
    x: 0,
    y: 130,
    width: 794,
    height: 4,
    zIndex: 10,
    locked: false,
    visible: true,
    props: { color: '#E2E8F0', thickness: 1, margin: 0 },
  },

  // 6. Capacity badge (left column)
  {
    id: 'tech-kpi-badge',
    type: 'kpi-capacity-badge',
    x: 48,
    y: 150,
    width: 325,
    height: 100,
    zIndex: 10,
    locked: false,
    visible: true,
    props: DEFAULT_ELEMENT_PROPS['kpi-capacity-badge'],
  },

  // 7. Guarantees list (left column)
  {
    id: 'tech-guarantees',
    type: 'guarantees-list',
    x: 48,
    y: 262,
    width: 325,
    height: 240,
    zIndex: 10,
    locked: false,
    visible: true,
    props: DEFAULT_ELEMENT_PROPS['guarantees-list'],
  },

  // 8. Area chart — load profile (left column)
  {
    id: 'tech-chart-area',
    type: 'chart-gen-consumption',
    x: 48,
    y: 514,
    width: 325,
    height: 190,
    zIndex: 10,
    locked: false,
    visible: true,
    props: {
      colorGen: '#3B82F6',
      colorCons: '#06B6D4',
      showLegend: true,
      title: 'Perfil de Carga Anual',
    },
  },

  // 9. Satellite map (right column)
  {
    id: 'tech-map',
    type: 'map-static',
    x: 403,
    y: 150,
    width: 343,
    height: 175,
    zIndex: 10,
    locked: false,
    visible: true,
    props: { zoom: 20, showMarker: true },
  },

  // 10. KPI Solar Index (right column)
  {
    id: 'tech-kpi-solar',
    type: 'kpi-projection',
    x: 403,
    y: 335,
    width: 162,
    height: 88,
    zIndex: 10,
    locked: false,
    visible: true,
    props: { metric: 'avgHsp', bgColor: '#F8FAFC', textColor: '#2D0A4E', accentColor: '#4CAF50' },
  },

  // 11. KPI Coverage % (right column)
  {
    id: 'tech-kpi-coverage',
    type: 'kpi-projection',
    x: 573,
    y: 335,
    width: 173,
    height: 88,
    zIndex: 10,
    locked: false,
    visible: true,
    props: { metric: 'coverage', bgColor: '#F0FDF4', textColor: '#4CAF50', accentColor: '#2D6A4F' },
  },

  // 12. Equipment panel (right column)
  {
    id: 'tech-equipment',
    type: 'equipment-panel',
    x: 403,
    y: 433,
    width: 343,
    height: 150,
    zIndex: 10,
    locked: false,
    visible: true,
    props: DEFAULT_ELEMENT_PROPS['equipment-panel'],
  },

  // 13. Bar chart — performance projection (right column)
  {
    id: 'tech-chart-bar',
    type: 'chart-gen-consumption',
    x: 403,
    y: 593,
    width: 343,
    height: 230,
    zIndex: 10,
    locked: false,
    visible: true,
    props: {
      colorGen: '#F97316',
      colorCons: '#3B82F6',
      showLegend: true,
      title: 'Projeção de Desempenho',
    },
  },

  // 14. Footer green divider
  {
    id: 'tech-footer',
    type: 'divider',
    x: 0,
    y: 1111,
    width: 794,
    height: 6,
    zIndex: 10,
    locked: false,
    visible: true,
    props: { color: '#4CAF50', thickness: 6, margin: 0 },
  },
];
