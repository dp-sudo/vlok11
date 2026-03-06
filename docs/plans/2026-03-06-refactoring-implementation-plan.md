# 重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 对 Immersa 3D Scene Viewer 项目进行渐进式模块化重构，提升代码质量。

**架构:** 分三个阶段进行重构：
- Phase 1: 基础设施统一 (修复 lint 冲突)
- Phase 2: 核心模块拆分 (AIService, SceneViewer, MotionService, InputService)
- Phase 3: 组件解耦 (ControlPanel)

**Tech Stack:** React 19, TypeScript (strict mode), Vite, Zustand

---

## Phase 1: 基础设施统一

### Task 1.1: 修复 Biome vs ESLint 配置冲突

**Files:**
- Modify: `biome.json` 或 `biome.jsonc` - 添加规则允许方括号访问
- Verify: 运行 `npm run lint` 和 `npm run biome:check`

**Step 1: 检查 biome 配置文件是否存在**

```bash
ls -la A:/3d/biome.json* 2>/dev/null || echo "Not found"
```

**Step 2: 创建/修改 biome 配置允许 import.meta.env 方括号访问**

如果 biome.json 存在，添加规则：
```json
{
  "linter": {
    "rules": {
      "complexity": {
        "useLiteralKeys": "off"
      }
    }
  }
}
```

**Step 3: 验证 lint 和 biome 都通过**

```bash
cd A:/3d && npm run lint && npm run biome:check
```

Expected: 两个命令都无错误

**Step 4: Commit**

```bash
cd A:/3d && git add biome.json* && git commit -m "fix: biome config to allow bracket access for env vars"
```

---

### Task 1.2: 修复 ESLint 警告 (3个)

**Files:**
- Modify: `src/features/ai/services/AIService.ts:95,103` - 使用 ??= 代替 ||=
- Modify: `src/features/upload/UploadPanel.tsx:451` - 修复无障碍问题

**Step 1: 检查 AIService.ts 中的警告**

```bash
cd A:/3d && npm run lint 2>&1 | grep -A2 "AIService.ts"
```

**Step 2: 修复 prefer-nullish-coalescing 警告**

```typescript
// 当前 (line 95, 103):
if (!this._geminiProvider) {
  this._geminiProvider = await getGeminiProvider();
}

// 修改为:
this._geminiProvider ??= await getGeminiProvider();
```

**Step 3: 修复 UploadPanel.tsx 警告**

检查 line 451 的 onClick/onKeyDown 问题，需要添加 role="button" 或改为 button 元素

**Step 4: 验证构建**

```bash
cd A:/3d && npm run lint
```

Expected: 0 warnings

**Step 5: Commit**

```bash
cd A:/3d && git add src/features/ai/services/AIService.ts src/features/upload/UploadPanel.tsx
git commit -m "fix: resolve ESLint warnings"
```

---

## Phase 2: 核心模块拆分

### Task 2.1: AIService 拆分 (543行 → 4个模块)

**目标:** 将 AIService.ts 拆分为专注的小模块

**Files:**
- Create: `src/features/ai/services/AIServiceCore.ts` - 核心接口和类型
- Create: `src/features/ai/services/AIServiceProvider.ts` - 提供者管理逻辑
- Create: `src/features/ai/services/AIServiceCache.ts` - 缓存管理
- Modify: `src/features/ai/services/AIService.ts` - 简化为协调层
- Modify: `src/features/ai/services/index.ts` - 更新导出

**Step 1: 分析 AIService.ts 的代码结构**

识别以下逻辑组：
- Lines 1-44: Provider 懒加载函数 (getTensorFlowProvider, getGeminiProvider)
- Lines 48-61: hashString 工具函数
- Lines 63-543: AIServiceImpl 类

**Step 2: 创建 AIServiceCore.ts**

