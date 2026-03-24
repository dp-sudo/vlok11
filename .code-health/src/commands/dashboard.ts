// .code-health/src/commands/dashboard.ts
import { Command } from 'commander';
import chalk from 'chalk';

export function dashboardCommand(): Command {
  return new Command('dashboard')
    .description('Generate health dashboard')
    .option('-o, --output <path>', 'Output path', './docs/health-dashboard.html')
    .action((opts) => {
      console.log(chalk.yellow('[Dashboard] Dashboard generation not yet implemented'));
      console.log(chalk.gray('  Coming in Phase 2'));
    });
}
