import { ProposalPageCover } from '../pages/ProposalPageCover';
import { ProposalPageInvestment } from '../pages/ProposalPageInvestment';
import { ProposalPageTechnical } from '../pages/ProposalPageTechnical';
import { ProposalPageSchedule } from '../pages/ProposalPageSchedule';
import { ProposalPageContact } from '../pages/ProposalPageContact';
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
import { useProposalPageData } from './useProposalPageData';
import type { CanvasElement } from './types';

interface Props {
  element: CanvasElement;
  isEditing?: boolean;
  onPropsChange?: (props: Record<string, unknown>) => void;
}

function PageRenderer({ element }: Pick<Props, 'element'>) {
  const pageData = useProposalPageData();

  switch (element.type) {
    case 'page-cover':      return <ProposalPageCover {...pageData} />;
    case 'page-investment': return <ProposalPageInvestment {...pageData} />;
    case 'page-technical':  return <ProposalPageTechnical {...pageData} />;
    case 'page-schedule':   return <ProposalPageSchedule {...pageData} />;
    case 'page-contact':    return <ProposalPageContact {...pageData} />;
    default:                return null;
  }
}

export function CanvasElementRenderer({ element, isEditing = false, onPropsChange }: Props) {
  const handlePropsChange = onPropsChange ?? (() => {});

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
    case 'kpi-box':
    case 'chart-generation':
    case 'chart-financial':
    case 'payment-table':
    case 'schedule-timeline':
    case 'map-static':
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 4, fontSize: 11, color: '#94a3b8' }}>
          {element.type}
        </div>
      );
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
    default:
      return null;
  }
}
