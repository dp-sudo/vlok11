# 代码健康治理体系 - 架构设计文档

**版本**: 1.0.0
**日期**: 2026-03-25
**状态**: Draft
**作者**: Claude

---

## 1. 概述

### 1.1 项目背景

IMMERSA 3D Scene Viewer 是一个基于 React Three Fiber 的 AI 驱动 2D 到 3D 场景重建应用。经过深度代码审查，发现以下核心问题：

- **模块边界不清**：Features 和 Core 之间耦合紧密，单体滥用
- **类型安全缺口**：存在 `any` 逃逸，事件 payload 未完全类型化
- **重复实现**：Gaussian Splatting 渲染器存在两份独立实现
- **技术债务积累**：魔法数字、字符串拼接 Shader、内存泄漏风险
- **文档缺失**：API 文档、架构图、新人导览不完整

### 1.2 解决方案

建立**代码健康治理体系（Code Health Governance）**，实现：

1. **技术债务管理系统**：自动化检测、登记、追踪、偿还
2. **文档自动化系统**：API 文档、架构图、ADR、Onboarding 同步生成
3. **架构守护机制**：质量门禁、架构决策记录、模块边界检查
4. **持续监控仪表板**：代码健康趋势、可视化指标

### 1.3 设计原则

- **渐进式演进**：不破坏现有功能，逐步替换和优化
- **证据驱动**：所有决策基于代码指标和事实
- **自动化优先**：减少人工负担，提高执行一致性
- **可度量**：关键指标可追踪、可视化

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    CODE HEALTH GOVERNOR                      │
│                  (代码健康治理中心 - CLI + CI)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  Technical  │  │  ADR        │  │  Quality        │   │
│  │  Debt       │  │  Manager    │  │  Gate           │   │
│  │  Registry   │  │             │  │  Engine         │   │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              EVIDENCE COLLECTOR                      │   │
│  │    LSP诊断 + 静态分析 + 测试覆盖 + 性能基准           │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                               │
│                            ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           DOCUMENTATION GENERATOR                     │   │
│  │   API Docs + 架构图 + ADR + Onboarding Guide         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块

| 模块 | 职责 | 技术选型 |
|------|------|---------|
| DebtRegistry | 技术债务登记、追踪、利息计算 | TypeScript + JSON 文件 |
| ADRManager | 架构决策记录管理 | Markdown + CLI |
| QualityGate | 质量门禁自动化检查 | ESLint + TypeScript + Vitest |
| EvidenceCollector | 代码指标收集 | LSP + 自研 CLI |
| DocGenerator | 文档自动化生成 | TypeDoc + Mermaid + 自研 |
| Dashboard | 健康指标可视化 | JSON + HTML/React |

---

## 3. 技术债务管理系统

### 3.1 债务登记册

**文件位置**: `.code-health/debt-registry.json`

```typescript
// 债务条目接口
interface TechnicalDebt {
  id: string;                    // 格式: TD-YYYY-NNN (如 TD-2026-001)
  title: string;                 // 简洁标题
  description: string;           // 详细描述
  severity: 'critical' | 'major' | 'minor' | 'cosmetic';
  interestRate: number;          // 季度利息增长率 (%)
  category: DebtCategory;
  affectedModules: string[];     // 受影响模块路径
  introducedIn: {
    commit: string;
    pr?: string;
    reason?: string;
  };
  reportedBy: string;
  reportedAt: string;            // ISO 日期
  dueDate?: string;             // 计划偿还日期
  status: DebtStatus;
  repaymentEstimate?: number;    // 预估工时 (小时)
  actualRepaymentHours?: number; // 实际工时
  evidence: DebtEvidence[];
  repayments: DebtRepayment[];
}

type DebtCategory =
  | 'type-safety'      // any 使用、隐式 any
  | 'memory-leak'      // 内存泄漏风险
  | 'performance'      // 性能问题
  | 'architecture'     // 架构 debt
  | 'test-coverage'    // 测试覆盖不足
  | 'documentation'    // 文档缺失
  | 'security'         // 安全问题
  | 'complexity'       // 过度复杂
  | 'duplication'      // 代码重复
  | 'naming'          // 命名不一致
  | 'obsolete'        // 废弃代码
  | 'other';

type DebtStatus =
  | 'acknowledged'    // 已确认，待处理
  | 'monitored'       // 监控中，暂不处理
  | 'scheduled'       // 已计划，将在特定版本处理
  | 'in-progress'     // 正在偿还
  | 'paid'            // 已偿还
  | 'discarded';      // 已丢弃 (不处理)

interface DebtEvidence {
  type: 'code' | 'metric' | 'screenshot' | 'error-log' | 'test-result';
  content: string;              // 代码片段、指标值、日志内容
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  capturedAt: string;            // ISO 日期
}

interface DebtRepayment {
  id: string;                    // 格式: PAY-YYYY-NNN
  debtId: string;                // 关联的债务 ID
  amount: number;                // 偿还工时 (小时)
  description: string;
  committedAt: string;
  completedAt?: string;
  commitHash?: string;
  status: 'committed' | 'partial' | 'completed';
}
```

