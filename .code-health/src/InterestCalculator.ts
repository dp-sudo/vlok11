// .code-health/src/InterestCalculator.ts
import type { TechnicalDebt, InterestPolicy } from './types.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const thresholdsPath = path.resolve(__dirname, '../config/thresholds.json');

export interface ThresholdConfig {
  mergeBlocking: {
    criticalDebtCount: number;
    majorDebtCount: number;
    totalInterestHours: number;
    anyUsageCount: number;
  };
  warningThresholds: Record<string, number>;
}

export function loadThresholds(): ThresholdConfig {
  try {
    return JSON.parse(readFileSync(thresholdsPath, 'utf-8'));
  } catch {
    // Return defaults
    return {
      mergeBlocking: {
        criticalDebtCount: 0,
        majorDebtCount: 5,
        totalInterestHours: 50,
        anyUsageCount: 10
      },
      warningThresholds: {
        criticalDebtCount: 0,
        majorDebtCount: 3,
        totalInterestHours: 30,
        anyUsageCount: 5
      }
    };
  }
}

export class InterestCalculator {
  constructor(private policy: InterestPolicy) {}

  calculateInterest(debt: TechnicalDebt, quartersElapsed: number): number {
    if (!this.policy.enabled || debt.status === 'paid') return 0;
    const baseRate = this.policy.quarterlyInterestRate[debt.severity];
    return debt.repaymentEstimate
      ? (debt.repaymentEstimate * baseRate / 100) * quartersElapsed
      : baseRate * quartersElapsed * 0.5;
  }

  calculateTotalInterest(debts: TechnicalDebt[]): number {
    const now = new Date();
    return debts.reduce((total, debt) => {
      if (debt.status === 'paid') return total;
      const reportedDate = new Date(debt.reportedAt);
      const quartersElapsed = this.getQuartersElapsed(reportedDate, now);
      return total + this.calculateInterest(debt, quartersElapsed);
    }, 0);
  }

  shouldBlockMerge(debts: TechnicalDebt[]): { blocked: boolean; reasons: string[] } {
    if (!this.policy.blockMergeThresholds) return { blocked: false, reasons: [] };
    const reasons: string[] = [];
    const now = new Date();
    const critical = debts.filter(d => d.severity === 'critical' && d.status !== 'paid');
    const totalInterest = this.calculateTotalInterest(debts.filter(d => d.status !== 'paid'));
    const threshold = this.policy.blockMergeThresholds;
    if (critical.length > threshold.criticalDebtCount) {
      reasons.push(`${critical.length} critical debts (max: ${threshold.criticalDebtCount})`);
    }
    if (totalInterest > threshold.totalInterestHours) {
      reasons.push(`Total interest ${totalInterest.toFixed(1)}h exceeds ${threshold.totalInterestHours}h`);
    }
    const oldDebts = debts.filter(d => {
      if (d.status === 'paid') return false;
      const quarters = this.getQuartersElapsed(new Date(d.reportedAt), now);
      return quarters > threshold.debtAgeQuarters;
    });
    if (oldDebts.length > 0) {
      reasons.push(`${oldDebts.length} debts older than ${threshold.debtAgeQuarters} quarters`);
    }
    return { blocked: reasons.length > 0, reasons };
  }

  private getQuartersElapsed(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.floor(months / 3);
  }
}
