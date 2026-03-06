# AGENTS.md - Agent Development Guidelines

## Project Overview

**Project Name:** Immersa 3D Scene Viewer  
**Type:** AI-powered 2D to 3D scene reconstruction using React Three Fiber and TensorFlow.js  
**Tech Stack:** React 19, TypeScript, Vite, Three.js, TensorFlow.js, TailwindCSS v4

---

## Build Commands

### Development

```bash
npm run dev          # Start Vite dev server
npm run preview      # Preview production build
```

### Building

```bash
npm run build        # Type check + Vite build (tsc --noEmit && vite build)
npm run verify       # Full verification: lint:strict + build
```

### Linting & Formatting

```bash
npm run lint                    # ESLint with max-warnings 0
npm run lint:fix                # ESLint with auto-fix
npm run lint:strict             # ESLint + TypeScript strict check

npm run format                  # Prettier write all files
npm run format:check            # Prettier check only

npm run biome:check             # Biome lint check
npm run biome:fix              # Biome auto-fix
npm run biome:organize         # Biome organize imports
npm run biome:lint             # Biome lint only
npm run biome:format           # Biome format only
```

### Utility

```bash
npm run clean           # Remove dist and node_modules/.vite
npm run deps:update     # Update dependencies
npm run deploy          # Build + Cloudflare Pages deploy
npm run deploy:preview  # Build + preview branch deploy
```

### Testing (if applicable)

```bash
# Run Playwright tests (if configured)
npx playwright test
npx playwright test --ui
npx playwright test --grep "test-name"
```

---

## Code Style Guidelines

### TypeScript Configuration

- **Target:** ES2022
- **Strict Mode:** ENABLED (strict, noImplicitAny, strictNullChecks, etc.)
- **Module Resolution:** bundler
- **Path Aliases:**
  - `@/*` → `./`
  - `@/src/*` → `src/*`
  - `@/app` → `src/app`
  - `@/core/*` → `src/core/*`
  - `@/features/*` → `src/features/*`
  - `@/shared/*` → `src/shared/*`
  - `@/stores` → `src/stores`
  - `@/stores/*` → `src/stores/*`

### ESLint Rules (Strict)

#### TypeScript Rules

- ❌ NO `any` type allowed (`@typescript-eslint/no-explicit-any: error`)
- ❌ NO unused variables (prefix with `_` to ignore: `_unusedVar`)
- ❌ NO floating promises (`no-floating-promises: error`)
- ❌ NO misuse of promises (`no-misused-promises: error`)
- ✅ Use `type` imports exclusively (`consistent-type-imports: error`)
- ✅ Use `nullish coalescing` where possible
- ✅ Use `optional chaining` where possible
- ❌ NO `as any`, `@ts-ignore` allowed
- ❌ NO `!` non-null assertion (unless explicitly allowed)
- ✅ Use `as const` where applicable

#### Naming Conventions

- **Interfaces:** PascalCase (NOT prefixed with `I`)
- **Types:** PascalCase
- **Enums:** PascalCase, members UPPER_CASE
- **Classes:** PascalCase
- **Variables/Functions:** camelCase
- **Constants:** UPPER_CASE or PascalCase

#### React Rules

- ✅ Use functional components with hooks
- ✅ Use `children` prop pattern correctly
- ✅ No array index as key (`no-array-index-key`)
- ✅ Use proper fragment syntax
- ✅ Accessibility: alt-text, aria-\* attributes

#### Import Rules

- ✅ First import: external libraries
- ✅ Second import: internal modules (`@/...`)
- ✅ Third import: relative imports
- ✅ NO duplicate imports
- ✅ NO self-imports
- ✅ Newline after import block

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "auto"
}
```

### Biome Configuration

- **Indent:** 2 spaces
- **Line Width:** 100 characters
- **Quotes:** Single quotes (JS), Double quotes (JSX)
- **Line Endings:** CRLF
- **Linting:** Enabled with recommended rules
- **Organize Imports:** Enabled

### CSS/Styling

- Use **TailwindCSS v4** with PostCSS
- Use `clsx` and `tailwind-merge` for conditional classes
- Follow Tailwind's utility-first approach

---

## Code Examples

### ✅ Correct Import Order

```typescript
// 1. External libraries (first)
import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 2. Internal modules (second) - 使用 path aliases
import { useSceneStore } from '@/stores';
import { formatDepthMap } from '@/shared/utils';
import type { DepthMap, SceneConfig } from '@/shared/types';

