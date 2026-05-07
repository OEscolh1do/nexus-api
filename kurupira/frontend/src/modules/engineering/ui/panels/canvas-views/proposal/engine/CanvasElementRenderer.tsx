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

export function CanvasElementRenderer({ element, isEditing = false, onPropsChange }: Props) {
  const handlePropsChange = onPropsChange ?? NOOP_PROPS_CHANGE;

  if (element.type.startsWith('page-')) {
    return <PageRenderer element={element} />;
  }

  switch (element.type) {
    case 'text':
      return <TextElement element={element} isEditing={isEditing} onPropsChange={handlePropsChange} />;
    case 'image':
      return <ImageElement element={element} />;
    case 'logo':
      return <LogoElement element={element} />;
    case 'watermark':
      return <WatermarkElement element={element} />;
    case 'divider':
      return <DividerElement element={element} />;
    case 'kpi-box':            return <KpiBoxElement element={element} />;
    case 'chart-generation':   return <ChartGenerationElement element={element} />;
    case 'chart-financial':    return <ChartFinancialElement element={element} />;
    case 'payment-table':      return <PaymentTableElement element={element} />;
    case 'schedule-timeline':  return <ScheduleTimelineElement element={element} />;
    case 'map-static':         return <MapStaticElement element={element} />;
    // ── Elementos de Projeção ──────────────────────────────────────────────────
    case 'chart-gen-consumption':
      return <ChartGenConsumptionElement element={element} />;
    case 'chart-roi':
      return <ChartROIElement element={element} />;
    case 'chart-financial-balance':
      return <ChartFinancialBalanceElement element={element} />;
    case 'chart-credit-bank':
      return <ChartCreditBankElement element={element} />;
    case 'chart-daily':
      return <ChartDailyElement element={element} />;
    case 'chart-loss-waterfall':
      return <ChartLossWaterfallElement element={element} />;
    case 'kpi-projection':
      return <KpiProjectionElement element={element} />;
    case 'table-analytics':
      return <TableAnalyticsElement element={element} />;
    case 'placeholder':
      return <PlaceholderElement element={element} />;
    // ── Elementos de Dimensionamento Técnico ───────────────────────────────────
    case 'section-header':
      return <SectionHeaderElement element={element} />;
    case 'kpi-capacity-badge':
      return <KpiCapacityBadgeElement element={element} />;
    case 'guarantees-list':
      return <GuaranteesListElement element={element} />;
    case 'equipment-panel':
      return <EquipmentPanelElement element={element} />;
    // ── Primitivos de design ───────────────────────────────────────────────────
    case 'box':
      return <BoxElement element={element} />;
    case 'icon':
      return <IconElement element={element} />;
    default:
      return null;
  }
}
