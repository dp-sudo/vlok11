// .code-health/src/scripts/schedule-detections.ts
import { execSync } from 'child_process';
import { DebtRegistryManager } from '../DebtRegistry.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../../config/debt-registry.json');

export interface DetectionReport {
  timestamp: string;
  newFindings: string[];
  resolvedDebts: string[];
  totalDebt: number;
  interestTotal: number;
  blocked: boolean;
}

export function runScheduledDetection(): DetectionReport {
  console.log('Running scheduled debt detection...\n');

  const registry = new DebtRegistryManager(registryPath);

  // Run explicit any detection
  const anyFindings = execSync(
    'grep -rn ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true',
    { encoding: 'utf-8' }
  ).split('\n').filter(Boolean);

  const newFindings = anyFindings.map(line => {
    const match = line.match(/^(.+):(\d+):/);
    return match ? `${match[1]}:${match[2]}` : line;
  });

  // Get current summary
  const summary = registry.getSummary();

  // Calculate if should block
  const blocked = summary.bySeverity.critical > 0 ||
                  summary.bySeverity.major > 3 ||
                  summary.totalInterestHours > 50;

  return {
    timestamp: new Date().toISOString(),
    newFindings,
    resolvedDebts: [],
    totalDebt: summary.total,
    interestTotal: summary.totalInterestHours,
    blocked
  };
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runScheduledDetection();
  console.log('\n=== Detection Report ===');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Debt: ${report.totalDebt}`);
  console.log(`Interest Hours: ${report.interestTotal}`);
  console.log(`Blocked: ${report.blocked ? 'YES' : 'NO'}`);
  console.log(`New Findings: ${report.newFindings.length}`);
}
