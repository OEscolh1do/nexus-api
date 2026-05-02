export type MissionStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED';
export type OpportunityStatus = 
  | 'LEAD_QUALIFICATION'
  | 'VISIT_SCHEDULED'
  | 'TECHNICAL_VISIT_DONE'
  | 'PROPOSAL_GENERATED'
  | 'NEGOTIATION'
  | 'CONTRACT_SENT'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type LeadSource = 'ORGANIC' | 'REFERRAL' | 'PAID_MEDIA' | 'ACADEMY' | 'OUTBOUND';

export interface Mission {
  id: string;
  name: string;
  region: string;
  regionPolygon?: any; // JSON
  startDate: string; // ISO Date
  endDate: string;
  status: MissionStatus;
  stats?: {
    totalLeads: number;
    converted: number;
    potentialValue: number;
  };
  coordinatorId?: string;
  tenantId: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: string; // 'NEW' | 'HOT' | 'CONVERTED' etc
  source?: LeadSource;
  academyScore: number;
  city?: string;
  state?: string;
  missionId?: string;
  tenantId: string;
  notes?: string;
  interactions?: LeadInteraction[];
}

export interface LeadInteraction {
  id: string;
  type: string;
  content: string;
  date: string;
}

export interface TechnicalProposal {
  id: string;
  kitData: Record<string, any>;
  consumptionAvg: number;
  infrastructurePhotos: string[]; // URLs
  paybackData: Record<string, any>;
  validatedByEng: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  leadId: string;
  lead?: Lead;
  missionId?: string;
  mission?: Mission;
  status: OpportunityStatus;
  estimatedValue: number;
  probability: number;
  technicalProposal?: TechnicalProposal;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealPayload {
  title: string;
  leadId: string;
  missionId?: string;
  estimatedValue: number;
  status: OpportunityStatus;
}