### 3.2 利息机制

```typescript
// 利息计算规则
interface InterestPolicy {
  enabled: boolean;
  calculationPeriod: 'quarterly' | 'monthly';
  escalationRules: {
    fromSeverity: DebtCategory;
    quartersUntilEscalation: number;
    newSeverity: DebtCategory;
    blockMerge: boolean;        // 是否阻止合并
  }[];
  quarterlyInterestRate: Record<DebtCategory, number>;  // 各类型债务的季度利率
}

// 默认利息率 (可配置)
const DEFAULT_INTEREST_RATES: Record<DebtCategory, number> = {
  'critical': 15,    // 每季度 +15% 严重程度
  'major': 10,
  'minor': 5,
  'cosmetic': 2
};
```

### 3.3 自动化检测规则

**文件位置**: `.code-health/detection-rules.json`

```json
{
  "rules": [
    {
      "id": "no-explicit-any",
      "pattern": ": any",
      "severity": "minor",
      "category": "type-safety",
      "autoRegister": true,
      "dryRun": false
    },
    {
      "id": "circular-dependency",
      "tool": "depcheck",
      "severity": "major",
      "category": "architecture",
      "autoRegister": true
    },
    {
      "id": "large-file",
      "threshold": 500,
      "unit": "lines",
      "severity": "cosmetic",
      "category": "complexity",
      "autoRegister": true
    },
    {
      "id": "deep-nesting",
      "pattern": "if.*if.*if.*if",
      "severity": "minor",
      "category": "complexity",
      "autoRegister": false
    },
    {
      "id": "code-duplication",
      "tool": "tscpd",
      "threshold": 3,
      "severity": "major",
      "category": "duplication",
      "autoRegister": false
    },
    {
      "id": "unused-export",
      "tool": "tsc",
      "flags": ["--noUnusedLocals", "--noUnusedParameters"],
      "severity": "minor",
      "category": "complexity",
      "autoRegister": false
    },
    {
      "id": "event-string-literal",
      "pattern": "as never",
      "severity": "major",
      "category": "type-safety",
      "autoRegister": true
    },
    {
      "id": "magic-number",
      "pattern": "Math\\.pow|parseInt\\(.*,\\s*[89]",
      "severity": "minor",
      "category": "complexity",
      "autoRegister": false
    }
  ]
}
```

### 3.4 债务偿还工作流

```
PR 创建
    │
    ▼
┌─────────────────┐
│  CI: Pre-check  │
│  • 运行检测规则  │
│  • 收集证据      │
└────────┬────────┘
         │
         ▼
    发现新债务?
         │
    ┌────┴────┐
    │ 是       │ 否
    ▼         ▼
自动登记    继续
到 Registry   │
    │         │
    ▼         │
生成债务卡片  │
(TD-YYYY-NNN) │
    │         │
    ▼         ▼
    ┌─────────────────┐
    │  CI: Quality Gate │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                   │
    ▼                   ▼
债务利息 > BLOCK?      通过 ✓
    │                   │
    ▼                   ▼
BLOCK MERGE          PR Merged
(评论通知)              │
                       ▼
                 债务状态更新
                 (自动或手动)
```

---

## 4. 文档自动化系统

### 4.1 文档生成器配置

**文件位置**: `docs/.docgen.yaml`

