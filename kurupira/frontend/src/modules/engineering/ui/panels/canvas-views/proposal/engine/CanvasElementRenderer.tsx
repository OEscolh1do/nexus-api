import { ProposalPageTechnical } from '../pages/ProposalPageTechnical';
import { TextElement } from './elements/TextElement';
import { ImageElement } from './elements/ImageElement';
import { LogoElement } from './elements/LogoElement';
import { WatermarkElement } from './elements/WatermarkElement';
import { DividerElement } from './elements/DividerElement';
import {
  ChartGenConsumptionElement,
  ChartROIElement,
  ChartFinancialBalanceElement,
  ChartCreditBankElement,
  ChartDailyElement,
  ChartLossWaterfallElement,
  KpiProjectionElement,
  TableAnalyticsElement,
} from './elements/ProjectionElements';
import { PlaceholderElement } from './elements/PlaceholderElement';
import {
  KpiBoxElement,
  ChartGenerationElement,
  ChartFinancialElement,
  PaymentTableElement,
  ScheduleTimelineElement,
  MapStaticElement,
} from './elements/LegacyElements';
import { BoxElement } from './elements/BoxElement';
import { IconElement } from './elements/IconElement';
import {
  SectionHeaderElement,
  KpiCapacityBadgeElement,
  GuaranteesListElement,
  EquipmentPanelElement,
} from './elements/TechnicalElements';
import { useProposalPageData } from './useProposalPageData';
import type { CanvasElement } from './types';

interface Props {
  element: CanvasElement;
  isEditing?: boolean;
  onPropsChange?: (props: Record<string, unknown>) => void;
}

function PageRenderer({ element }: Pick<Props, 'element'>) {
  const pageData = useProposalPageData();

  if (element.type === 'page-technical') return <ProposalPageTechnical {...pageData} />;
  return null;
}

const NOOP_PROPS_CHANGE = (_props: Record<string, unknown>) => {};

type ElementRenderer = (props: {
  element: CanvasElement;
  isEditing?: boolean;
  onPropsChange?: (props: Record<string, unknown>) => void;
}) => React.ReactElement | null;

// Registry mapping element.type to its renderer component.
// Replaces the switch statement — add new element types here.
const ELEMENT_REGISTRY: Partial<Record<CanvasElement['type'], ElementRenderer>> = {
  // ── Core elements ─────────────────────────────────────────────────────────
  text:     ({ element, isEditing, onPropsChange }) => <TextElement element={element} isEditing={isEditing ?? false} onPropsChange={onPropsChange ?? NOOP_PROPS_CHANGE} />,
  image:    ({ element }) => <ImageElement element={element} />,
  logo:     ({ element }) => <LogoElement element={element} />,
  watermark:({ element }) => <WatermarkElement element={element} />,
  divider:  ({ element }) => <DividerElement element={element} />,
  // ── Legacy elements ───────────────────────────────────────────────────────
  'kpi-box':           ({ element }) => <KpiBoxElement element={element} />,
  'chart-generation':  ({ element }) => <ChartGenerationElement element={element} />,
  'chart-financial':   ({ element }) => <ChartFinancialElement element={element} />,
  'payment-table':     ({ element }) => <PaymentTableElement element={element} />,
  'schedule-timeline': ({ element }) => <ScheduleTimelineElement element={element} />,
  'map-static':        ({ element }) => <MapStaticElement element={element} />,
  // ── Elementos de Projeção ─────────────────────────────────────────────────
  'chart-gen-consumption':  ({ element }) => <ChartGenConsumptionElement element={element} />,
  'chart-roi':              ({ element }) => <ChartROIElement element={element} />,
  'chart-financial-balance':({ element }) => <ChartFinancialBalanceElement element={element} />,
  'chart-credit-bank':      ({ element }) => <ChartCreditBankElement element={element} />,
  'chart-daily':            ({ element }) => <ChartDailyElement element={element} />,
  'chart-loss-waterfall':   ({ element }) => <ChartLossWaterfallElement element={element} />,
  'kpi-projection':         ({ element }) => <KpiProjectionElement element={element} />,
  'table-analytics':        ({ element }) => <TableAnalyticsElement element={element} />,
  placeholder:              ({ element }) => <PlaceholderElement element={element} />,
  // ── Elementos de Dimensionamento Técnico ──────────────────────────────────
  'section-header':     ({ element }) => <SectionHeaderElement element={element} />,
  'kpi-capacity-badge': ({ element }) => <KpiCapacityBadgeElement element={element} />,
  'guarantees-list':    ({ element }) => <GuaranteesListElement element={element} />,
  'equipment-panel':    ({ element }) => <EquipmentPanelElement element={element} />,
  // ── Primitivos de design ──────────────────────────────────────────────────
  box:  ({ element }) => <BoxElement element={element} />,
  icon: ({ element }) => <IconElement element={element} />,
};

export function CanvasElementRenderer({ element, isEditing = false, onPropsChange }: Props) {
  const handlePropsChange = onPropsChange ?? NOOP_PROPS_CHANGE;

  if (element.type.startsWith('page-')) {
    return <PageRenderer element={element} />;
  }

  const Renderer = ELEMENT_REGISTRY[element.type];
  if (!Renderer) return null;
  return <Renderer element={element} isEditing={isEditing} onPropsChange={handlePropsChange} />;
}
