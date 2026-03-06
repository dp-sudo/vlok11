# 重构优化设计方案

**项目**: Immersa 3D Scene Viewer
**日期**: 2026-03-06
**目标**: 代码质量优先 - 渐进式模块化重构

---

## 1. 重构背景

当前项目存在以下代码质量问题：

| 问题 | 位置 | 严重程度 |
|------|------|----------|
| 超大文件 (>500行) | AIService.ts (543行), MotionService.ts (507行), InputService.ts (493行) | 🔴 高 |
| 混合职责 | SceneViewer.tsx (197行) - Canvas + 3D场景 + 特效 | 🔴 高 |
| 紧耦合 | ControlPanel.tsx 直接依赖 10+ 个子组件 | 🟡 中 |
| 代码重复 | Tab 组件有相似展开/折叠逻辑 | 🟡 中 |
| Lint 冲突 | biome vs ESLint 方括号 vs 点号 | 🟢 低 |

**代码统计**:
- 总文件数: 219 个
- 源代码大小: 1.6MB
- 平均文件行数: ~80 行
- 最大文件: 543 行

---

## 2. 重构策略

采用**渐进式模块化重构**，分三个阶段：

```
Phase 1 (基础设施) → Phase 2 (核心拆分) → Phase 3 (组件解耦)
     ↓                    ↓                    ↓
   统一规范              拆分大文件            解耦组件
```

---

## 3. 详细方案

### Phase 1: 基础设施统一

**目标**: 统一代码风格，修复 lint 冲突

#### 1.1 修复 Biome vs ESLint 冲突

问题: TypeScript strict 模式要求 `import.meta.env['VITE_XXX']` 方括号访问，但 biome 要求点号访问。

解决方案:
- 保持 tsconfig.json 的 `noPropertyAccessFromIndexSignature: true`
- 使用显式类型声明避免 biome 警告
- 调整 biome 配置允许方括号访问

#### 1.2 清理代码

- 移除未使用的 imports
- 修复 ESLint 警告 (3个)

---

### Phase 2: 核心模块拆分

**目标**: 拆分超大文件，将 >400 行的文件重构为多个专注的小模块

#### 2.1 AIService 拆分 (543行 → 4个模块)

```
当前: AIService.ts
重构:
├── AIServiceCore.ts      (150行) - 核心接口和类型
├── AIServiceProvider.ts   (180行) - 提供者管理逻辑
├── AIServicePipeline.ts  (120行) - 处理管道
└── AIServiceConfig.ts    (93行)  - 配置管理
```

#### 2.2 SceneViewer 拆分 (197行 → 3个模块)

```
当前: SceneViewer.tsx
重构:
├── SceneCanvas.tsx       (Canvas 管理 - 已存在)
├── Scene3DContent.tsx    (3D 场景内容)
└── SceneEffectsLayer.tsx (特效层)
```

#### 2.3 MotionService 拆分 (507行 → 3个模块)

```
当前: MotionService.ts
重构:
├── MotionCore.ts         (核心运动逻辑)
├── MotionPresets.ts     (预设动画)
└── MotionScheduler.ts   (调度器 - 已存在)
```

#### 2.4 InputService 拆分 (493行 → 2个模块)

```
当前: InputService.ts
重构:
├── InputHandler.ts      (输入处理)
└── InputConfig.ts       (配置)
```

---

### Phase 3: 组件解耦

**目标**: 减少组件间直接依赖，提高可测试性

#### 3.1 ControlPanel 重构

使用 Compound Components 模式：

```tsx
// 当前: 直接导入所有子组件
import { SceneTab, CameraTab, EffectsTab, ... } from './parts';

// 重构后: 使用复合组件
<ControlPanel>
  <ControlPanel.Tabs />
  <ControlPanel.SceneSection />
  <ControlPanel.CameraSection />
  <ControlPanel.EffectsSection />
</ControlPanel>
```

#### 3.2 提取通用 Hook

- `useExpandedSections` - 展开/折叠状态管理
- `useSectionToggle` - 节切换逻辑
- `useControlConfig` - 配置更新模式

#### 3.3 清理 index.ts 导出

统一每个模块的导出模式：
- 只导出公开 API
- 使用类型导出区分类型和值
- 移除不必要的重新导出

---

## 4. 预期收益

| 指标 | 当前 | 目标 | 改善 |
|------|------|------|------|
| 最大文件行数 | 543 | <300 | -45% |
| 平均文件行数 | ~80 | ~100 | +25% |
| 构建警告 | 3 | 0 | -100% |
| Lint 警告 | 3 | 0 | -100% |
| 模块化指数 | 中 | 高 | 提升 |

---

## 5. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 重构破坏现有功能 | 每次修改后运行构建验证 |
| 大量文件改动 | 分阶段提交，每阶段可工作 |
| 回归测试困难 | 保留端到端测试覆盖 |

---

## 6. 实施顺序

1. Phase 1: 基础设施统一 (修复 lint 冲突)
2. Phase 2.1: AIService 拆分
3. Phase 2.2: SceneViewer 拆分
4. Phase 2.3: MotionService 拆分
5. Phase 2.4: InputService 拆分
6. Phase 3.1: ControlPanel 重构
7. Phase 3.2: 提取通用 Hooks
8. Phase 3.3: 清理 index.ts 导出