```yaml
documentation:
  # API 文档
  apiDocs:
    enabled: true
    outputDir: docs/api
    includePatterns:
      - src/core/**/*.ts
      - src/features/**/services/*.ts
      - src/shared/utils/**/*.ts
    excludePatterns:
      - "*.test.ts"
      - "*.d.ts"
      - "**/index.ts"
    template: "typedoc"
    options:
      includeGroups: true
      excludePrivate: true
      excludeProtected: false
      linkToHome: true

  # 架构文档
  architectureDocs:
    enabled: true
    outputDir: docs/architecture
    diagrams:
      moduleGraph:
        enabled: true
        format: "mermaid"
        output: "module-dependencies.mmd"
      dataFlow:
        enabled: true
        format: "mermaid"
        output: "data-flow.mmd"
      componentTree:
        enabled: true
        format: "mermaid"
        output: "component-tree.mmd"
    sections:
      - id: "overview"
        title: "系统概览"
        source: "docs/architecture/overview.md"
      - id: "core"
        title: "核心模块"
        source: "docs/architecture/core.md"
      - id: "features"
        title: "功能模块"
        source: "docs/architecture/features.md"

  # 变更日志
  changelog:
    enabled: true
    outputFile: CHANGELOG.md
    types:
      - feat (新功能)
      - fix (错误修复)
      - refactor (重构)
      - perf (性能优化)
      - docs (文档)
      - test (测试)
      - chore (维护)
    includeScope: true
    format: "conventionalcommits"

  # 新人导览
  onboarding:
    enabled: true
    outputFile: docs/ONBOARDING.md
    sections:
      - id: "introduction"
        title: "项目介绍"
        autoGenerate: false
        source: "docs/onboarding/introduction.md"
      - id: "tech-stack"
        title: "技术栈"
        autoGenerate: true
        sources:
          - package.json
      - id: "setup"
        title: "本地开发"
        autoGenerate: false
        source: "docs/onboarding/setup.md"
      - id: "architecture"
        title: "架构概览"
        autoGenerate: true
        sources:
          - docs/architecture/module-dependencies.mmd
      - id: "modules"
        title: "核心模块"
        autoGenerate: true
        sources:
          - src/core/**/*.ts
      - id: "testing"
        title: "测试指南"
        autoGenerate: false
        source: "docs/onboarding/testing.md"
      - id: "deployment"
        title: "部署流程"
        autoGenerate: false
        source: "docs/onboarding/deployment.md"
```

### 4.2 架构决策记录 (ADR)

**目录结构**:
```
docs/adr/
├── README.md                    # ADR 索引
├── 0001-adopt-dependency-injection.md
├── 0002-unified-renderer-interface.md
├── 0003-event-system-refactor.md
└── ...
```

**ADR 模板**:
```markdown
# ADR-{ID}: {标题}

## 状态
✅ Accepted | 🔄 Proposed | ❌ Deprecated | ↩️ Superseded by ADR-{N}

## 背景
{问题描述和动机}

## 决策
{选择的方案}

### 备选方案
1. **{方案名称}**: {描述}
   - ✅ 优点: {列出}
   - ❌ 缺点: {列出}

2. **{方案名称}**: {描述}
   - ...

## 后果
### 正面
- {列出}

### 负面/风险
- {列出}

### 相关债务
- TD-YYYY-NNN: {关联债务}

## 相关文档
- {链接到其他文档}

## 审查记录
- {日期} - {审查结果和参与者}
```

---

## 5. 质量门禁系统

### 5.1 门禁检查项

```typescript
interface QualityGateConfig {
  enabled: boolean;
  blocking: boolean;           // 是否阻止合并
  checks: QualityCheck[];
}

interface QualityCheck {
  id: string;
  name: string;
  description: string;
  tool: string;                 // eslint, tsc, vitest, custom
  command: string;              // 实际执行的命令
  thresholds?: {
    error?: number;            // 允许的错误数
    warning?: number;          // 允许的警告数
    percentage?: number;        // 覆盖率等百分比
  };
  blocking: boolean;
  failOnWarning: boolean;
}
```

**默认检查配置**:

