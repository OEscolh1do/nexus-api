export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

export type CanvasElementType =
  | 'page-cover'
  | 'page-investment'
  | 'page-technical'
  | 'page-schedule'
  | 'page-contact'
  | 'text'
  | 'image'
  | 'logo'
  | 'watermark'
  | 'divider'
  | 'kpi-box'
  | 'chart-generation'
  | 'chart-financial'
  | 'payment-table'
  | 'schedule-timeline'
  | 'map-static';

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  props: Record<string, unknown>;
}

export interface CanvasPage {
  id: string;
  label: string;
  background: { color?: string; gradient?: string; imageUrl?: string };
  elements: CanvasElement[];
}

export interface ProposalTheme {
  primaryColor: string;
  accentColor: string;
  fontFamily: 'system' | 'inter' | 'montserrat';
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description?: string;
  isBuiltIn: boolean;
  createdAt: string;
  pages: CanvasPage[];
  theme: ProposalTheme;
}

export interface EditorSelection {
  pageId: string | null;
  elementId: string | null;
}

export interface GuideLines {
  x: number[];  // coordenadas de guias verticais (linhas x=?)
  y: number[];  // coordenadas de guias horizontais (linhas y=?)
}

export interface GridConfig {
  size: number;      // tamanho da célula em px do espaço A4 (ex: 8, 16, 24)
  visible: boolean;  // exibir grid visual
  snap: boolean;     // snap ao grid ao mover/redimensionar
  guides: boolean;   // smart guides entre elementos
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  size: 16,
  visible: true,
  snap: true,
  guides: true,
};

export const DEFAULT_ELEMENT_PROPS: Record<CanvasElementType, Record<string, unknown>> = {
  'page-cover':      {},
  'page-investment': {},
  'page-technical':  {},
  'page-schedule':   {},
  'page-contact':    {},
  text:              { content: 'Texto aqui', fontSize: 16, fontWeight: 400, color: '#1a1a1a', textAlign: 'left', fontFamily: 'system' },
  image:             { url: '', objectFit: 'contain' },
  logo:              { variant: 'verde' },
  watermark:         { text: 'CONFIDENCIAL', opacity: 0.08, angle: -45, fontSize: 72, color: '#000000' },
  divider:           { color: '#e2e8f0', thickness: 1, margin: 0 },
  'kpi-box':         { metric: 'power', label: 'Potência', unit: 'kWp', bgColor: '#f0fdf4', textColor: '#166534' },
  'chart-generation':{ showLegend: true },
  'chart-financial': { showLegend: true },
  'payment-table':   { showTotal: true },
  'schedule-timeline': { compact: false },
  'map-static':      { zoom: 17, showMarker: true },
};