// 3. Relative imports (third)
import { CameraControls } from './CameraControls';
import styles from './SceneViewer.module.css';

// 空行
import { useEffect } from 'react';
```

### ❌ Incorrect Imports

```typescript
// 错误：直接导入子模块
import { clamp } from '@/shared/utils/math/clamp';

// 正确：从 barrel exports 导入
import { clamp, lerp } from '@/shared/utils/math';

// 错误：使用相对路径导入内部模块
import { useSceneStore } from '../../stores';

// 正确：使用 path alias
import { useSceneStore } from '@/stores';
```

### ✅ Type-Only Imports

```typescript
// 正确：type imports
import type { FC, PropsWithChildren } from 'react';
import type { Vector3 } from 'three';

// 正确：inline type imports（推荐）
import { useState, type StateSet } from 'react';

// 错误：不要混用
// import { useState, type SomeType } from 'react'; // ❌
```

### ✅ React Component Pattern

```typescript
import { useCallback, useMemo, useState, type FC, type PropsWithChildren } from 'react';

interface ButtonProps {
  /** Button text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional variant */
  variant?: 'primary' | 'secondary';
}

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
  label,
  onClick,
  variant = 'primary',
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoading(true);
    onClick();
  }, [onClick]);

  const className = useMemo(
    () => clsx('btn', `btn-${variant}`, { 'btn-loading': isLoading }),
    [variant, isLoading]
  );

  return (
    <button className={className} onClick={handleClick} type="button">
      {isLoading ? <Spinner /> : children ?? label}
    </button>
  );
};
```

### ✅ Zustand Store Pattern

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SceneState {
  // State
  depthMap: Float32Array | null;
  isProcessing: boolean;
  config: SceneConfig;

  // Actions
  setDepthMap: (map: Float32Array | null) => void;
  setProcessing: (processing: boolean) => void;
  updateConfig: (config: Partial<SceneConfig>) => void;
  reset: () => void;
}

const initialState = {
  depthMap: null,
  isProcessing: false,
  config: {
    depth: 10,
    segmentation: true,
  } satisfies SceneConfig,
};

export const useSceneStore = create<SceneState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setDepthMap: (map) => set({ depthMap: map }),

        setProcessing: (processing) => set({ isProcessing: processing }),

        updateConfig: (config) =>
          set((state) => ({
            config: { ...state.config, ...config },
          })),

        reset: () => set(initialState),
      }),
      { name: 'scene-store' }
    ),
    { name: 'SceneStore' }
  )
);
```

### ✅ Nullish Coalescing & Optional Chaining

```typescript
// 正确：使用 nullish coalescing
const value = user?.settings?.theme ?? 'dark';
const count = items?.length ?? 0;

// 正确：可选链 + 非空断言（确定有值时）
const name = user?.profile?.name; // string | undefined
const id = user!.id; // 确定 user 存在（慎用）

// 错误：不要用 || 代替 ??
const value = user?.settings?.theme || 'dark'; // ❌ 如果 theme 是空字符串会出错
```

### ✅ Async Error Handling

```typescript
// 正确：async/await + try/catch
async function loadModel(): Promise<Model> {
  try {
    const model = await tf.loadLayersModel('/model.json');
    return model;
  } catch (error) {
    console.error('Failed to load model:', error);
    throw new Error('Model loading failed');
  }
}

// 正确：Promise + .catch()
loadModel().catch((error) => {
  console.error('Failed to load model:', error);
});

// 错误：不要忽略 async 错误
async function badExample() {
  doSomethingAsync(); // ❌ 没有处理 Promise rejection
}
```

### ✅ TailwindCSS v4 Class Names

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 正确：使用 twMerge 合并类名
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ className, children }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};
```

### ✅ React Three Fiber Component

```typescript
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useCallback, type FC } from 'react';
import type { Mesh, Group } from 'three';

interface SceneObjectProps {
  position: [number, number, number];
  onClick?: () => void;
}