```yaml
qualityGates:
  - id: "typescript"
    name: "TypeScript 检查"
    tool: "tsc"
    command: "npx tsc --noEmit"
    blocking: true
    thresholds:
      error: 0

  - id: "eslint"
    name: "ESLint 检查"
    tool: "eslint"
    command: "npx eslint src --max-warnings=0"
    blocking: true
    thresholds:
      error: 0
      warning: 0

  - id: "test-coverage"
    name: "测试覆盖率"
    tool: "vitest"
    command: "npx vitest run --coverage"
    blocking: false
    thresholds:
      percentage: 80
      functions: 70
      branches: 60
      lines: 80

  - id: "no-new-any"
    name: "禁止新增 any"
    tool: "custom"
    command: "node scripts/check-new-any.js"
    blocking: true
    thresholds:
      error: 0

  - id: "debt-interest"
    name: "技术债务利息"
    tool: "custom"
    command: "node .code-health/scripts/check-debt-interest.js"
    blocking: true
    thresholds:
      criticalDebtCount: 0     # 关键债务必须为 0
      majorDebtInterestPct: 10 # 主要债务利息增长不超过 10%
```

### 5.2 CI 集成

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript check
        run: npx tsc --noEmit

      - name: Run ESLint
        run: npx eslint src --max-warnings=0

      - name: Check for new 'any' usage
        run: node scripts/check-new-any.js
        # 如果检测到新增 any，输出警告并可能阻止合并

      - name: Check technical debt interest
        run: node .code-health/cli.js debt-check
        # 检查债务利息是否超过阈值

      - name: Run tests with coverage
        run: npx vitest run --coverage
        if: always()

      - name: Generate documentation
        run: npm run docs:generate
        if: always()

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: quality-report
          path: |
            coverage/
            docs/

      - name: Comment PR with results
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            // 在 PR 下评论质量报告
```

---

## 6. CLI 工具

### 6.1 代码健康 CLI

**文件位置**: `.code-health/cli.js`

```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const debtManager = require('./commands/debt');
const docGenerator = require('./commands/docs');
const qualityGate = require('./commands/gate');
const dashboard = require('./commands/dashboard');

const program = new Command();

program
  .name('code-health')
  .description('代码健康治理 CLI')
  .version('1.0.0');

program
  .command('debt')
  .description('技术债务管理')
  .addCommand(debtManager.list())
  .addCommand(debtManager.add())
  .addCommand(debtManager.repay())
  .addCommand(debtManager.report());

program
  .command('docs')
  .description('文档生成')
  .addCommand(docGenerator.api())
  .addCommand(docGenerator.architecture())
  .addCommand(docGenerator.onboarding());

program
  .command('gate')
  .description('运行质量门禁')
  .option('--strict', '严格模式')
  .action(qualityGate.run());

program
  .command('dashboard')
  .description('生成健康仪表板')
  .option('--output <path>', '输出路径', './docs/health-dashboard.html')
  .action(dashboard.generate());

program.parse();
```

**主要命令**:

```bash
# 技术债务管理
code-health debt list                    # 列出所有债务
code-health debt add --title "..."       # 添加新债务
code-health debt repay TD-2026-001 --hours 4  # 登记偿还
code-health debt report                   # 生成债务报告

# 文档生成
code-health docs api                      # 生成 API 文档
code-health docs architecture             # 生成架构图
code-health docs onboarding               # 生成新人导览

# 质量门禁
code-health gate                          # 运行所有检查
code-health gate --strict                # 严格模式

