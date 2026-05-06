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
  | 'map-static'
  // Projeção — charts e widgets data-bound
  | 'chart-gen-consumption'
  | 'chart-roi'
  | 'chart-financial-balance'
  | 'chart-daily'
  | 'chart-credit-bank'
  | 'chart-loss-waterfall'
  | 'kpi-projection'
  | 'table-analytics'
  // Placeholder — campo dinâmico vinculado a dado do projeto
  | 'placeholder'
  // Dimensionamento Técnico — blocos decompostos da ProposalPageTechnical
  | 'section-header'
  | 'kpi-capacity-badge'
  | 'guarantees-list'
  | 'equipment-panel'
  // Primitivos de design
  | 'box'
  | 'icon';

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
  text:              { content: 'Texto aqui', fontSize: 16, fontWeight: 400, color: '#1a1a1a', textAlign: 'left', fontFamily: 'system', rotation: 0 },
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
  // Projeção
  'chart-gen-consumption':  { colorGen: '#0ea5e9', colorCons: '#f59e0b', showLegend: true, title: 'Geração vs Consumo' },
  'chart-roi':              { colorArea: '#10b981', colorLine: '#059669', showGrid: true, title: 'Retorno Acumulado' },
  'chart-financial-balance':{ colorBase: '#64748b', colorAddition: '#f59e0b', colorReduction: '#10b981', colorResult: '#6366f1', title: 'Balanço Financeiro' },
  'chart-daily':            { colorArea: '#6366f1', title: 'Geração Diária Estimada' },
  'chart-credit-bank':      { colorDeposit: '#22c55e', colorWithdraw: '#f87171', colorBalance: '#0ea5e9', title: 'Banco de Créditos' },
  'chart-loss-waterfall':   { title: 'Análise de Perdas' },
  'kpi-projection':         { metric: 'totalGen', bgColor: '#f0fdf4', textColor: '#166534', accentColor: '#10b981' },
  'table-analytics':        { showEconomy: true, title: 'Tabela Analítica' },
  'placeholder':            { field: 'client.name', prefix: '', suffix: '', fontSize: 14, fontWeight: 400, color: '#1a1a1a', textAlign: 'left', italic: false },
  'section-header':         { title: 'DIMENSIONAMENTO E\nVIABILIDADE DO PROJETO', subtitle: 'No momento da contratação é estabelecido um contrato formal de prestação de serviços com a NEONORTE, responsável pelo faturamento e emissão de Nota Fiscal de Serviço.', borderColor: '#1a3d2b', titleColor: '#0F172A', subtitleColor: '#64748B' },
  'kpi-capacity-badge':     { colorPower: '#2D6A4F', colorGen: '#4CAF50', labelColor: '#064E3B', showClientName: true },
  'guarantees-list':        { accentColor: '#4CAF50', headingColor: '#2D0A4E', customBullets: '' },
  'equipment-panel':        { labelBgColor: '#2D6A4F', labelColor: '#ffffff' },
  // Primitivos
  'box':                    { bgColor: '#e2e8f0', border: '', borderTop: '', borderRight: '', borderBottom: '', borderLeft: '', borderRadius: 0, opacity: 1, shadow: false },
  'icon':                   { name: 'Zap', size: 24, color: '#10b981', bgColor: '', bgRadius: 4 },
};