提取核心接口和类型：
```typescript
// src/features/ai/services/AIServiceCore.ts
export interface AIServiceCore {
  analyzeScene(base64Image: string): Promise<ImageAnalysis>;
  estimateDepth(imageUrl: string): Promise<DepthResult>;
  // ...
}

export interface AIServiceConfig {
  provider: 'tensorflow' | 'gemini' | 'fallback';
  cacheEnabled: boolean;
  // ...
}
```

**Step 3: 创建 AIServiceProvider.ts**

提取 Provider 管理逻辑：
```typescript
// src/features/ai/services/AIServiceProvider.ts
export class AIServiceProviderManager {
  private tensorflowProvider: LazyProvider | null = null;
  private geminiProvider: LazyProvider | null = null;

  async getProvider(type: 'tensorflow' | 'gemini'): Promise<LazyProvider> { ... }
  async dispose(): Promise<void> { ... }
}
```

**Step 4: 创建 AIServiceCache.ts**

提取缓存逻辑：
```typescript
// src/features/ai/services/AIServiceCache.ts
export class AIServiceCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null { ... }
  set(key: string, value: T): void { ... }
  clear(): void { ... }
}
```

**Step 5: 简化 AIService.ts 为协调层**

```typescript
// src/features/ai/services/AIService.ts (简化后)
import { AIServiceCore } from './AIServiceCore';
import { AIServiceProviderManager } from './AIServiceProvider';
import { AIServiceCache } from './AIServiceCache';

export class AIServiceImpl implements AIServiceCore {
  private providerManager = new AIServiceProviderManager();
  private analysisCache = new AIServiceCache<ImageAnalysis>();
  private depthCache = new AIServiceCache<DepthResult>();

  async analyzeScene(base64Image: string): Promise<ImageAnalysis> {
    // 委托给缓存和提供者管理器
  }
  // ...
}
```

**Step 6: 验证构建**

```bash
cd A:/3d && npm run build 2>&1 | tail -20
```

Expected: Build successful

**Step 7: Commit**

```bash
cd A:/3d && git add src/features/ai/services/
git commit -m "refactor: split AIService into modular components"
```

---

### Task 2.2: SceneViewer 拆分 (197行 → 3个模块)

**目标:** 拆分 SceneViewer.tsx 为专注的子组件

**Files:**
- Create: `src/features/scene/components/Scene3DContent.tsx` - 3D 场景内容
- Create: `src/features/scene/components/SceneEffectsLayer.tsx` - 特效层
- Modify: `src/features/scene/SceneViewer.tsx` - 简化为容器组件
- Modify: `src/features/scene/index.ts` - 更新导出

**Step 1: 分析 SceneViewer.tsx 的逻辑组**

- Lines 81-98: useSceneStore 订阅, useColorGrade, useVideoControl hooks
- Lines 100-127: useImperativeHandle (ref 暴露方法)
- Lines 133-192: JSX 渲染 (Canvas, SceneContent, 特效等)

**Step 2: 创建 Scene3DContent.tsx**

```typescript
// src/features/scene/components/Scene3DContent.tsx
export const Scene3DContent = memo(({
  aspectRatio,
  backgroundUrl,
  depthUrl,
  imageUrl,
  sceneGroupRef,
  videoTextureRef,
  videoUrl
}: Scene3DContentProps) => {
  // 提取 SceneContent 相关逻辑
  return <SceneContent {...} />;
});
```

**Step 3: 创建 SceneEffectsLayer.tsx**

```typescript
// src/features/scene/components/SceneEffectsLayer.tsx
export const SceneEffectsLayer = memo(({
  enableVignette,
  renderStyle,
  config
}: EffectsLayerProps) => {
  // 提取 Vignette, Hologram 标签, ToneMapping 等特效
  return <>{/* 特效 JSX */}</>;
});
```

**Step 4: 简化 SceneViewer.tsx**

