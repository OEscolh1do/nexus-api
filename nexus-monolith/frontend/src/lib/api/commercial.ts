import { api } from '../api';
import { Mission, Lead, Opportunity, CreateDealPayload, OpportunityStatus } from '../../modules/commercial/types';

export const commercialApi = {
  // Missions
  getMissions: async (status?: string): Promise<Mission[]> => {
    const res = await api.get(`/commercial/missions`, { params: { status } });
    return res.data;
  },

  getMissionById: async (id: string): Promise<Mission> => {
    const res = await api.get(`/commercial/missions/${id}`);
    return res.data;
  },

  // Leads
  getLeads: async (missionId?: string): Promise<Lead[]> => {
    const res = await api.get(`/commercial/leads`, { params: { missionId } });
    return res.data;
  },

  // Opportunities (Deals)
  createDeal: async (data: CreateDealPayload): Promise<Opportunity> => {
    const res = await api.post(`/commercial/opportunities`, data);
    return res.data;
  },

  updateDealStatus: async (dealId: string, status: OpportunityStatus, technicalProposal?: any): Promise<Opportunity> => {
    const res = await api.put(`/commercial/opportunities/${dealId}`, {
      status,
      technicalProposal
    });
    return res.data;
  },

  getDeals: async (missionId?: string): Promise<Opportunity[]> => {
    const res = await api.get(`/commercial/opportunities`, { params: { missionId } });
    return res.data;
  }
};
