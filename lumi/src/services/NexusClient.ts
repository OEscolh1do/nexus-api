/**
 * NexusClient.ts
 * Responsabilidade: Abstrair a comunicação entre o aplicativo satélite (Lumi) e o core da infraestrutura (Nexus Monolith).
 * Regra Arquitetural: Todas as chamadas ao backend Node/Express devem passar por aqui.
 */

const API_URL = import.meta.env.VITE_NEXUS_API_URL || 'http://localhost:3001/api/v1/integrations/lumi';
const MOCK_TOKEN = import.meta.env.VITE_NEXUS_MOCK_TOKEN; // Usado temporariamente para desenvolvimento

// Interface baseada no Payload que o controlador lumi.controller.js espera
export interface ProposalPayload {
  leadId: string;
  systemSizeKwp: number;
  totalInvestment: number;
  moduleCount: number;
  inverterCount: number;
  notes?: string;
}

export interface NexusClientData {
    id: string;
    name: string;
    company?: string;
    status: string;
    phone?: string;
    email?: string;
    value?: number;
}

export class NexusClient {
  /**
   * Header de autorização padrão
   */
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      // No futuro, isso pode ser puxado do Session Storage/Zustand após um OAuth Single Sign-on
      'Authorization': `Bearer ${MOCK_TOKEN}`
    };
  }

  /**
   * Busca clientes (Leads/Oportunidades) comerciais registrados no Nexus.
   */
  static async getClients(): Promise<NexusClientData[]> {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[NexusClient] Falha ao buscar clientes:', error);
      throw error;
    }
  }

  /**
   * Envia uma proposta técnica validada pelo Lumi para virar um "Projeto/Obra Operacional" no Nexus.
   */
  static async sendProposal(payload: ProposalPayload): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/proposals`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Erro na API: ${errorBody.error || response.statusText}`);
      }

      const data = await response.json();
      return data; // { message: 'Projeto Integrado...', project: {...} }
    } catch (error) {
      console.error('[NexusClient] Falha ao enviar proposta:', error);
      throw error;
    }
  }
}
