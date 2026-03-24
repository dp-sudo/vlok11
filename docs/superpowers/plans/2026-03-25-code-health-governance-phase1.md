# Code Health Governance - Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 `.code-health/` 基础设施、DebtRegistry CLI 和检测规则

**Architecture:** TypeScript + Node.js CLI，基于 JSON 文件的债务登记册，集成 ESLint 和 TypeScript 检查

**Tech Stack:** Node.js, TypeScript, Commander.js, ESLint, TypeScript

---

## Chunk 1: 创建目录结构和基础配置

**Files:**
- Create: `.code-health/package.json`
- Create: `.code-health/tsconfig.json`
- Create: `.code-health/config/detection-rules.json`
- Create: `.code-health/config/interest-policy.json`

- [ ] **Step 1: Create `.code-health/` directory and package.json**

```json
// .code-health/package.json
{
  "name": "@immersa/code-health",
  "version": "1.0.0",
  "type": "module",
  "description": "Code Health Governance CLI tools",
  "private": true,
  "bin": {
    "code-health": "./cli.js"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "chalk": "^5.3.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: Create `.code-health/tsconfig.json`**

```json
// .code-health/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `.code-health/config/detection-rules.json`**

```json
// .code-health/config/detection-rules.json
{
  "$schema": "./schemas/detection-rules.schema.json",
  "rules": [
    {
      "id": "no-explicit-any",
      "pattern": ": any",
      "severity": "minor",
      "category": "type-safety",
      "autoRegister": true,
      "dryRun": false,
      "description": "禁止使用 explicit any 类型"
    },
    {
      "id": "circular-dependency",
      "tool": "depcheck",
      "severity": "major",
      "category": "architecture",
      "autoRegister": true,
      "description": "检测循环依赖"
    },
    {
      "id": "large-file",
      "threshold": 500,
      "unit": "lines",
      "severity": "cosmetic",
      "category": "complexity",
      "autoRegister": true,
      "description": "文件超过 500 行"
    },
    {
      "id": "deep-nesting",
      "pattern": "if.*if.*if.*if",
      "severity": "minor",
      "category": "complexity",
      "autoRegister": false,
      "description": "检测深层嵌套 (4+ 层)"
    },
    {
      "id": "code-duplication",
      "tool": "tscpd",
      "threshold": 3,
      "severity": "major",
      "category": "duplication",
      "autoRegister": false,
      "description": "代码重复 3 次以上"
    },
    {
      "id": "unused-export",
      "tool": "tsc",
      "flags": ["--noUnusedLocals", "--noUnusedParameters"],
      "severity": "minor",
      "category": "complexity",
      "autoRegister": false,
      "description": "未使用的导出"
    },
    {
      "id": "event-string-literal",
      "pattern": "as never",
      "severity": "major",
      "category": "type-safety",
      "autoRegister": true,
      "description": "事件类型使用 string literal 而非联合类型"
    },
    {
      "id": "magic-number",
      "pattern": "Math\\.pow|parseInt\\(.*,\\s*[89]",
      "severity": "minor",
      "category": "complexity",
      "autoRegister": false,
      "description": "魔法数字"
    }
  ]
}
```

- [ ] **Step 4: Create `.code-health/config/interest-policy.json`**

```json
// .code-health/config/interest-policy.json
{
  "$schema": "./schemas/interest-policy.schema.json",
  "enabled": true,
  "calculationPeriod": "quarterly",
  "baseCurrency": "hours",
  "quarterlyInterestRate": {
    "critical": 15,
    "major": 10,
    "minor": 5,
    "cosmetic": 2
  },
  "escalationRules": [
    {
      "fromSeverity": "minor",
      "quartersUntilEscalation": 4,
      "newSeverity": "major",
      "blockMerge": false
    },
    {
      "fromSeverity": "major",
      "quartersUntilEscalation": 2,
      "newSeverity": "critical",
      "blockMerge": true
    }
  ],
  "blockMergeThresholds": {
    "criticalDebtCount": 0,
    "totalInterestHours": 40,
    "debtAgeQuarters": 6
  }
}
```

- [ ] **Step 5: Commit**

```bash
mkdir -p .code-health/config .code-health/schemas
git add .code-health/
git commit -m "feat(code-health): add directory structure and base config"
```

---

## Chunk 2: 实现 DebtRegistry 数据结构

