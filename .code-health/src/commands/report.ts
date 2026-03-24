// .code-health/src/commands/report.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { DebtRegistryManager } from '../DebtRegistry.js';
import { printHealthReport } from '../scripts/health-report.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../../config/debt-registry.json');
const registry = new DebtRegistryManager(registryPath);

export function reportCommand(): Command {
  return new Command('report')
    .description('Generate debt health report')
    .option('--detailed', 'Show detailed health report with threshold checks')
    .action((opts) => {
      if (opts.detailed) {
        printHealthReport();
        return;
      }
      const summary = registry.getSummary();
      const debts = registry.listDebts();
      console.log(chalk.bold('\n=== Code Health Report ===\n'));
      console.log(chalk.bold('Summary:'));
      console.log(`  Total Debts: ${summary.total}`);
      console.log(`  By Severity: ${chalk.red('critical:')} ${summary.bySeverity.critical} ${chalk.yellow('major:')} ${summary.bySeverity.major} ${chalk.blue('minor:')} ${summary.bySeverity.minor} ${chalk.gray('cosmetic:')} ${summary.bySeverity.cosmetic}`);
      console.log(`  Total Repayment Hours: ${summary.totalRepaymentHours}`);
      console.log();
      console.log(chalk.bold('Top Debts:'));
      const top = debts.slice(0, 5);
      for (const d of top) {
        console.log(`  [${d.severity.toUpperCase()}] ${d.id} - ${d.title}`);
      }
    });
}
