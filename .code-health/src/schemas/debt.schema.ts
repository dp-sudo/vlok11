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