**Files:**
- Create: `.code-health/src/types.ts`
- Create: `.code-health/src/schemas/debt.schema.ts`
- Create: `.code-health/config/debt-registry.json` (initial empty state)

- [ ] **Step 1: Create `.code-health/src/types.ts`**

```typescript
// .code-health/src/types.ts
export type DebtCategory =
  | 'type-safety'
  | 'memory-leak'
  | 'performance'
  | 'architecture'
  | 'test-coverage'
  | 'documentation'
  | 'security'
  | 'complexity'
  | 'duplication'
  | 'naming'
  | 'obsolete'
  | 'other';

export type DebtSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';

export type DebtStatus =
  | 'acknowledged'
  | 'monitored'
  | 'scheduled'
  | 'in-progress'
  | 'paid'
  | 'discarded';

export interface DebtEvidence {
  type: 'code' | 'metric' | 'screenshot' | 'error-log' | 'test-result';
  content: string;
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  capturedAt: string;
}

export interface DebtRepayment {
  id: string;
  debtId: string;
  amount: number;
  description: string;
  committedAt: string;
  completedAt?: string;
  commitHash?: string;
  status: 'committed' | 'partial' | 'completed';
}

export interface TechnicalDebt {
  id: string;
  title: string;
  description: string;
  severity: DebtSeverity;
  interestRate: number;
  category: DebtCategory;
  affectedModules: string[];
  introducedIn: {
    commit: string;
    pr?: string;
    reason?: string;
  };
  reportedBy: string;
  reportedAt: string;
  dueDate?: string;
  status: DebtStatus;
  repaymentEstimate?: number;
  actualRepaymentHours?: number;
  evidence: DebtEvidence[];
  repayments: DebtRepayment[];
}

export interface DebtRegistry {
  version: string;
  lastUpdated: string;
  debts: TechnicalDebt[];
  summary: {
    total: number;
    bySeverity: Record<DebtSeverity, number>;
    byCategory: Record<DebtCategory, number>;
    totalInterestHours: number;
    totalRepaymentHours: number;
  };
}

export interface DetectionRule {
  id: string;
  pattern?: string;
  tool?: string;
  threshold?: number;
  unit?: string;
  flags?: string[];
  severity: DebtSeverity;
  category: DebtCategory;
  autoRegister: boolean;
  dryRun: boolean;
  description: string;
}

export interface InterestPolicy {
  enabled: boolean;
  calculationPeriod: 'quarterly' | 'monthly';
  baseCurrency: string;
  quarterlyInterestRate: Record<DebtSeverity, number>;
  escalationRules: EscalationRule[];
  blockMergeThresholds: BlockMergeThresholds;
}

export interface EscalationRule {
  fromSeverity: DebtSeverity;
  quartersUntilEscalation: number;
  newSeverity: DebtSeverity;
  blockMerge: boolean;
}

export interface BlockMergeThresholds {
  criticalDebtCount: number;
  totalInterestHours: number;
  debtAgeQuarters: number;
}
```

- [ ] **Step 2: Create `.code-health/src/schemas/debt.schema.ts`**

