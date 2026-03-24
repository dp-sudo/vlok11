# Code Health Governance - Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现债务检测自动化和健康仪表板

**Architecture:** 基于 ESLint/TypeScript 的检测脚本 + HTML/JSON 仪表板

**Tech Stack:** Node.js, ESLint, TypeScript, HTML/JS (dashboard)

---

## Chunk 1: 实现检测脚本

**Files:**
- Create: `.code-health/src/scripts/run-detections.ts`
- Create: `.code-health/src/scripts/check-explicit-any.ts`
- Modify: `.code-health/src/commands/gate.ts`

- [ ] **Step 1: Create detection runner script**

```typescript
// .code-health/src/scripts/run-detections.ts
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../../config/detection-rules.json');

interface DetectionRule {
  id: string;
  pattern?: string;
  tool?: string;
  threshold?: number;
  severity: string;
  category: string;
  autoRegister: boolean;
  dryRun: boolean;
  description: string;
}

interface DetectionResult {
  ruleId: string;
  file: string;
  line?: number;
  column?: number;
  code: string;
}

export async function runDetections(): Promise<DetectionResult[]> {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const results: DetectionResult[] = [];

  for (const rule of config.rules as DetectionRule[]) {
    if (rule.tool === 'tsc') {
      try {
        execSync('npx tsc --noEmit 2>&1', { encoding: 'utf-8', stdio: 'pipe' });
      } catch (e: unknown) {
        const output = (e as { stdout?: string }).stdout || '';
        // Parse tsc output for unused exports
      }
    } else if (rule.pattern) {
      // Pattern-based detection using grep
      try {
        const cmd = `grep -rn "${rule.pattern}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        const lines = output.split('\n').filter(Boolean);
        for (const line of lines) {
          const match = line.match(/^(.+):(\d+):(\d+):(.*)$/);
          if (match) {
            results.push({
              ruleId: rule.id,
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              code: match[4].trim(),
            });
          }
        }
      } catch {
        // grep returns non-zero when no matches
      }
    }
  }
  return results;
}
```

- [ ] **Step 2: Create explicit-any checker**

```typescript
// .code-health/src/scripts/check-explicit-any.ts
import { execSync } from 'child_process';
import { DebtRegistryManager } from '../DebtRegistry.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../../config/debt-registry.json');

export interface AnyFinding {
  file: string;
  line: number;
  column: number;
  code: string;
}

export function checkExplicitAny(): AnyFinding[] {
  const findings: AnyFinding[] = [];
  try {
    const output = execSync(
      'grep -rn ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true',
      { encoding: 'utf-8' }
    );
    const lines = output.split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/^(.+):(\d+):(\d+):\s*(.*)$/);
      if (match) {
        findings.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4].trim(),
        });
      }
    }
  } catch {
    // grep returns non-zero when no matches
  }
  return findings;
}

export function reportNewAnyFindings(): void {
  const findings = checkExplicitAny();
  const registry = new DebtRegistryManager(registryPath);
  console.log(`\n=== Explicit Any Check ===`);
  console.log(`Found ${findings.length} uses of explicit 'any'\n`);
  if (findings.length > 0) {
    for (const f of findings.slice(0, 10)) {
      console.log(`  ${f.file}:${f.line} - ${f.code}`);
    }
    if (findings.length > 10) {
      console.log(`  ... and ${findings.length - 10} more`);
    }
  }
}
```

- [ ] **Step 3: Update gate.ts to run detections**

```typescript
// .code-health/src/commands/gate.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { checkExplicitAny } from '../scripts/check-explicit-any.js';