# 仪表板
code-health dashboard                     # 生成健康仪表板 HTML
```

---

## 7. 实施计划

### 7.1 阶段划分

#### Phase 1: 基础设施 (Week 1-2)
- [ ] 创建 `.code-health/` 目录结构
- [ ] 实现 `DebtRegistry` 数据结构和 CLI
- [ ] 创建检测规则配置文件
- [ ] 集成 ESLint `no-explicit-any` 规则

#### Phase 2: 债务登记 (Week 2-3)
- [ ] 运行检测工具，生成初始债务列表
- [ ] 手动审查和分类现有债务
- [ ] 建立利息计算机制
- [ ] 创建债务看板/仪表板

#### Phase 3: 质量门禁 (Week 3-4)
- [ ] 实现 CI 质量门禁流程
- [ ] 配置 TypeScript 严格模式
- [ ] 实现 `check-new-any` 脚本
- [ ] 配置 PR 评论机器人

#### Phase 4: 文档自动化 (Week 4-6)
- [ ] 配置 TypeDoc
- [ ] 实现架构图生成 (Mermaid)
- [ ] 创建 ADR 目录和模板
- [ ] 实现新人导览生成器

#### Phase 5: 持续优化 (进行中)
- [ ] 定期运行债务检测
- [ ] 跟踪偿还进度
- [ ] 根据指标调整阈值
- [ ] 优化检测规则

### 7.2 初始债务登记

基于深度分析，以下是需要登记的初始债务：

| ID | 标题 | 严重程度 | 分类 | 预估工时 |
|----|------|---------|------|---------|
| TD-2026-001 | EventBus 允许类型擦除 | major | type-safety | 4h |
| TD-2026-002 | Gaussian 渲染器重复实现 | major | duplication | 16h |
| TD-2026-003 | Shader 代码重复 (random/luminance) | minor | duplication | 8h |
| TD-2026-004 | SettingsService 弱加密 | critical | security | 2h |
| TD-2026-005 | PipelineEngine 伪并行 | major | architecture | 8h |
| TD-2026-006 | ModelCacheService 未被使用 | minor | obsolete | 2h |
| TD-2026-007 | 大量魔法数字 | cosmetic | complexity | 12h |
| TD-2026-008 | 内存泄漏风险 (EventBus handlers) | minor | memory-leak | 6h |
| TD-2026-009 | Singleton 滥用 | major | architecture | 20h |
| TD-2026-010 | 文档覆盖率低 | minor | documentation | 8h |

---

## 8. 成功指标

### 8.1 量化目标

| 指标 | 当前基线 | 3个月目标 | 6个月目标 |
|------|---------|---------|---------|
| `any` 使用数量 | ~15 处 | < 5 处 | 0 处 |
| 关键债务数量 | N/A | < 3 | 0 |
| 技术债务利息 | N/A | < 50 pts | < 20 pts |
| 测试覆盖率 | ~40% | > 60% | > 80% |
| 文档覆盖率 | ~30% | > 70% | > 90% |
| 代码重复率 | ~8% | < 5% | < 3% |
| 循环依赖 | 0 | 0 | 0 |

### 8.2 健康仪表板

生成的仪表板应包含：

- **债务趋势图**: 按严重程度分布的债务数量随时间变化
- **模块健康评分**: 各模块的代码健康度雷达图
- **待办事项**: 即将到期的债务
- **最近偿还**: 最近登记的债务偿还记录
- **质量指标**: 覆盖率、复杂度、类型安全得分

---

## 9. 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 团队抗拒变更 | 高 | 渐进式引入，强调价值 |
| 检测规则误报 | 中 | 人工审查阶段，允许白名单 |
| CI 时间增加 | 中 | 并行化，缓存，优化阈值 |
| 债务登记不完整 | 中 | 多次扫描，鼓励主动报告 |
| 文档生成质量 | 低 | 模板化，定期审查 |

---

## 10. 相关文档

- [ADR-001: 采用依赖注入容器](./adr/0001-adopt-dependency-injection.md)
- [ADR-002: 统一渲染器接口](./adr/0002-unified-renderer-interface.md)
- [ADR-003: 事件系统重构](./adr/0003-event-system-refactor.md)
- [项目技术栈文档](../tech-stack.md)
- [开发指南](../development.md)

---

## 附录

### A. 文件结构

```
.code-health/
├── cli.js                      # CLI 入口
├── package.json
├── config/
│   ├── debt-registry.json     # 债务登记册
│   ├── detection-rules.json   # 检测规则
│   ├── interest-policy.json   # 利息政策
│   └── quality-gates.json     # 质量门禁配置
├── commands/
│   ├── debt.js
│   ├── docs.js
│   ├── gate.js
│   └── dashboard.js
├── scripts/
│   ├── check-new-any.js
│   ├── check-debt-interest.js
│   └── collect-evidence.js
└── templates/
    ├── adr-template.md
    └── debt-template.md

docs/
├── superpowers/
│   └── specs/
│       └── 2026-03-25-code-health-governance-design.md  # 本文
├── architecture/
│   ├── overview.md
│   ├── core.md
│   ├── features.md
│   ├── module-dependencies.mmd
│   └── data-flow.mmd
├── adr/
│   ├── README.md
│   └── 0001-adopt-dependency-injection.md
└── onboarding/
    ├── introduction.md
    ├── setup.md
    ├── testing.md
    └── deployment.md
```

### B. 参考资料

- [Technical Debt概念 (Ward Cunningham)](https://wardleypoets.org/tags/technical-debt)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Mermaid 图表语法](https://mermaid.js.org/)
- [TypeDoc](https://typedoc.org/)