```typescript
// src/features/scene/SceneViewer.tsx (简化后)
export const SceneViewer = memo(forwardRef<SceneViewerHandle, SceneViewerProps>((props, ref) => {
  const config = useSceneStore((state) => state.config);
  // 只有 ref 绑定和状态订阅
  // 渲染 Scene3DContent 和 SceneEffectsLayer
}));
```

**Step 5: 验证构建**

```bash
cd A:/3d && npm run build
```

**Step 6: Commit**

```bash
cd A:/3d && git add src/features/scene/components/Scene3DContent.tsx src/features/scene/components/SceneEffectsLayer.tsx src/features/scene/SceneViewer.tsx
git commit -m "refactor: split SceneViewer into content and effects layers"
```

---

### Task 2.3: MotionService 拆分 (507行 → 3个模块)

**目标:** 拆分 MotionService.ts

**Files:**
- Create: `src/features/scene/services/camera/MotionTypes.ts` - 类型定义
- Create: `src/features/scene/services/camera/MotionCalculator.ts` - 运动计算逻辑
- Modify: `src/features/scene/services/camera/MotionService.ts` - 简化为服务协调层
- Modify: `src/features/scene/services/camera/index.ts` - 更新导出

**Step 1: 分析 MotionService.ts 结构**

识别：
- Lines 1-51: 常量和默认配置
- Lines 54-200+: calculate() 方法 (各种运动类型计算)
- Lines 200+: 状态管理、事件处理

**Step 2: 创建 MotionTypes.ts**

```typescript
// src/features/scene/services/camera/MotionTypes.ts
export type MotionType = 'STATIC' | 'ORBIT' | 'FLY_BY' | 'SPIRAL' | 'TRACKING' | 'DOLLY' | 'ARC';
export interface MotionParams { speed: number; scale: number; orbitRadius: number; ... }
export interface MotionResult { position: Vec3; target: Vec3; up: Vec3; fov: number; }
```

**Step 3: 创建 MotionCalculator.ts**

```typescript
// src/features/scene/services/camera/MotionCalculator.ts
export class MotionCalculator {
  calculateOrbit(time: number, params: MotionParams, base: CameraPose): MotionResult { ... }
  calculateFlyBy(time: number, params: MotionParams, base: CameraPose): MotionResult { ... }
  calculateSpiral(time: number, params: MotionParams, base: CameraPose): MotionResult { ... }
  // 其他运动类型...
}
```

**Step 4: 简化 MotionService.ts**

```typescript
// src/features/scene/services/camera/MotionService.ts (简化后)
import { MotionCalculator } from './MotionCalculator';

class MotionServiceImpl {
  private calculator = new MotionCalculator();

  calculate(time: number, basePose?: CameraPose): MotionResult | null {
    if (!this.state.isActive) return null;
    return this.calculator.calculate(this.state.type, time, this.params, basePose);
  }
}
```

**Step 5: 验证构建**

```bash
cd A:/3d && npm run build
```

**Step 6: Commit**

```bash
cd A:/3d && git add src/features/scene/services/camera/
git commit -m "refactor: extract MotionCalculator from MotionService"
```

---

### Task 2.4: InputService 拆分 (493行 → 2个模块)

**目标:** 拆分 InputService.ts

**Files:**
- Create: `src/features/scene/services/camera/InputHandler.ts` - 事件处理逻辑
- Create: `src/features/scene/services/camera/InputState.ts` - 状态管理
- Modify: `src/features/scene/services/camera/InputService.ts` - 简化为接口层

**Step 1: 分析 InputService.ts 结构**

- Lines 1-32: 常量和类型
- Lines 34-68: 构造函数和 bind
- Lines 98-200+: handleMouseDown/Move/Up, handleTouchStart/Move/End 等事件处理
- Lines 300+: 状态管理和回调

**Step 2: 创建 InputHandler.ts**

