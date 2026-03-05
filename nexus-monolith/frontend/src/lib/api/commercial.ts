import axios from 'axios';
import { Mission, Lead, Opportunity, CreateDealPayload, OpportunityStatus } from '../../modules/commercial/types';

const API_URL = 'http://localhost:3000/api'; // Adjust based on env

export const commercialApi = {
  // Missions
  getMissions: async (status?: string): Promise<Mission[]> => {
    const res = await axios.get(`${API_URL}/commercial/missions`, { params: { status } });
    return res.data;
  },
  
  getMissionById: async (id: string): Promise<Mission> => {
    const res = await axios.get(`${API_URL}/commercial/missions/${id}`);
    return res.data;
  },

  // Leads
  getLeads: async (missionId?: string): Promise<Lead[]> => {
    const res = await axios.get(`${API_URL}/commercial/leads`, { params: { missionId } });
    return res.data;
  },

  // Opportunities (Deals)
  createDeal: async (data: CreateDealPayload): Promise<Opportunity> => {
    const res = await axios.post(`${API_URL}/commercial/deals`, data);
    return res.data;
  },

  updateDealStatus: async (dealId: string, status: OpportunityStatus, technicalProposal?: any): Promise<Opportunity> => {
    const res = await axios.patch(`${API_URL}/commercial/deals/${dealId}/status`, {
      status,
      technicalProposal
    });
    return res.data;
  },

  getDeals: async (missionId?: string): Promise<Opportunity[]> => {
     const res = await axios.get(`${API_URL}/commercial/deals`, { params: { missionId } });
     return res.data;
  }
};