```typescript
// .code-health/src/schemas/debt.schema.ts
import { z } from 'zod';

export const DebtCategorySchema = z.enum([
  'type-safety',
  'memory-leak',
  'performance',
  'architecture',
  'test-coverage',
  'documentation',
  'security',
  'complexity',
  'duplication',
  'naming',
  'obsolete',
  'other',
]);

export const DebtSeveritySchema = z.enum(['critical', 'major', 'minor', 'cosmetic']);

export const DebtStatusSchema = z.enum([
  'acknowledged',
  'monitored',
  'scheduled',
  'in-progress',
  'paid',
  'discarded',
]);

export const DebtEvidenceSchema = z.object({
  type: z.enum(['code', 'metric', 'screenshot', 'error-log', 'test-result']),
  content: z.string(),
  location: z.object({
    file: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
  }).optional(),
  capturedAt: z.string(),
});

export const DebtRepaymentSchema = z.object({
  id: z.string(),
  debtId: z.string(),
  amount: z.number(),
  description: z.string(),
  committedAt: z.string(),
  completedAt: z.string().optional(),
  commitHash: z.string().optional(),
  status: z.enum(['committed', 'partial', 'completed']),
});

export const TechnicalDebtSchema = z.object({
  id: z.string().regex(/^TD-\d{4}-\d{3}$/),
  title: z.string().min(1).max(200),
  description: z.string(),
  severity: DebtSeveritySchema,
  interestRate: z.number().min(0).max(100),
  category: DebtCategorySchema,
  affectedModules: z.array(z.string()),
  introducedIn: z.object({
    commit: z.string(),
    pr: z.string().optional(),
    reason: z.string().optional(),
  }),
  reportedBy: z.string(),
  reportedAt: z.string(),
  dueDate: z.string().optional(),
  status: DebtStatusSchema,
  repaymentEstimate: z.number().optional(),
  actualRepaymentHours: z.number().optional(),
  evidence: z.array(DebtEvidenceSchema),
  repayments: z.array(DebtRepaymentSchema),
});

export const DebtRegistrySchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  debts: z.array(TechnicalDebtSchema),
  summary: z.object({
    total: z.number(),
    bySeverity: z.record(DebtSeveritySchema, z.number()),
    byCategory: z.record(DebtCategorySchema, z.number()),
    totalInterestHours: z.number(),
    totalRepaymentHours: z.number(),
  }),
});

export type DebtRegistryInput = z.input<typeof DebtRegistrySchema>;
export type DebtRegistryOutput = z.output<typeof DebtRegistrySchema>;
```

- [ ] **Step 3: Create `.code-health/config/debt-registry.json` (empty state)**

```json
// .code-health/config/debt-registry.json
{
  "version": "1.0.0",
  "lastUpdated": "2026-03-25T00:00:00.000Z",
  "debts": [],
  "summary": {
    "total": 0,
    "bySeverity": {
      "critical": 0,
      "major": 0,
      "minor": 0,
      "cosmetic": 0
    },
    "byCategory": {
      "type-safety": 0,
      "memory-leak": 0,
      "performance": 0,
      "architecture": 0,
      "test-coverage": 0,
      "documentation": 0,
      "security": 0,
      "complexity": 0,
      "duplication": 0,
      "naming": 0,
      "obsolete": 0,
      "other": 0
    },
    "totalInterestHours": 0,
    "totalRepaymentHours": 0
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .code-health/src .code-health/config/debt-registry.json
git commit -m "feat(code-health): add DebtRegistry types and schemas"
```

---

## Chunk 3: 实现 DebtRegistry Manager

**Files:**
- Create: `.code-health/src/DebtRegistry.ts`
- Create: `.code-health/src/InterestCalculator.ts`

- [ ] **Step 1: Create `.code-health/src/DebtRegistry.ts`**