```typescript
// src/features/scene/services/camera/InputHandler.ts
export class InputHandler {
  private element: HTMLElement | null = null;

  bindToElement(element: HTMLElement): void { ... }
  handleMouseDown(e: MouseEvent): void { ... }
  handleTouchStart(e: TouchEvent): void { ... }
  // 其他事件处理...
}
```

**Step 3: 创建 InputState.ts**

```typescript
// src/features/scene/services/camera/InputState.ts
export interface InputState {
  isInteracting: boolean;
  type: InteractionType;
  startPosition: Point2D | null;
  // ...
}

export class InputStateManager {
  private state: InputState = { ... };
  getState(): InputState { return this.state; }
  updateState(partial: Partial<InputState>): void { ... }
}
```

**Step 4: 简化 InputService.ts**

```typescript
// src/features/scene/services/camera/InputService.ts (简化后)
import { InputHandler } from './InputHandler';
import { InputStateManager } from './InputState';

class InputServiceImpl {
  private handler = new InputHandler();
  private stateManager = new InputStateManager();
  // 委托给 handler 和 stateManager
}
```

**Step 5: 验证构建**

```bash
cd A:/3d && npm run build
```

**Step 6: Commit**

```bash
cd A:/3d && git add src/features/scene/services/camera/
git commit -m "refactor: extract InputHandler and InputState from InputService"
```

---

## Phase 3: 组件解耦

### Task 3.1: ControlPanel 重构 - 使用 Compound Components 模式

**目标:** 将 ControlPanel.tsx 重构为复合组件模式

**Files:**
- Create: `src/features/controls/compound/ControlPanelCompound.tsx` - 复合组件
- Modify: `src/features/controls/ControlPanel.tsx` - 使用复合组件
- Modify: `src/features/controls/index.ts` - 更新导出

**Step 1: 分析 ControlPanel.tsx**

识别渲染部分：
- Header 部分
- Tab 切换部分
- SceneTab, CameraTab, EffectsTab, ImmersiveTab, AITab 内容

**Step 2: 创建复合组件结构**

```typescript
// src/features/controls/compound/ControlPanelCompound.tsx
interface ControlPanelContextValue {
  config: SceneConfig;
  setConfig: (config: Partial<SceneConfig>) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}

const ControlPanelContext = createContext<ControlPanelContextValue | null>(null);

export const ControlPanel = ({ children, ...props }) => {
  // 共享状态管理
  return <ControlPanelContext.Provider value={...}>{children}</ControlPanelContext.Provider>;
};

ControlPanel.Header = () => { /* 使用 context */ };
ControlPanel.Tabs = () => { /* 使用 context */ };
ControlPanel.SceneSection = () => { /* 使用 context */ };
ControlPanel.CameraSection = () => { /* 使用 context */ };
ControlPanel.EffectsSection = () => { /* 使用 context */ };
```

**Step 3: 重写 ControlPanel.tsx 使用复合组件**

```typescript
// src/features/controls/ControlPanel.tsx (简化后)
import { ControlPanel } from './compound/ControlPanelCompound';

export const ControlPanel = (props) => (
  <ControlPanelCompound>
    <ControlPanel.Header />
    <ControlPanel.Tabs />
    <ControlPanel.SceneSection />
    <ControlPanel.CameraSection />
    <ControlPanel.EffectsSection />
  </ControlPanelCompound>
);
```

**Step 4: 验证构建**

```bash
cd A:/3d && npm run build
```

**Step 5: Commit**

```bash
cd A:/3d && git add src/features/controls/
git commit -m "refactor: convert ControlPanel to compound components pattern"
```

---

### Task 3.2: 提取通用 Hooks

**目标:** 消除 Tab 组件中的重复逻辑

**Files:**
- Create: `src/features/controls/hooks/useExpandedSections.ts` - 展开/折叠状态
- Create: `src/features/controls/hooks/useSectionToggle.ts` - 节切换逻辑
- Modify: `src/features/controls/parts/SceneTab.tsx` - 使用 hooks
- Modify: `src/features/controls/CameraTab.tsx` - 使用 hooks
- Modify: `src/features/controls/EffectsTab.tsx` - 使用 hooks

