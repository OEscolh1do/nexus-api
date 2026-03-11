export interface KeyResultCheckIn {
  id: string;
  keyResultId: string;
  userId: string;
  previousValue: number;
  newValue: number;
  comment?: string;
  createdAt: string;
  user?: { id: string; fullName: string };
}

export interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  perspective?: string; // FINANCIAL, CUSTOMER, PROCESS, LEARNING
  indicatorType?: string; // LEADING, LAGGING
  ownerId?: string | null;
  owner?: { id: string; fullName: string };
  checkIns?: KeyResultCheckIn[];
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
  startDate: string;
  endDate: string;
  isActive: boolean;
  colorCode?: string;
  ownerId?: string | null;
  owner?: { id: string; fullName: string };
  children?: Strategy[];
  keyResults?: KeyResult[];
  risks?: Risk[];
}
