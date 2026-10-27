export type { Asset, Liability, Snapshot, Transaction } from './mock-data';

export interface Goal {
  id: string;
  name: string;
  category: 'RETIREMENT' | 'EMERGENCY_FUND' | 'HOME' | 'EDUCATION' | 'VEHICLE' | 'VACATION' | 'WEALTH';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution?: number;
  currency: string;
  linkedAssetIds?: string[];
  notes?: string;
}