**Step 1: 创建 useExpandedSections.ts**

```typescript
// src/features/controls/hooks/useExpandedSections.ts
export function useExpandedSections(
  initialSections: Record<string, boolean>
): {
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
} {
  const [expandedSections, setExpandedSections] = useState(initialSections);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { expandedSections, toggleSection, setExpandedSections };
}
```

**Step 2: 创建 useSectionToggle.ts**

```typescript
// src/features/controls/hooks/useSectionToggle.ts
export function useSectionToggle(
  sectionKey: string,
  expandedSections: Record<string, boolean>,
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) {
  const isExpanded = expandedSections[sectionKey];

  const toggle = useCallback(() => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }, [sectionKey, setExpandedSections]);

  return { isExpanded, toggle };
}
```

**Step 3: 重构 Tab 组件使用 hooks**

在 SceneTab.tsx, CameraTab.tsx, EffectsTab.tsx 中：
```typescript
// 之前:
const [expandedSections, setExpandedSections] = useState({...});
const toggleSection = useCallback((key) => {
  setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
}, []);

// 之后:
const { expandedSections, toggleSection } = useExpandedSections(INITIAL_SECTIONS);
const { isExpanded: isProjectionExpanded } = useSectionToggle('projection', expandedSections, setExpandedSections);
```

**Step 4: 验证构建**

```bash
cd A:/3d && npm run build
```

**Step 5: Commit**

```bash
cd A:/3d && git add src/features/controls/hooks/ src/features/controls/parts/
git commit -m "refactor: extract useExpandedSections and useSectionToggle hooks"
```

---

### Task 3.3: 清理 index.ts 导出

**目标:** 统一模块导出模式

**Files:**
- Modify: `src/features/ai/services/index.ts` - 统一导出
- Modify: `src/features/scene/services/camera/index.ts` - 统一导出
- Modify: `src/features/controls/index.ts` - 统一导出
- Modify: `src/features/scene/index.ts` - 统一导出

**Step 1: 审计所有 index.ts 文件**

```bash
cd A:/3d && find src -name "index.ts" -exec wc -l {} \;
```

**Step 2: 标准化导出模式**

每个 index.ts 应该：
- 只导出公开 API
- 使用 `export type { }` 区分类型
- 移除不必要的重新导出

示例：
```typescript
// src/features/ai/services/index.ts (标准化后)
export type { AIService } from './AIService';
export { AIServiceImpl } from './AIService';
export type { AIServiceCore } from './AIServiceCore';
// 移除重复导出
```

**Step 3: 验证构建**

```bash
cd A:/3d && npm run build
```

**Step 4: Commit**

```bash
cd A:/3d && git add src/
git commit -m "refactor: standardize index.ts exports"
```

---

## 验证步骤 (每个 Phase 后执行)

**Step 1: 运行 TypeScript 类型检查**

```bash
cd A:/3d && npx tsc --noEmit
```

**Step 2: 运行 lint**

```bash
cd A:/3d && npm run lint
```

**Step 3: 运行 biome check**

```bash
cd A:/3d && npm run biome:check
```

**Step 4: 运行构建**

```bash
cd A:/3d && npm run build
```

Expected: 所有步骤都无错误

---

## 总结

| Phase | Tasks | 预期文件改动 |
|-------|-------|-------------|
| Phase 1 | 1.1, 1.2 | 2-4 files |
| Phase 2 | 2.1, 2.2, 2.3, 2.4 | 12-16 files |
| Phase 3 | 3.1, 3.2, 3.3 | 10-15 files |
| **Total** | **11 Tasks** | **~30 files** |

**预期收益:**
- 最大文件行数: 543 → <300 (-45%)
- 构建/Lint 警告: 3 → 0
- 模块化指数: 中 → 高
