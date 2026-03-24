#!/usr/bin/env node
import { Command } from 'commander';
import { debtCommands } from './dist/commands/debt.js';
import { reportCommand } from './dist/commands/report.js';
import { gateCommand } from './dist/commands/gate.js';
import { dashboardCommand } from './dist/commands/dashboard.js';

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
