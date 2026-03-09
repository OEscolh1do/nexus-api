import { api } from "../../../lib/api";
import type { Strategy } from "../types";

const BASE_PATH = '/strategies';

export const StrategyService = {
  async getAll(): Promise<Strategy[]> {
    const res = await api.get(BASE_PATH);
    return res.data.data || []; // Unwrap { success: true, data: [...] }
  },

  async create(data: Partial<Strategy>): Promise<Strategy> {
    const res = await api.post(BASE_PATH, data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Strategy>): Promise<Strategy> {
    const res = await api.put(`${BASE_PATH}/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  async createCheckIn(keyResultId: string, data: { newValue: number, comment?: string }) {
    const res = await api.post(`/key-results/${keyResultId}/checkin`, data);
    return res.data.data;
  }
};

