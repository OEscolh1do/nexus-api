// ===============================================
// NEONORTE: COMMERCIAL TYPES (v2)
// ===============================================

export type OpportunityStatus =
    | 'LEAD_QUALIFICATION'
    | 'VISIT_SCHEDULED'
    | 'TECHNICAL_VISIT_DONE'
    | 'PROPOSAL_GENERATED'
    | 'NEGOTIATION'
    | 'CONTRACT_SENT'
    | 'CLOSED_WON'
    | 'CLOSED_LOST';

export interface Opportunity {
    id: string;
    title: string;
    leadId: string;
    missionId?: string;
    status: OpportunityStatus;
    estimatedValue: number;
    probability: number;
    lead?: {
        name: string;
        phone: string;
        city?: string;
        engagementScore: number;
    };
    technicalProposal?: {
        validatedByEng: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'CONVERTED';

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone: string;
    status: LeadStatus;
    city?: string;
    state?: string;
    engagementScore: number;
    academyScore?: number;
    source?: string;
    owner?: { fullName: string };
    interactions?: { id: string; content: string; createdAt: string }[];
    createdAt: string;
}

export interface Mission {
    id: string;
    name: string;
    status: string;
    createdAt: string;
}

export interface CreateDealPayload {
    title: string;
    leadId: string;
    estimatedValue?: number;
    missionId?: string;
}