```typescript
// .code-health/src/DebtRegistry.ts
import { readFileSync, writeFileSync } from 'fs';
import { z } from 'zod';
import { DebtRegistrySchema, TechnicalDebtSchema } from './schemas/debt.schema.js';
import type { TechnicalDebt, DebtRegistry, DebtRepayment } from './types.js';

export class DebtRegistryManager {
  private registryPath: string;
  private registry: DebtRegistry;

  constructor(registryPath: string = './config/debt-registry.json') {
    this.registryPath = registryPath;
    this.registry = this.load();
  }

  private load(): DebtRegistry {
    try {
      const content = readFileSync(this.registryPath, 'utf-8');
      const parsed = JSON.parse(content);
      return DebtRegistrySchema.parse(parsed);
    } catch {
      return DebtRegistrySchema.parse({
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        debts: [],
        summary: {
          total: 0,
          bySeverity: { critical: 0, major: 0, minor: 0, cosmetic: 0 },
          byCategory: {
            'type-safety': 0, 'memory-leak': 0, 'performance': 0,
            'architecture': 0, 'test-coverage': 0, 'documentation': 0,
            'security': 0, 'complexity': 0, 'duplication': 0,
            'naming': 0, 'obsolete': 0, 'other': 0,
          },
          totalInterestHours: 0,
          totalRepaymentHours: 0,
        },
      });
    }
  }

  save(): void {
    this.registry.lastUpdated = new Date().toISOString();
    this.recalculateSummary();
    writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2), 'utf-8');
  }

  addDebt(debt: Omit<TechnicalDebt, 'id' | 'reportedAt' | 'repayments'>): TechnicalDebt {
    const year = new Date().getFullYear();
    const sequence = String(this.registry.debts.length + 1).padStart(3, '0');
    const newDebt: TechnicalDebt = {
      ...debt,
      id: `TD-${year}-${sequence}`,
      reportedAt: new Date().toISOString(),
      repayments: [],
    };
    TechnicalDebtSchema.parse(newDebt);
    this.registry.debts.push(newDebt);
    this.save();
    return newDebt;
  }

  getDebt(id: string): TechnicalDebt | undefined {
    return this.registry.debts.find(d => d.id === id);
  }

  listDebts(filter?: {
    severity?: string[];
    category?: string[];
    status?: string[];
  }): TechnicalDebt[] {
    let debts = [...this.registry.debts];
    if (filter?.severity?.length) {
      debts = debts.filter(d => filter.severity!.includes(d.severity));
    }
    if (filter?.category?.length) {
      debts = debts.filter(d => filter.category!.includes(d.category));
    }
    if (filter?.status?.length) {
      debts = debts.filter(d => filter.status!.includes(d.status));
    }
    return debts.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2, cosmetic: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  updateDebtStatus(id: string, status: TechnicalDebt['status']): boolean {
    const debt = this.getDebt(id);
    if (!debt) return false;
    debt.status = status;
    this.save();
    return true;
  }

  addRepayment(debtId: string, repayment: Omit<DebtRepayment, 'id' | 'debtId' | 'committedAt'>): boolean {
    const debt = this.getDebt(debtId);
    if (!debt) return false;
    const newRepayment: DebtRepayment = {
      ...repayment,
      id: `PAY-${new Date().getFullYear()}-${String(debt.repayments.length + 1).padStart(3, '0')}`,
      debtId,
      committedAt: new Date().toISOString(),
    };
    debt.repayments.push(newRepayment);
    if (repayment.status === 'completed') {
      debt.actualRepaymentHours = (debt.actualRepaymentHours || 0) + repayment.amount;
      debt.status = 'paid';
    }
    this.save();
    return true;
  }

  getSummary() {
    return this.registry.summary;
  }

  private recalculateSummary(): void {
    const summary = this.registry.summary;
    summary.total = this.registry.debts.length;
    summary.bySeverity = { critical: 0, major: 0, minor: 0, cosmetic: 0 };
    summary.byCategory = {
      'type-safety': 0, 'memory-leak': 0, 'performance': 0,
      'architecture': 0, 'test-coverage': 0, 'documentation': 0,
      'security': 0, 'complexity': 0, 'duplication': 0,
      'naming': 0, 'obsolete': 0, 'other': 0,
    };
    summary.totalRepaymentHours = 0;
    for (const debt of this.registry.debts) {
      summary.bySeverity[debt.severity]++;
      summary.byCategory[debt.category]++;
      for (const repayment of debt.repayments) {
        if (repayment.status === 'completed') {
          summary.totalRepaymentHours += repayment.amount;
        }
      }
    }
  }
}
```

- [ ] **Step 2: Create `.code-health/src/InterestCalculator.ts`**

```typescript
// .code-health/src/InterestCalculator.ts
import type { TechnicalDebt, InterestPolicy } from './types.js';

export class InterestCalculator {
  constructor(private policy: InterestPolicy) {}

  calculateInterest(debt: TechnicalDebt, quartersElapsed: number): number {
    if (!this.policy.enabled || debt.status === 'paid') return 0;
    const baseRate = this.policy.quarterlyInterestRate[debt.severity];
    return debt.repaymentEstimate
      ? (debt.repaymentEstimate * baseRate / 100) * quartersElapsed
      : baseRate * quartersElapsed * 0.5;
  }

  calculateTotalInterest(debts: TechnicalDebt[]): number {
    const now = new Date();
    return debts.reduce((total, debt) => {
      if (debt.status === 'paid') return total;
      const reportedDate = new Date(debt.reportedAt);
      const quartersElapsed = this.getQuartersElapsed(reportedDate, now);
      return total + this.calculateInterest(debt, quartersElapsed);
    }, 0);
  }

  shouldBlockMerge(debts: TechnicalDebt[]): { blocked: boolean; reasons: string[] } {
    if (!this.policy.blockMergeThresholds) return { blocked: false, reasons: [] };
    const reasons: string[] = [];
    const critical = debts.filter(d => d.severity === 'critical' && d.status !== 'paid');
    const totalInterest = this.calculateTotalInterest(debts.filter(d => d.status !== 'paid'));
    const threshold = this.policy.blockMergeThresholds;
    if (critical.length > threshold.criticalDebtCount) {
      reasons.push(`${critical.length} critical debts (max: ${threshold.criticalDebtCount})`);
    }
    if (totalInterest > threshold.totalInterestHours) {
      reasons.push(`Total interest ${totalInterest.toFixed(1)}h exceeds ${threshold.totalInterestHours}h`);
    }
    const oldDebts = debts.filter(d => {
      if (d.status === 'paid') return false;
      const quarters = this.getQuartersElapsed(new Date(d.reportedAt), now);
      return quarters > threshold.debtAgeQuarters;
    });
    if (oldDebts.length > 0) {
      reasons.push(`${oldDebts.length} debts older than ${threshold.debtAgeQuarters} quarters`);
    }
    return { blocked: reasons.length > 0, reasons };
  }

  private getQuartersElapsed(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.floor(months / 3);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .code-health/src/
git commit -m "feat(code-health): add DebtRegistryManager and InterestCalculator"
```

