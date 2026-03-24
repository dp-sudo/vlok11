// .code-health/src/commands/gate.ts
import { Command } from 'commander';
import chalk from 'chalk';

export function gateCommand(): Command {
  return new Command('gate')
    .description('Run quality gate checks')
    .option('--strict', 'Fail on warnings')
    .action((opts) => {
      console.log(chalk.yellow('[Gate] Quality gate checks not yet implemented'));
      console.log(chalk.gray('  Coming in Phase 3'));
    });
}
