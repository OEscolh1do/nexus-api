import { api } from "../../lib/api";
import type { Project, OperationalTask } from "./types";

export interface UserOption {
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
}

export interface InspectionData {
    projectId?: string;
    structural?: {
        structureCondition?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export const OpsService = {
  getProject: async (id: string): Promise<Project> => {
    const res = await api.get(`/ops/projects/${id}`);
    return res.data; 
  },

  getAllProjects: async (): Promise<Project[]> => {
      const res = await api.get('/ops/projects?include=tasks'); 
      return res.data.data || []; 
  },
  
  // Uses IAM module to get users for assignment
  getUsers: async (): Promise<UserOption[]> => {
      try {
        const res = await api.get('/iam/users');
        return res.data.data || [];
      } catch (e) {
        console.warn("OpsService: Failed to load users", e);
        return [];
      }
  },

  addTask: async (projectId: string, task: Partial<OperationalTask>) => {
    const res = await api.post(`/ops/projects/${projectId}/tasks`, task);
    return res.data;
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const res = await api.patch(`/ops/tasks/${taskId}/status`, { status });
    return res.data.data;
  },

  updateTask: async (taskId: string, data: Partial<OperationalTask>) => {
    // V2 Endpoint for full task update
    const res = await api.put(`/ops/tasks/${taskId}`, data); 
    return res.data.data;
  },

  deleteTask: async (taskId: string) => {
    const res = await api.delete(`/ops/tasks/${taskId}`);
    return res.data;
  },
  
  processInspection: async (data: InspectionData) => {
      const res = await api.post('/ops/inspections', data);
      return res.data;
  }
};