export function gateCommand(): Command {
  return new Command('gate')
    .description('Run quality gate checks')
    .option('--strict', 'Fail on warnings')
    .action((opts) => {
      console.log(chalk.bold('\n=== Quality Gate ===\n'));

      // Run explicit any check
      const anyFindings = checkExplicitAny();
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
```

- [ ] **Step 4: Commit**

```bash
git add .code-health/src/scripts/ .code-health/src/commands/gate.ts
git commit -m "feat(code-health): add detection scripts and gate command"
```

---

## Chunk 2: 创建健康仪表板

**Files:**
- Create: `.code-health/src/commands/dashboard.ts` (full implementation)
- Create: `.code-health/templates/dashboard-template.html`

- [ ] **Step 1: Create dashboard generator**

```typescript
// .code-health/src/commands/dashboard.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { DebtRegistryManager } from '../DebtRegistry.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../../config/debt-registry.json');
const templatePath = path.resolve(__dirname, '../../templates/dashboard-template.html');

export function dashboardCommand(): Command {
  return new Command('dashboard')
    .description('Generate health dashboard')
    .option('-o, --output <path>', 'Output path', './docs/health-dashboard.html')
    .action((opts) => {
      const registry = new DebtRegistryManager(registryPath);
      const summary = registry.getSummary();
      const debts = registry.listDebts();

      const html = generateDashboard(summary, debts);
      writeFileSync(opts.output, html, 'utf-8');
      console.log(chalk.green(`Dashboard generated: ${opts.output}`));
    });
}

function generateDashboard(summary: ReturnType<DebtRegistryManager['getSummary']>, debts: ReturnType<DebtRegistryManager['listDebts']>): string {
  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    major: '#ca8a04',
    minor: '#2563eb',
    cosmetic: '#6b7280',
  };

  const debtsBySeverity = debts.reduce((acc, d) => {
    acc[d.severity] = (acc[d.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const debtsByCategory = debts.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Health Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card-value { font-size: 2rem; font-weight: 700; }
    .card-label { color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem; }
    .critical .card-value { color: #dc2626; }
    .major .card-value { color: #ca8a04; }
    .minor .card-value { color: #2563eb; }
    .cosmetic .card-value { color: #6b7280; }
    .severity-chart { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .severity-bar { flex: 1; height: 8px; border-radius: 4px; background: #e5e7eb; overflow: hidden; }
    .severity-fill { height: 100%; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th { text-align: left; padding: 1rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 500; font-size: 0.875rem; color: #6b7280; }
    td { padding: 1rem; border-bottom: 1px solid #e5e7eb; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge-critical { background: #fee2e2; color: #dc2626; }
    .badge-major { background: #fef3c7; color: #ca8a04; }
    .badge-minor { background: #dbeafe; color: #2563eb; }
    .badge-cosmetic { background: #f3f4f6; color: #6b7280; }
    .updated { color: #6b7280; font-size: 0.75rem; margin-top: 1rem; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Health Dashboard</h1>

    <div class="summary">
      <div class="card">
        <div class="card-value">${summary.total}</div>
        <div class="card-label">Total Debts</div>
      </div>
      <div class="card critical">
        <div class="card-value">${summary.bySeverity.critical}</div>
        <div class="card-label">Critical</div>
      </div>
      <div class="card major">
        <div class="card-value">${summary.bySeverity.major}</div>
        <div class="card-label">Major</div>
      </div>
      <div class="card minor">
        <div class="card-value">${summary.bySeverity.minor}</div>
        <div class="card-label">Minor</div>
      </div>
      <div class="card cosmetic">
        <div class="card-value">${summary.bySeverity.cosmetic}</div>
        <div class="card-label">Cosmetic</div>
      </div>
    </div>

    <div class="severity-chart">
      ${Object.entries(severityColors).map(([sev, color]) => `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;font-size:0.75rem;">
            <span style="text-transform:capitalize;">${sev}</span>
            <span>${debtsBySeverity[sev] || 0}</span>
          </div>
          <div class="severity-bar">
            <div class="severity-fill" style="width:${((debtsBySeverity[sev] || 0) / summary.total * 100) || 0}%;background:${color}"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <h1 style="margin-top:2rem;margin-bottom:1rem;">Debt Registry</h1>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Severity</th>
          <th>Category</th>
          <th>Status</th>
          <th>Estimate</th>
        </tr>
      </thead>
      <tbody>
        ${debts.map(d => `
          <tr>
            <td><code>${d.id}</code></td>
            <td>${d.title}</td>
            <td><span class="badge badge-${d.severity}">${d.severity}</span></td>
            <td>${d.category}</td>
            <td>${d.status}</td>
            <td>${d.repaymentEstimate || '-'}h</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="updated">Last updated: ${new Date().toISOString()}</div>
  </div>
</body>
</html>`;
}
```

- [ ] **Step 2: Create templates directory**

```bash
mkdir -p .code-health/templates
```

- [ ] **Step 3: Compile TypeScript and test dashboard**

```bash
cd .code-health && npx tsc
cd .. && node .code-health/cli.js dashboard -o ./docs/health-dashboard.html
```

- [ ] **Step 4: Commit**

```bash
git add .code-health/src/commands/dashboard.ts .code-health/templates/
git commit -m "feat(code-health): add dashboard generator with HTML visualization"
```

---

## Chunk 3: 运行初始检测并更新债务

**Files:**
- Run: Detection scripts to find explicit any usage
- Modify: `.code-health/config/debt-registry.json` (add auto-detected debts)

- [ ] **Step 1: Run explicit-any detection**

```bash
node .code-health/cli.js gate
```

- [ ] **Step 2: Review and register new findings**

Based on the detection results, manually add any new debts discovered by the automated tools.

- [ ] **Step 3: Commit detection results**

```bash
git add .code-health/
git commit -m "feat(code-health): run initial detection and update debts"
```

---

## Summary

After completing all chunks:
- Detection scripts implemented (explicit-any checker)
- Gate command fully functional
- Dashboard generator creates visual HTML report
- Initial detection run completed
