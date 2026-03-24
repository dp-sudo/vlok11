// .code-health/src/scripts/health-report.ts
import { DebtRegistryManager } from '../DebtRegistry.js';
import { loadThresholds, ThresholdConfig } from '../InterestCalculator.js';
import { checkExplicitAny } from './check-explicit-any.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../../config/debt-registry.json');

export interface HealthReport {
  generated: string;
  metrics: {
    totalDebt: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    interestHours: number;
    anyUsageCount: number;
  };
  thresholds: ThresholdConfig['mergeBlocking'];
  status: {
    canMerge: boolean;
    warnings: string[];
    criticalIssues: string[];
  };
}

export function generateHealthReport(): HealthReport {
  const registry = new DebtRegistryManager(registryPath);
  const thresholds = loadThresholds();
  const summary = registry.getSummary();
  const anyFindings = checkExplicitAny();

  const warnings: string[] = [];
  const criticalIssues: string[] = [];

  // Check thresholds
  if (summary.bySeverity.critical > thresholds.mergeBlocking.criticalDebtCount) {
    criticalIssues.push(`${summary.bySeverity.critical} critical debts blocking merge`);
  }
  if (summary.bySeverity.major > thresholds.mergeBlocking.majorDebtCount) {
    warnings.push(`${summary.bySeverity.major} major debts (limit: ${thresholds.mergeBlocking.majorDebtCount})`);
  }
  if (summary.totalInterestHours > thresholds.mergeBlocking.totalInterestHours) {
    criticalIssues.push(`Interest hours ${summary.totalInterestHours} exceeds limit ${thresholds.mergeBlocking.totalInterestHours}`);
  }
  if (anyFindings.length > thresholds.mergeBlocking.anyUsageCount) {
    warnings.push(`${anyFindings.length} any usages (limit: ${thresholds.mergeBlocking.anyUsageCount})`);
  }

  return {
    generated: new Date().toISOString(),
    metrics: {
      totalDebt: summary.total,
      bySeverity: summary.bySeverity,
      byCategory: summary.byCategory,
      interestHours: summary.totalInterestHours,
      anyUsageCount: anyFindings.length
    },
    thresholds: thresholds.mergeBlocking,
    status: {
      canMerge: criticalIssues.length === 0,
      warnings,
      criticalIssues
    }
  };
}

export function printHealthReport(): void {
  const report = generateHealthReport();

  console.log('\n=== Code Health Report ===');
  console.log(`Generated: ${report.generated}`);
  console.log('\nMetrics:');
  console.log(`  Total Debt: ${report.metrics.totalDebt}`);
  console.log(`  By Severity:`, report.metrics.bySeverity);
  console.log(`  Interest Hours: ${report.metrics.interestHours}`);
  console.log(`  Any Usage Count: ${report.metrics.anyUsageCount}`);

  console.log('\nStatus:');
  console.log(`  Can Merge: ${report.status.canMerge ? 'YES' : 'NO'}`);

  if (report.status.criticalIssues.length > 0) {
    console.log('\nCritical Issues:');
    report.status.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (report.status.warnings.length > 0) {
    console.log('\nWarnings:');
    report.status.warnings.forEach(warn => console.log(`  - ${warn}`));
  }
}
