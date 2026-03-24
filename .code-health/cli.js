#!/usr/bin/env node
import { Command } from 'commander';
import { debtCommands } from './src/commands/debt.js';
import { reportCommand } from './src/commands/report.js';
import { gateCommand } from './src/commands/gate.js';
import { dashboardCommand } from './src/commands/dashboard.js';

const program = new Command();

program
  .name('code-health')
  .description('Code Health Governance CLI - Manage technical debt, quality gates, and documentation')
  .version('1.0.0');

program.addCommand(debtCommands());
program.addCommand(reportCommand());
program.addCommand(gateCommand());
program.addCommand(dashboardCommand());

program.parse();
