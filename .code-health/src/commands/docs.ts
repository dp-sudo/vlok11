// .code-health/src/commands/docs.ts
import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateModuleGraph } from '../scripts/module-graph.js';
import { generateOnboarding } from '../scripts/onboarding.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function docsCommand(): Command {
  return new Command('docs')
    .description('Documentation generation commands')
    .addCommand(apiDocsCommand())
    .addCommand(architectureDocsCommand())
    .addCommand(onboardingCommand());
}

function apiDocsCommand(): Command {
  return new Command('api')
    .description('Generate API documentation with TypeDoc')
    .option('-o, --output <path>', 'Output directory', 'docs/api')
    .action((opts) => {
      console.log(chalk.bold('\n=== Generating API Documentation ===\n'));
      try {
        execSync(`npx typedoc --out ${opts.output} --options .code-health/config/typedoc.json`, {
          stdio: 'inherit'
        });
        console.log(chalk.green(`\n✓ API documentation generated at ${opts.output}`));
      } catch {
        console.log(chalk.red('\n✗ Failed to generate API documentation'));
        process.exit(1);
      }
    });
}

function architectureDocsCommand(): Command {
  return new Command('architecture')
    .description('Generate architecture diagrams')
    .option('-o, --output <path>', 'Output directory', 'docs/architecture')
    .action((opts) => {
      console.log(chalk.bold('\n=== Generating Architecture Diagrams ===\n'));
      generateModuleGraph(opts.output);
      console.log(chalk.green(`\n✓ Architecture diagrams generated at ${opts.output}`));
    });
}

function onboardingCommand(): Command {
  return new Command('onboarding')
    .description('Generate onboarding documentation')
    .option('-o, --output <path>', 'Output file', 'docs/ONBOARDING.md')
    .action((opts) => {
      console.log(chalk.bold('\n=== Generating Onboarding Guide ===\n'));
      generateOnboarding(opts.output);
      console.log(chalk.green(`\n✓ Onboarding guide generated at ${opts.output}`));
    });
}
