# AGENTS.md - Oh My OpenCode 智能体配置

> 项目: Immersa 3D - AI-powered 2D to 3D Scene Reconstruction

## 智能体体系结构

本项目采用分层智能体架构，由以下核心智能体组成：

---

## 1. Sisyphus (主要协调者)

**角色**: 项目主管协调者
**职责**:

- 接收用户请求并分析意图
- 决定是否委托给专业智能体
- 维护任务清单和进度追踪
- 验证工作成果
- 与用户直接沟通

**触发条件**: 所有用户请求
**委派策略**:

- UI/前端任务 → Visual Engineering
- 复杂逻辑/架构 → Oracle / Deep
- 简单修改 → Quick
- 代码审查 → Code Reviewer
- 文档编写 → Writer

---

## 2. Oracle (架构顾问)

**角色**: 只读高阶顾问
**职责**:

- 复杂架构设计审查
- 难以调试问题的诊断
- 不熟悉的代码模式解释
- 性能/安全/多系统权衡建议

**触发条件**:

- 架构决策
- 2+ 次修复失败
- 不熟悉的模式
- 安全/性能问题

**工作模式**: 咨询优先，只读不执行

---

## 3. Librarian (资料管理员)

**角色**: 外部资源搜索专家
**职责**:

- 查找官方文档 (TensorFlow.js, Three.js)
- 搜索开源实现示例
- 获取最新库/框架信息
- Context7 API 文档查询

**专长领域**:

- TensorFlow.js 深度估计
- React Three Fiber 3D 渲染
- Google Gemini AI API
- MediaPipe 人脸检测

**触发条件**: 涉及外部库/框架的问题

---

## 4. Explore (代码探索者)

**角色**: 代码库理解专家
**职责**:

- 查找现有代码模式
- 定位特定功能实现
- 理解模块依赖关系
- 发现项目约定

**工作方式**: 并行搜索，快速响应
**使用场景**:

- 查找类似组件实现
- 理解现有工具函数
- 定位配置文件位置
- 发现测试模式

---

## 5. Visual Engineering (前端专家)

**角色**: UI/UX 实现专家
**职责**:

- React 组件开发
- Tailwind CSS 样式
- 响应式设计
- 动画和交互
- 性能优化

**技能栈**:

- React 19 + TypeScript
- Tailwind CSS v4
- React Three Fiber
- Zustand 状态管理

**委派条件**: 任何 UI 相关任务

---

## 6. Code Reviewer (代码审查员)

**角色**: 质量守门员
**职责**:

- 代码质量和安全审查
- 最佳实践验证
- 类型安全确认
- 性能问题识别

**审查标准**:

- 无 `any` 类型
- 无 `@ts-ignore`
- 无空 catch 块
- 符合项目 ESLint 规则

**触发时机**: 重要代码修改后

---

## 7. Deep (深度研究员)

**角色**: 复杂问题解决者
**职责**:

- 深入研究复杂问题
- 多角度分析
- 非常规解决方案
- 全面理解后再行动

**适用场景**:

- hairy 问题需要深度理解
- 多系统交互问题
- 性能瓶颈诊断

---

## 8. Quick (快速执行者)

**角色**: 简单任务执行者
**职责**:

- 单行修复
- 简单重构
- 格式调整
- 注释添加

**使用限制**: 仅限明确、简单的任务

---

## 委派决策矩阵

| 任务类型    | 主要智能体         | 辅助智能体    | 优先级 |
| ----------- | ------------------ | ------------- | ------ |
| UI 组件开发 | Visual Engineering | Code Reviewer | 高     |
| 3D 渲染功能 | Visual Engineering | Librarian     | 高     |
| AI/ML 集成  | Deep               | Librarian     | 高     |
| 架构设计    | Oracle             | Deep          | 中     |
| Bug 修复    | Quick/Deep         | Code Reviewer | 高     |
| 代码审查    | Code Reviewer      | -             | 中     |
| 文档编写    | Writer             | -             | 低     |
| 依赖更新    | Quick              | Librarian     | 中     |
| 性能优化    | Oracle             | Deep          | 中     |
| 安全问题    | Oracle             | Code Reviewer | 高     |

---

## 工作流约定

### 任务启动

1. Sisyphus 创建详细 TODO 列表
2. 标记当前任务为 `in_progress`
3. 一次只执行一个任务

### 任务完成

1. 立即标记为 `completed`
2. 运行 LSP 诊断验证
3. 如有构建/测试命令则执行
4. 提交成果给用户

### 失败恢复

1. 修复根本原因，非症状
2. 3 次失败后停止并咨询 Oracle
3. 不回退到已知工作状态的代码

---

## 项目特定约定

### 代码风格

- TypeScript 严格模式启用
- 单引号优先
- 2 空格缩进
- 无尾随分号（Prettier 配置）

### 导入规则

- 使用路径别名 `@/src/*`
- 类型导入使用 `type` 关键字
- 禁止从子目录直接导入（需通过 index）

### 提交规范

- 原子提交
- 清晰的提交消息
- 不提交 secrets（.env, API keys）

---

## 配置文件映射

```
.opencode/
├── oh-my-opencode.json     # 主配置 (已创建)
└── AGENTS.md               # 本文档

.claude/
└── settings.local.json     # Claude 权限配置 (已存在)

项目根目录/
├── package.json            # 依赖和脚本
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
├── eslint.config.js        # ESLint 配置
├── .prettierrc             # Prettier 配置
├── postcss.config.js       # PostCSS 配置
├── .env.example            # 环境变量模板
└── .gitignore              # Git 忽略规则
```

---

## 更新日志

- **2026-02-01**: 初始创建 AGENTS.md
  - 定义了 8 个核心智能体
  - 建立了委派决策矩阵
  - 记录了项目特定约定
