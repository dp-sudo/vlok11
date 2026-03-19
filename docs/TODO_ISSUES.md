# 项目问题追踪清单

> 生成时间: 2026-03-19
> 更新: 2026-03-19
> 基于: docs/ISSUE_REPORT.md

---

## 🔴 第一优先级 - 必须立即修复

### P1: render - loadFromPLY 缺少错误处理 ✅ 已修复
- **文件**: `src/features/render/GaussianSplattingRenderer.ts`
- **修复内容**: 添加完整的try-catch、response.ok检查、内容类型验证、顶点数量验证

### P2: upload - __TEST_MODE__ hack ✅ 已修复
- **文件**: `src/features/upload/pipeline/stages/DepthStage.ts`
- **修复内容**: 移除 `window.__TEST_MODE__` hack 代码

### P3: utils - math/common.ts 常量顺序错误 ✅ 已修复
- **文件**: `src/shared/utils/math/common.ts`
- **修复内容**: 将常量定义移到使用之前

### P4: sharedStore - Pipeline 资源泄漏 ✅ 已修复
- **文件**: `src/stores/sessionStore.ts`
- **修复内容**: 在 resetSession 中添加 pipeline.dispose() 调用

### P5: videoStore - 缺少输入验证 ✅ 已修复
- **文件**: `src/stores/videoStore.ts`
- **修复内容**:
  - setVideoDuration: 非负数验证
  - setVideoTime: 范围检查 Math.max(0, Math.min(time, duration))
  - setPlaybackRate: 正数检查和范围限制 [0.1, 4.0]
  - 新增 pause() 方法
  - 新增 seek() 方法

### P6: render - dispose 方法不完整 ✅ 已修复
- **文件**: `src/features/render/GaussianSplattingRenderer.ts`
- **修复内容**:
  - 保存事件处理函数引用
  - 在 dispose 中移除所有鼠标事件监听器
  - 清理 geometry 的所有属性
  - 清理 ShaderMaterial 的 uniforms (纹理清理)
  - 清理场景中的灯光
  - 清理背景和渲染器

### P7: render - 缺少触摸支持 ✅ 已修复
- **文件**: `src/features/render/GaussianSplattingRenderer.ts`
- **修复内容**:
  - 添加 touchstart, touchmove, touchend, touchcancel 事件处理
  - 使用 { passive: false } 防止移动端默认行为
  - 在 dispose 中移除触摸事件监听器

### P8: Pipeline - 重试/超时未实现 ✅ 已修复
- **文件**: `src/core/pipeline/PipelineEngine.ts`
- **修复内容**:
  - 添加 executeWithTimeout 函数 (Promise.race 实现)
  - 添加 executeWithRetry 函数
  - 实现指数退避策略 (1s, 2s, 4s, 8s...最大10s)

---

## 🟠 第二优先级 - 应该修复

### S1: settings - 预设功能不完整 ✅ 已修复
- **文件**: `src/features/settings/components/SettingsModal.tsx`
- **修复内容**:
  - handleSavePreset: 从 useSceneStore.getState().getConfig() 获取配置并序列化保存
  - handleLoadPreset: 加载预设配置后通过 sceneStore.setConfig(config) 应用

### S2: sharedStore - localStorage 错误处理为空 ✅ 已修复
- **文件**: `src/stores/sharedStore.ts`
- **修复内容**: 为 getItem、setItem、removeItem 的 catch 块添加 console.warn 日志

### S3: sceneConfigStore - getConfig 引用泄露 ✅ 已修复
- **文件**: `src/stores/sceneConfigStore.ts`
- **修复内容**: 使用 structuredClone(get().config) 返回深拷贝

### S4: cameraStore - 历史记录无限增长 ✅ 已修复
- **文件**: `src/stores/cameraStore.ts`
- **修复内容**:
  - 添加 HISTORY_SOFT_LIMIT = 100 常量
  - 在 setPose 中添加软限制压缩逻辑

### S5: cameraStore - 事件监听器未清理 ✅ 已修复
- **文件**: `src/stores/cameraStore.ts`
- **修复内容**: 添加注释说明 (使用 zustand subscribeWithSelector 不需要手动清理)

### S6: settings - API Key 安全风险 ✅ 已修复
- **文件**: `src/features/settings/components/SettingsModal.tsx`
- **修复内容**: 添加安全提示框，说明 API Key 存储方式和注意事项

---

## 🟡 第三优先级 - 建议改进

### M1: useMobileOptimization - 性能优化 ✅ 已修复
- **文件**: `src/shared/hooks/useMobileOptimization.ts`
- **修复内容**:
  - 分离事件监听器到独立的 useEffect hooks
  - 使用 useMemo 缓存 renderSettings

### M2: presets - 类型导入不一致 ✅ 已修复
- **文件**: `src/shared/config/presets.ts`
- **修复内容**: 统一所有类型导入来源为 @/shared/types

### M3: controls - 搜索功能 ✅ 已修复
- **文件**: `src/features/controls/compound/ControlPanelCompound.tsx`
- **修复内容**: 将 searchQuery 状态通过 Context 传递给 Tab 组件

### M4: ErrorCodes - 覆盖不足 ✅ 已修复
- **文件**: `src/core/ErrorCodes.ts`
- **修复内容**: 从 18 个错误码扩展到 60+ 个错误码

---

## ✅ 已完成修复

| ID | 问题 | 修复日期 |
|----|------|---------|
| P1 | render - loadFromPLY 缺少错误处理 | 2026-03-19 |
| P2 | upload - __TEST_MODE__ hack | 2026-03-19 |
| P3 | utils - math/common.ts 常量顺序错误 | 2026-03-19 |
| P4 | sharedStore - Pipeline 资源泄漏 | 2026-03-19 |
| P5 | videoStore - 缺少输入验证 | 2026-03-19 |
| P6 | render - dispose 方法不完整 | 2026-03-19 |
| P7 | render - 缺少触摸支持 | 2026-03-19 |
| P8 | Pipeline - 重试/超时未实现 | 2026-03-19 |
| S1 | settings - 预设功能不完整 | 2026-03-19 |
| S2 | sharedStore - localStorage 错误处理为空 | 2026-03-19 |
| S3 | sceneConfigStore - getConfig 引用泄露 | 2026-03-19 |
| S4 | cameraStore - 历史记录无限增长 | 2026-03-19 |
| S5 | cameraStore - 事件监听器未清理 | 2026-03-19 |
| S6 | settings - API Key 安全风险 | 2026-03-19 |
| M1 | useMobileOptimization - 性能优化 | 2026-03-19 |
| M2 | presets - 类型导入不一致 | 2026-03-19 |
| M3 | controls - 搜索功能 | 2026-03-19 |
| M4 | ErrorCodes - 覆盖不足 | 2026-03-19 |

---

## 修复进度

```
第一优先级: 8/8 (100%)
第二优先级: 6/6 (100%)
第三优先级: 4/4 (100%)
总体进度: 18/18 (100%)
```

---

## 验证状态

- ✅ npm test: 180/180 测试通过
- ✅ npm run build: 构建成功
- ✅ TypeScript 编译: 无错误

---

*本文件由 Claude Code 自动生成，用于问题追踪*
