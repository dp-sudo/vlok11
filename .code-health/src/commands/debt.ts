// .code-health/src/commands/debt.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { DebtRegistryManager } from '../DebtRegistry.js';
import type { TechnicalDebt, DebtSeverity, DebtCategory } from '../types.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../../config/debt-registry.json');
const registry = new DebtRegistryManager(registryPath);

function severityColor(severity: DebtSeverity): (text: string) => string {
  switch (severity) {
    case 'critical': return chalk.red;
    case 'major': return chalk.yellow;
    case 'minor': return chalk.blue;
    case 'cosmetic': return chalk.gray;
  }
}

export function debtCommands(): Command {
  const debt = new Command('debt');
  debt.description('Manage technical debt');

  debt
    .command('list')
    .description('List all registered debts')
    .option('-s, --severity <levels>', 'Filter by severity (critical,major,minor,cosmetic)')
    .option('-c, --category <categories>', 'Filter by category')
    .option('-S, --status <statuses>', 'Filter by status')
    .action((opts) => {
      const debts = registry.listDebts({
        severity: opts.severity?.split(','),
        category: opts.category?.split(','),
        status: opts.status?.split(','),
      });
      if (debts.length === 0) {
        console.log(chalk.yellow('No debts found matching criteria'));
        return;
      }
      console.log(chalk.bold(`\nFound ${debts.length} debt(s)\n`));
      for (const d of debts) {
        const sev = severityColor(d.severity);
        console.log(`${sev(d.severity.toUpperCase())} ${chalk.bold(d.id)}: ${d.title}`);
        console.log(`  Category: ${d.category} | Status: ${d.status}`);
        console.log(`  Affected: ${d.affectedModules.join(', ')}`);
        console.log();
      }
    });

  debt
    .command('add')
    .description('Register a new debt')
    .requiredOption('-t, --title <title>', 'Debt title')
    .requiredOption('-d, --description <desc>', 'Debt description')
    .requiredOption('-s, --severity <level>', 'Severity (critical|major|minor|cosmetic)')
    .requiredOption('-c, --category <cat>', 'Category')
    .option('-m, --modules <mods>', 'Affected modules (comma-separated)')
    .option('-e, --estimate <hours>', 'Estimated repayment hours', (v) => parseInt(v))
    .option('-r, --reported-by <name>', 'Reporter name', 'CLI')
    .action((opts) => {
      const newDebt = registry.addDebt({
        title: opts.title,
        description: opts.description,
        severity: opts.severity as DebtSeverity,
        interestRate: 5,
        category: opts.category as DebtCategory,
        affectedModules: opts.modules?.split(',') || [],
        introducedIn: { commit: 'unknown' },
        reportedBy: opts.reportedBy,
        status: 'acknowledged',
        repaymentEstimate: opts.estimate,
        evidence: [],
      });
      console.log(chalk.green(`Added debt: ${newDebt.id}`));
      console.log(`  Title: ${newDebt.title}`);
      console.log(`  Severity: ${newDebt.severity}`);
      console.log(`  Category: ${newDebt.category}`);
    });

  debt
    .command('repay')
    .description('Record a debt repayment')
    .requiredOption('-i, --id <id>', 'Debt ID (e.g., TD-2026-001)')
    .requiredOption('-a, --amount <hours>', 'Hours spent', (v) => parseFloat(v))
    .requiredOption('-d, --description <desc>', 'Repayment description')
    .option('--complete', 'Mark as complete')
    .action((opts) => {
      const success = registry.addRepayment(opts.id, {
        amount: opts.amount,
        description: opts.description,
        status: opts.complete ? 'completed' : 'partial',
      });
      if (success) {
        console.log(chalk.green(`Recorded repayment for ${opts.id}`));
      } else {
        console.log(chalk.red(`Debt not found: ${opts.id}`));
        process.exit(1);
      }
    });

  debt
    .command('update')
    .description('Update debt status')
    .requiredOption('-i, --id <id>', 'Debt ID')
    .requiredOption('-s, --status <status>', 'New status')
    .action((opts) => {
      const success = registry.updateDebtStatus(opts.id, opts.status as TechnicalDebt['status']);
      if (success) {
        console.log(chalk.green(`Updated ${opts.id} status to ${opts.status}`));
      } else {
        console.log(chalk.red(`Debt not found: ${opts.id}`));
        process.exit(1);
      }
    });

  return debt;
}