export const SceneObject: FC<SceneObjectProps> = ({ position, onClick }) => {
  const meshRef = useRef<Mesh>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const handleClick = useCallback((event) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};
```

---

## Barrel Exports (Import Restrictions)

**必须使用 barrel exports，禁止直接导入子模块：**

| 禁止的导入方式                                           | 正确的导入方式                                 |
| -------------------------------------------------------- | ---------------------------------------------- |
| `import { clamp } from '@/shared/utils/math/clamp'`      | `import { clamp } from '@/shared/utils/math'`  |
| `import { useAudio } from '@/shared/hooks/useAudio'`     | `import { useAudio } from '@/shared/hooks'`    |
| `import { Button } from '@/shared/components/ui/Button'` | `import { Button } from '@/shared/components'` |

**每个目录必须有 `index.ts` 导出所有公共 API：**

```typescript
// src/shared/utils/math/index.ts
export { clamp } from './clamp';
export { lerp } from './lerp';
export { mapRange } from './mapRange';
// ... 其他工具函数
```

---

## Error Handling

- Always handle async errors with try-catch or `.catch()`
- Use error boundaries for React components
- Log errors appropriately (no console.log in production)
- Provide user-friendly error messages
- Use Sentry for error tracking (already configured)

---

## State Management

- Use **Zustand** for global state management
- Follow the stores directory structure: `src/stores/`
- Use TypeScript for all store definitions
- Use `devtools` middleware in development
- Use `persist` middleware for persistence

---

## 3D/Graphics

- Use **React Three Fiber** (@react-three/fiber) for 3D rendering
- Use **@react-three/drei** for helpers (OrbitControls, Environment, etc.)
- Follow performance best practices for Three.js:
  - Use `useFrame` for animations
  - Memoize expensive computations
  - Dispose geometries/materials properly
  - Use `useMemo` for geometries and materials
  - Avoid creating objects inside render loop

---

## AI/ML Integration

- TensorFlow.js models: `@tensorflow/tfjs`, `@tensorflow-models/depth-estimation`
- Google GenAI: `@google/generateai`
- MediaPipe: `@mediapipe/face_detection`

---

## File Organization

```
src/
├── app/              # Main app components
├── core/             # Core utilities and configs
├── features/         # Feature-based modules
│   ├── ai/           # AI services
│   └── depthEditor/  # Depth editor feature
├── shared/           # Shared components, utils, constants
│   ├── components/   # Reusable UI components
│   ├── constants/    # App constants
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Utility functions
│   │   ├── core/
│   │   ├── math/
│   │   ├── media/
│   │   ├── coordinates/
│   │   └── presets/
│   └── types/        # TypeScript type definitions
├── stores/           # Zustand stores
└── index.tsx        # App entry point
```

---

## Important Notes

1. **NEVER use `as any`** - Type properly or fix the type error
2. **NEVER use `@ts-ignore`** - Use proper types or `// @ts-expect-error` with description
3. **ALWAYS run `npm run lint:strict`** before committing
4. **ALWAYS verify** with `npm run verify` before deployment
5. **Import path restrictions** - Must use barrel exports from `@/shared/utils`, `@/shared/utils/core`, etc.
6. **Strict TypeScript** - All strict flags enabled, no exceptions
7. **Unused variables** - Prefix with `_` if intentionally unused
8. **Console.log** - Only use in development, remove before commit

---

## Cloudflare Pages Deployment

- Build output: `dist/`
- Command: `wrangler pages deploy dist`
- Project name: `immersa-3d`

---

## Common Patterns

### Conditional Rendering

```typescript
// 正确：使用 && 渲染（但注意 0 会被渲染）
{isLoading && <Spinner />}

// 正确：使用三元运算符
{isLoading ? <Spinner /> : <Content />}

// 正确：使用 || 备用值（针对字符串）
<div>{title || 'Default Title'}</div>
```

### Event Handlers

```typescript
// 正确：useCallback 包装事件处理函数
const handleSubmit = useCallback((data: FormData) => {
  submit(data);
}, [submit]);

// 正确：内联事件处理（简单场景）
<button onClick={() => setCount(c => c + 1)}>+</button>
```

### State Updates

```typescript
// 正确：函数式更新（依赖上一状态时）
setCount((prev) => prev + 1);

// 正确：批量更新
setState((prev) => ({
  ...prev,
  value: newValue,
}));
```