---

## Chunk 4: 实现 CLI 入口和 debt 命令

**Files:**
- Create: `.code-health/cli.js`
- Create: `.code-health/src/commands/debt.ts`
- Create: `.code-health/src/commands/report.ts`

- [ ] **Step 1: Create `.code-health/cli.js`**

```javascript
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

program.addCommand(debtCommands.list());
program.addCommand(debtCommands.add());
program.addCommand(debtCommands.repay());
program.addCommand(debtCommands.update());
program.addCommand(reportCommand());
program.addCommand(gateCommand());
program.addCommand(dashboardCommand());

program.parse();
```

- [ ] **Step 2: Create `.code-health/src/commands/debt.ts`**

```typescript
// .code-health/src/commands/debt.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { DebtRegistryManager } from '../DebtRegistry.js';
import type { TechnicalDebt, DebtSeverity, DebtCategory } from '../types.js';

const registryPath = new URL('../../config/debt-registry.json', import.meta.url).pathname;
const registry = new DebtRegistryManager(registryPath);

function severityColor(severity: DebtSeverity): string {
  switch (severity) {
    case 'critical': return chalk.red;
    case 'major': return chalk.yellow;
    case 'minor': return chalk.blue;
    case 'cosmetic': return chalk.gray;
  }
}

export function debtCommands() {
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
```

- [ ] **Step 3: Create `.code-health/src/commands/report.ts`**

```typescript
// .code-health/src/commands/report.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { DebtRegistryManager } from '../DebtRegistry.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const registryPath = path.join(fileURLToPath(import.meta.url), '../../../config/debt-registry.json');
const registry = new DebtRegistryManager(registryPath);

export function reportCommand(): Command {
  return new Command('report')
    .description('Generate debt health report')
    .action(() => {
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
```

- [ ] **Step 4: Create stub commands for gate and dashboard**

```typescript
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
```

```typescript
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
```

- [ ] **Step 5: Install dependencies and test**

```bash
cd .code-health && npm install && npm link
code-health debt list
code-health debt report
```

- [ ] **Step 6: Commit**

```bash
git add .code-health/cli.js .code-health/src/commands/
git commit -m "feat(code-health): add CLI entry point and debt commands"
```

---

## Chunk 5: 注册初始债务并配置 ESLint

**Files:**
- Modify: `.code-health/config/debt-registry.json`
- Create: `.eslintrc.code-health.js` (if needed)
- Modify: `package.json` (add script)

- [ ] **Step 1: Register initial 10 debts from design doc**

