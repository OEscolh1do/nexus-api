
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
  startDate: string;
  endDate: string;
  isActive: boolean;
  colorCode?: string;
  children?: Strategy[];
  keyResults?: KeyResult[];
  risks?: Risk[];
}
