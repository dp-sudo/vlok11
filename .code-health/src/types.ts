// .code-health/src/types.ts
export type DebtCategory =
  | 'type-safety'
  | 'memory-leak'
  | 'performance'
  | 'architecture'
  | 'test-coverage'
  | 'documentation'
  | 'security'
  | 'complexity'
  | 'duplication'
  | 'naming'
  | 'obsolete'
  | 'other';

export type DebtSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';

export type DebtStatus =
  | 'acknowledged'
  | 'monitored'
  | 'scheduled'
  | 'in-progress'
  | 'paid'
  | 'discarded';

export interface DebtEvidence {
  type: 'code' | 'metric' | 'screenshot' | 'error-log' | 'test-result';
  content: string;
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  capturedAt: string;
}

export interface DebtRepayment {
  id: string;
  debtId: string;
  amount: number;
  description: string;
  committedAt: string;
  completedAt?: string;
  commitHash?: string;
  status: 'committed' | 'partial' | 'completed';
}

export interface TechnicalDebt {
  id: string;
  title: string;
  description: string;
  severity: DebtSeverity;
  interestRate: number;
  category: DebtCategory;
  affectedModules: string[];
  introducedIn: {
    commit: string;
    pr?: string;
    reason?: string;
  };
  reportedBy: string;
  reportedAt: string;
  dueDate?: string;
  status: DebtStatus;
  repaymentEstimate?: number;
  actualRepaymentHours?: number;
  evidence: DebtEvidence[];
  repayments: DebtRepayment[];
}

export interface DebtRegistry {
  version: string;
  lastUpdated: string;
  debts: TechnicalDebt[];
  summary: {
    total: number;
    bySeverity: Record<DebtSeverity, number>;
    byCategory: Record<DebtCategory, number>;
    totalInterestHours: number;
    totalRepaymentHours: number;
  };
}

export interface DetectionRule {
  id: string;
  pattern?: string;
  tool?: string;
  threshold?: number;
  unit?: string;
  flags?: string[];
  severity: DebtSeverity;
  category: DebtCategory;
  autoRegister: boolean;
  dryRun: boolean;
  description: string;
}

export interface InterestPolicy {
  enabled: boolean;
  calculationPeriod: 'quarterly' | 'monthly';
  baseCurrency: string;
  quarterlyInterestRate: Record<DebtSeverity, number>;
  escalationRules: EscalationRule[];
  blockMergeThresholds: BlockMergeThresholds;
}

export interface EscalationRule {
  fromSeverity: DebtSeverity;
  quartersUntilEscalation: number;
  newSeverity: DebtSeverity;
  blockMerge: boolean;
}

export interface BlockMergeThresholds {
  criticalDebtCount: number;
  totalInterestHours: number;
  debtAgeQuarters: number;
}
