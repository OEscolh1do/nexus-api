export interface Project {
  id: string;
  title: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED' | 'PLANEJAMENTO';
  progressPercentage: number;
  manager?: {
    fullName: string;
  };
}

export interface OperationalTask {
  id: string;
  title: string;
  status: string; // Enum logic might be complex, keeping string for now
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  assignedTo?: string;
  assignee?: {
    fullName: string;
  };
}

export interface WorkloadUser {
  userId: string;
  userName: string;
  userRole: string;
  totalHours: number;
  taskCount: number;
  utilization: number;
  status: 'OVERLOAD' | 'HIGH' | 'OPTIMAL' | 'UNDER';
  tasks: OperationalTask[];
}
