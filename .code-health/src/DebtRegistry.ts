// .code-health/src/DebtRegistry.ts
import { readFileSync, writeFileSync } from 'fs';
import { DebtRegistrySchema, TechnicalDebtSchema } from './schemas/debt.schema.js';
import type { TechnicalDebt, DebtRegistry, DebtRepayment } from './types.js';

export class DebtRegistryManager {
  private registryPath: string;
  private registry: DebtRegistry;

  constructor(registryPath: string = './config/debt-registry.json') {
    this.registryPath = registryPath;
    this.registry = this.load();
  }

  private load(): DebtRegistry {
    try {
      const content = readFileSync(this.registryPath, 'utf-8');
      const parsed = JSON.parse(content);
      return DebtRegistrySchema.parse(parsed);
    } catch {
      return DebtRegistrySchema.parse({
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        debts: [],
        summary: {
          total: 0,
          bySeverity: { critical: 0, major: 0, minor: 0, cosmetic: 0 },
          byCategory: {
            'type-safety': 0, 'memory-leak': 0, 'performance': 0,
            'architecture': 0, 'test-coverage': 0, 'documentation': 0,
            'security': 0, 'complexity': 0, 'duplication': 0,
            'naming': 0, 'obsolete': 0, 'other': 0,
          },
          totalInterestHours: 0,
          totalRepaymentHours: 0,
        },
      });
    }
  }

  save(): void {
    this.registry.lastUpdated = new Date().toISOString();
    this.recalculateSummary();
    writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2), 'utf-8');
  }

  addDebt(debt: Omit<TechnicalDebt, 'id' | 'reportedAt' | 'repayments'>): TechnicalDebt {
    const year = new Date().getFullYear();
    const sequence = String(this.registry.debts.length + 1).padStart(3, '0');
    const newDebt: TechnicalDebt = {
      ...debt,
      id: `TD-${year}-${sequence}`,
      reportedAt: new Date().toISOString(),
      repayments: [],
    };
    TechnicalDebtSchema.parse(newDebt);
    this.registry.debts.push(newDebt);
    this.save();
    return newDebt;
  }

  getDebt(id: string): TechnicalDebt | undefined {
    return this.registry.debts.find(d => d.id === id);
  }

  listDebts(filter?: {
    severity?: string[];
    category?: string[];
    status?: string[];
  }): TechnicalDebt[] {
    let debts = [...this.registry.debts];
    if (filter?.severity?.length) {
      debts = debts.filter(d => filter.severity!.includes(d.severity));
    }
    if (filter?.category?.length) {
      debts = debts.filter(d => filter.category!.includes(d.category));
    }
    if (filter?.status?.length) {
      debts = debts.filter(d => filter.status!.includes(d.status));
    }
    return debts.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2, cosmetic: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  updateDebtStatus(id: string, status: TechnicalDebt['status']): boolean {
    const debt = this.getDebt(id);
    if (!debt) return false;
    debt.status = status;
    this.save();
    return true;
  }

  addRepayment(debtId: string, repayment: Omit<DebtRepayment, 'id' | 'debtId' | 'committedAt'>): boolean {
    const debt = this.getDebt(debtId);
    if (!debt) return false;
    const newRepayment: DebtRepayment = {
      ...repayment,
      id: `PAY-${new Date().getFullYear()}-${String(debt.repayments.length + 1).padStart(3, '0')}`,
      debtId,
      committedAt: new Date().toISOString(),
    };
    debt.repayments.push(newRepayment);
    if (repayment.status === 'completed') {
      debt.actualRepaymentHours = (debt.actualRepaymentHours || 0) + repayment.amount;
      debt.status = 'paid';
    }
    this.save();
    return true;
  }

  getSummary() {
    return this.registry.summary;
  }

  private recalculateSummary(): void {
    const summary = this.registry.summary;
    summary.total = this.registry.debts.length;
    summary.bySeverity = { critical: 0, major: 0, minor: 0, cosmetic: 0 };
    summary.byCategory = {
      'type-safety': 0, 'memory-leak': 0, 'performance': 0,
      'architecture': 0, 'test-coverage': 0, 'documentation': 0,
      'security': 0, 'complexity': 0, 'duplication': 0,
      'naming': 0, 'obsolete': 0, 'other': 0,
    };
    summary.totalRepaymentHours = 0;
    summary.totalInterestHours = 0;
    const now = new Date();
    const quarterlyRates: Record<string, number> = { critical: 15, major: 10, minor: 5, cosmetic: 2 };
    for (const debt of this.registry.debts) {
      summary.bySeverity[debt.severity]++;
      summary.byCategory[debt.category]++;
      if (debt.status === 'paid') continue;
      const reported = new Date(debt.reportedAt);
      const months = (now.getFullYear() - reported.getFullYear()) * 12 + (now.getMonth() - reported.getMonth());
      const quarters = Math.floor(months / 3);
      if (quarters > 0) {
        const rate = quarterlyRates[debt.severity] ?? 5;
        const baseHours = debt.repaymentEstimate ?? 4;
        summary.totalInterestHours += (baseHours * rate / 100) * quarters;
      }
      for (const repayment of debt.repayments) {
        if (repayment.status === 'completed') {
          summary.totalRepaymentHours += repayment.amount;
        }
      }
    }
  }
}
