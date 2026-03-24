// .code-health/src/commands/gate.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { checkExplicitAny } from '../scripts/check-explicit-any.js';
import { checkNewAny } from '../scripts/check-new-any.js';

export function gateCommand(): Command {
  return new Command('gate')
    .description('Run quality gate checks')
    .option('--strict', 'Fail on warnings')
    .option('--allow-existing', 'Allow existing debts, only block new')
    .action((opts) => {
      console.log(chalk.bold('\n=== Quality Gate ===\n'));

      let anyFindings = checkExplicitAny();

      // If --allow-existing, filter to only new findings
      if (opts.allowExisting) {
        const newAny = checkNewAny();
        anyFindings = anyFindings.filter(f =>
          newAny.some(n => n.file === f.file && n.line === f.line)
        );
      }

      console.log(`Explicit 'any' usage: ${anyFindings.length}`);
      if (anyFindings.length > 0) {
        for (const f of anyFindings.slice(0, 5)) {
          console.log(`  ${chalk.red('✗')} ${f.file}:${f.line} - ${f.code}`);
        }
        if (anyFindings.length > 5) {
          console.log(`  ... and ${anyFindings.length - 5} more`);
        }
      }

      const hasBlockingIssues = anyFindings.length > 0;
      if (hasBlockingIssues) {
        console.log(chalk.red('\n✗ Quality gate FAILED'));
        console.log(chalk.gray('  Fix explicit any usages before merging'));
        process.exit(1);
      } else {
        console.log(chalk.green('\n✓ Quality gate PASSED'));
      }
    });
}