Update `.code-health/config/debt-registry.json` with:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-03-25T00:00:00.000Z",
  "debts": [
    {
      "id": "TD-2026-001",
      "title": "EventBus allows type erasure",
      "description": "EventBus uses any for event payloads, losing type safety. The emit() method accepts any payload and handlers receive untyped events.",
      "severity": "major",
      "interestRate": 10,
      "category": "type-safety",
      "affectedModules": ["src/core/EventBus.ts", "src/core/EventTypes.ts"],
      "introducedIn": { "commit": "unknown", "reason": "Initial implementation" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 4,
      "evidence": [
        {
          "type": "code",
          "content": "emit(event: string, data?: any)",
          "location": { "file": "src/core/EventBus.ts" },
          "capturedAt": "2026-03-25T00:00:00.000Z"
        }
      ],
      "repayments": []
    },
    {
      "id": "TD-2026-002",
      "title": "Duplicate Gaussian Splatting implementations",
      "description": "Two independent implementations of Gaussian Splatting renderer exist in the codebase, causing maintenance burden.",
      "severity": "major",
      "interestRate": 10,
      "category": "duplication",
      "affectedModules": ["src/features/render"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 16,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-003",
      "title": "Shader code duplication (random/luminance)",
      "description": "Shader utility functions like random() and luminance() are duplicated across shader files.",
      "severity": "minor",
      "interestRate": 5,
      "category": "duplication",
      "affectedModules": ["src/shared/shaders"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 8,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-004",
      "title": "SettingsService weak encryption",
      "description": "Base64 encoding used for sensitive data (encryption key) is easily reversible, not true encryption.",
      "severity": "critical",
      "interestRate": 15,
      "category": "security",
      "affectedModules": ["src/features/settings"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 2,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-005",
      "title": "PipelineEngine pseudo-parallelism",
      "description": "PipelineEngine claims to support parallel execution but actually runs stages sequentially.",
      "severity": "major",
      "interestRate": 10,
      "category": "architecture",
      "affectedModules": ["src/core/pipeline/PipelineEngine.ts"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 8,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-006",
      "title": "ModelCacheService is unused",
      "description": "ModelCacheService was created but never integrated into the AI service layer.",
      "severity": "minor",
      "interestRate": 5,
      "category": "obsolete",
      "affectedModules": ["src/features/ai/services/ModelCacheService.ts"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 2,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-007",
      "title": "Excessive magic numbers",
      "description": "Multiple magic numbers scattered throughout codebase without named constants.",
      "severity": "cosmetic",
      "interestRate": 2,
      "category": "complexity",
      "affectedModules": ["src/features/scene", "src/features/render"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 12,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-008",
      "title": "Memory leak risk (EventBus handlers)",
      "description": "EventBus handlers registered in components may not be properly cleaned up on unmount.",
      "severity": "minor",
      "interestRate": 5,
      "category": "memory-leak",
      "affectedModules": ["src/core/EventBus.ts"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 6,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-009",
      "title": "Singleton abuse",
      "description": "Overuse of singleton pattern creating tight coupling and making testing difficult.",
      "severity": "major",
      "interestRate": 10,
      "category": "architecture",
      "affectedModules": ["src/features/scene", "src/core"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 20,
      "evidence": [],
      "repayments": []
    },
    {
      "id": "TD-2026-010",
      "title": "Low documentation coverage",
      "description": "Core modules lack API documentation, making onboarding difficult.",
      "severity": "minor",
      "interestRate": 5,
      "category": "documentation",
      "affectedModules": ["src/core", "src/features"],
      "introducedIn": { "commit": "unknown" },
      "reportedBy": "Claude Code Analysis",
      "reportedAt": "2026-03-25T00:00:00.000Z",
      "status": "acknowledged",
      "repaymentEstimate": 8,
      "evidence": [],
      "repayments": []
    }
  ],
  "summary": {
    "total": 10,
    "bySeverity": { "critical": 1, "major": 4, "minor": 4, "cosmetic": 1 },
    "byCategory": {
      "type-safety": 1, "memory-leak": 1, "performance": 0,
      "architecture": 2, "test-coverage": 0, "documentation": 1,
      "security": 1, "complexity": 1, "duplication": 2,
      "naming": 0, "obsolete": 1, "other": 0
    },
    "totalInterestHours": 0,
    "totalRepaymentHours": 0
  }
}
```

- [ ] **Step 2: Add code-health scripts to package.json**

```bash
# Add to package.json scripts section:
"code-health": "node .code-health/cli.js",
"code-health:debt": "node .code-health/cli.js debt",
"code-health:report": "node .code-health/cli.js report"
```

- [ ] **Step 3: Verify CLI works**

```bash
npm run code-health:debt -- list
npm run code-health:report
```

- [ ] **Step 4: Commit**

```bash
git add .code-health/config/debt-registry.json package.json
git commit -m "feat(code-health): register initial 10 technical debts"
```

---

## Summary

After completing all chunks:
- `.code-health/` infrastructure created
- DebtRegistry CLI operational with `list`, `add`, `repay`, `update` commands
- 10 initial debts registered
- Ready for Phase 2: Automation detection and dashboard
