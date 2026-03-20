export interface OperationalTask {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  status: string;
  assignedTo?: string;
  startDate?: string; // Optional as per schema DateTime?
  endDate?: string;
  dueDate?: string;
  completionPercent: number;
  isRecurring?: boolean;
  isTemplate?: boolean;
  isMilestone?: boolean;
  recurrencePattern?: string;
  dependencies?: string[];
  predecessors?: { predecessorId: string }[];
}

export interface Project {
  id: string;
  title: string;
  status: string;
  type: string; // Added Missing Field
  description?: string;
  progressPercentage?: number;
  managerId?: string;
  strategyId?: string;
  startDate?: string;
  endDate?: string;
  tasks?: OperationalTask[];
  manager?: { fullName: string };
}

export interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  perspective?: string; // FINANCIAL, CUSTOMER, PROCESS, LEARNING
  indicatorType?: string; // LEADING, LAGGING
}

export interface Risk {
  id: string;
  title: string;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Strategy {
  id: string;
  title: string;
  description?: string;
  parentId?: string;
  type: 'PILLAR' | 'INITIATIVE' | 'ACTION';
  code?: string;
  colorCode?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  children?: Strategy[];
  keyResults?: KeyResult[];
}


// --- PEOPLE / TEAM TYPES ---

export interface WorkloadMetric {
  userId: string;
  userFullName: string;
  weeks: {
    weekLabel: string;
    taskCount: number;
    status: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
}

export type LeaveType = 'FERIAS' | 'FOLGA' | 'ATESTADO' | 'LICENCA' | 'BIRTHDAY';

export interface CalendarEventDTO {
  date: string;
  type: LeaveType;
  userFullName: string;
  userId: string;
  meta?: Record<string, unknown>;
}

export interface OrgUserDTO {
  id: string;
  fullName: string;
  jobTitle: string;
  avatarUrl?: string;
}

export interface OrgTreeDTO {
  id: string;
  user: OrgUserDTO;
  children: OrgTreeDTO[];
  status: 'AVAILABLE' | 'UNAVAILABLE';
}

