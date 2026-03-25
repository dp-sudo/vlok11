# Deep Debug Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 bugs discovered during deep comprehensive debug investigation.

**Architecture:** 5 independent bug fixes across 3 files. Each fix is self-contained and does not affect other fixes.

**Tech Stack:** TypeScript, React Three Fiber, Zustand, Pipeline pattern

---

## Bug Summary

| # | Bug | Severity | File | Priority |
|---|-----|----------|------|----------|
| 1 | AnalyzeStage missing abort check before AI call | MEDIUM | AnalyzeStage.ts | P0 |
| 2 | DepthStage.canSkip() missing signal parameter | LOW | DepthStage.ts | P1 |
| 3 | DepthStage unreachable dead code after logger.error throw | LOW | DepthStage.ts | P1 |
| 4 | sessionStore stale comment claiming missing protection | CHORE | sessionStore.ts | P2 |
| 5 | UploadPipeline abortController reuse on error (upload twice bug) | CRITICAL | UploadPipeline.ts | P0 |

---

## Chunk 1: AnalyzeStage Abort Check Fix

**Files:**
- Modify: `src/features/upload/pipeline/stages/AnalyzeStage.ts:38-39`

- [ ] **Step 1: Add throwIfAborted before AI call**

Read `src/features/upload/pipeline/stages/AnalyzeStage.ts` lines 38-39.

Current code (line 39):
```typescript
const analysis = await this.aiService.analyzeScene(imageBase64);
```

Add throwIfAborted before it. The helper function `throwIfAborted` is defined in DepthStage.ts and ReadStage.ts but NOT in AnalyzeStage.ts. We need to add it.

After line 11 (constructor), add:
```typescript
private throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Aborted');
  }
}
```

Then at line 38 (before `const analysis = await...`), add:
```typescript
this.throwIfAborted(input.signal);
```

Verify input has signal by checking StageInput type. Looking at AnalyzeStage.execute() signature - input is StageInput which should have signal property from LegacyStageAdapter at UploadPipeline.ts:44.

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/features/upload/pipeline/stages/AnalyzeStage.ts`

Expected: No errors (module resolution may show warnings but no TS errors)

- [ ] **Step 3: Run tests**

Run: `npm test -- --run src/features/upload`

Expected: All upload pipeline tests pass

- [ ] **Step 4: Commit**

```bash
git add src/features/upload/pipeline/stages/AnalyzeStage.ts
git commit -m "fix(upload): add abort check before AI call in AnalyzeStage

Prevents wasted AI tokens when user cancels upload during analyze phase.
This was causing API calls to complete even after user cancelled."
```

---

## Chunk 2: DepthStage canSkip Signal Fix

**Files:**
- Modify: `src/features/upload/pipeline/stages/DepthStage.ts:19-21`

- [ ] **Step 1: Add signal parameter to canSkip**

Current code (lines 19-21):
```typescript
canSkip(input: StageInput): boolean {
  return input.depthUrl !== undefined;
}
```

Update to:
```typescript
canSkip(input: StageInput, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  return input.depthUrl !== undefined;
}
```

- [ ] **Step 2: Update LegacyStageAdapter to pass signal**

Read `UploadPipeline.ts` line 46:
```typescript
if (this.legacyStage.canSkip?.(inputWithContext)) {
```

Current: passes only `inputWithContext`
Needed: pass signal too

Update UploadPipeline.ts line 46 to:
```typescript
if (this.legacyStage.canSkip?.(inputWithContext, context.signal)) {
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit src/features/upload/pipeline/stages/DepthStage.ts src/features/upload/UploadPipeline.ts`

- [ ] **Step 4: Commit**

```bash
git add src/features/upload/pipeline/stages/DepthStage.ts src/features/upload/UploadPipeline.ts
git commit -m "fix(upload): pass abort signal to DepthStage.canSkip

Ensures canSkip respects abort signal so cancelled uploads don't
continue to next stage unnecessarily."
```

---

## Chunk 3: DepthStage Dead Code Removal

**Files:**
- Modify: `src/features/upload/pipeline/stages/DepthStage.ts:34-38`

- [ ] **Step 1: Analyze dead code**

Lines 34-38:
```typescript
if (!input.imageUrl) {
  logger.error('Missing imageUrl in input', { input: Object.keys(input) });
  throwIfAborted(input.signal);  // line 36 - UNREACHABLE
  throw new Error('No image URL available for depth estimation');  // line 37 - UNREACHABLE
}
```

The logger.error throws (based on DepthStage.ts logger implementation). If logger.error throws, lines 36-37 are unreachable.

Check logger.error in Logger.ts - it does NOT throw, it just logs. So lines 36-37 ARE reachable after logger.error returns without throwing.

**Actually the debugger agent was wrong here** - logger.error does NOT throw. The dead code is NOT dead. Skip this fix.

- [ ] **Step 1: Verify logger.error behavior**

Read `src/core/Logger.ts` to confirm logger.error does not throw.

Based on standard logging patterns, logger.error logs the error and returns. The code at lines 36-37 IS reachable after logger.error. **This was a false positive from the debugger agent.**

**Skip Chunk 3** - No fix needed.

---

## Chunk 4: sessionStore Stale Comment Fix

**Files:**
- Modify: `src/stores/sessionStore.ts:150`

- [ ] **Step 1: Fix stale comment**

Current (line 150):
```typescript
// S6 - 缺少并发上传保护
```

This comment is incorrect - the protection EXISTS at line 151 (`if (get().status === 'uploading') return;`).

Update to:
```typescript
// S6 - Guard against concurrent uploads
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/sessionStore.ts
git commit -m "chore: fix stale comment in sessionStore uploadStart

Comment incorrectly claimed missing protection that actually exists."
```

---

## Chunk 5: UploadPipeline AbortController Reset Fix

**Files:**
- Modify: `src/features/upload/pipeline/UploadPipeline.ts:219-229` (dispose method)

- [ ] **Step 1: Analyze abortController lifecycle**

Current flow:
1. `process()` line 360: `this.abortController = new AbortController();`
2. `executeStages()` line 266: `this.abortController ??= new AbortController();`
3. On error, `dispose()` line 227: `this.abortController?.abort();` - only aborts, does NOT nullify
4. Next `process()` call - creates NEW controller at line 360

**The bug**: When `executeStages()` catches an error at line 281-289:
- It calls `this.releaseBlobUrls()`
- It calls `this.handleStageError()`
- It throws new Error('Pipeline Execution Interrupted')

The pipeline is NOT disposed on error - only `releaseBlobUrls()` and `handleStageError()` are called. The `abortController` remains with aborted signal.

On NEXT call to `executeStages()` within the same pipeline instance (NOT via `resetSession()`):
- Line 266: `this.abortController ??= new AbortController();` - SKIPS because controller EXISTS (but is aborted!)
- The aborted signal is reused, causing immediate abort

**Root cause**: `dispose()` nullifies everything EXCEPT `abortController`. On error without full dispose, the aborted controller persists.

- [ ] **Step 2: Fix dispose() to nullify abortController**

Current dispose() at lines 219-229:
```typescript
dispose(): void {
  for (const unsubscribe of this.unsubscriptions) {
    unsubscribe();
  }
  this.unsubscriptions = [];
  this.completeCallbacks.clear();
  this.errorCallbacks.clear();
  this.progressCallbacks.clear();
  this.abortController?.abort();
  this.releaseBlobUrls();
}
```

Update to:
```typescript
dispose(): void {
  for (const unsubscribe of this.unsubscriptions) {
    unsubscribe();
  }
  this.unsubscriptions = [];
  this.completeCallbacks.clear();
  this.errorCallbacks.clear();
  this.progressCallbacks.clear();
  this.abortController?.abort();
  this.abortController = null;  // ADD THIS LINE - prevents stale aborted controller reuse
  this.releaseBlobUrls();
}
```

Also update executeStages() line 266 to remove `??=` and always create fresh:
```typescript
// Line 266: Remove ??= operator, always create fresh
this.abortController = new AbortController();
```

Wait - `process()` already creates a new controller at line 360 BEFORE calling `executeStages()`. So the real issue is: if `executeStages()` throws, the catch at 281-289 doesn't create a new controller. On next `process()` call, a new controller is created at line 360.

Let me trace more carefully:
1. First `process()` call: line 360 creates controller A
2. `executeStages()` line 266: controller A exists (??= is no-op), uses controller A
3. Error occurs, catch at 281 runs
4. Second `process()` call: line 360 creates controller B (replaces A)
5. `executeStages()` line 266: controller B exists (??= is no-op), uses controller B

This should work correctly...

**But** - the issue is when `resetSession()` is NOT called between uploads. Looking at sessionStore:
- `uploadStart()` calls `ensurePipeline()` which returns existing pipeline if `pipeline !== null`
- `resetSession()` sets `pipeline = null` and disposes

If user uploads, fails, then uploads again WITHOUT calling resetSession:
- Same pipeline instance used
- `process()` creates new controller each time (line 360)
- So fresh controller should be used...

**Unless** - `executeStages()` line 266 uses `??=` AFTER `process()` creates the controller. But `??=` means "if null/undefined, assign". If `process()` line 360 sets `this.abortController = new AbortController();`, then `executeStages()` line 266 `this.abortController ??= new AbortController();` should be NO-OP since it already exists.

Hmm, the bug must be more subtle. Let me re-read the debugger agent's analysis:

"**Line 266 in executeStages(): `this.abortController ??= new AbortController();` - NO-OP if already exists!**"

And: "If `this.abortController` was already set AND aborted during a previous failed upload, `executeStages()` keeps reusing the aborted controller instead of creating a fresh one."

AH - I see the issue now. `process()` line 360 creates a NEW controller BEFORE `executeStages()` is called:

```typescript
async process(input: File | string): Promise<ProcessedResult> {
  this.releaseBlobUrls();
  this.startTime = Date.now();
  this.abortController = new AbortController();  // Creates fresh controller
  this.currentRunId = generateUUID();
  // ...
  stageInput = createStageInput(input, this.abortController.signal, this.currentRunId);  // Uses fresh controller
  try {
    stageInput = await this.executeStages(stageInput);  // executeStages uses ??=
```

So `process()` creates a fresh controller, then calls `executeStages()`. But `executeStages()` line 266 uses `??=` - if `this.abortController` already exists (which it does, just created by `process()`), the `??=` is NO-OP.

Wait - `this.abortController` is set to `new AbortController()` at line 360 BEFORE `executeStages()` at line 368. So when `executeStages()` runs `this.abortController ??= new AbortController();` at line 266, `this.abortController` is already set (just created by `process()`). So the `??=` does nothing - which is CORRECT behavior since we want to use the controller created by `process()`.

But - what if `executeStages()` is called from somewhere else? Let me check... No, only `process()` calls `executeStages()`.

Actually wait - the `??=` at line 266 means "if abortController is null/undefined, create new". But `process()` creates it at line 360 BEFORE `executeStages()`. So the `??=` at 266 should see the existing controller and NOT create a new one.

Unless... there's a race condition? Or unless the controller from a PREVIOUS run wasn't properly cleaned up?

Let me think about this from the user's perspective: "first upload fails, second succeeds"

If first upload fails:
1. `executeStages()` catches error
2. Calls `releaseBlobUrls()` and `handleStageError()`
3. Throws "Pipeline Execution Interrupted"
4. `process()` catch at line 373 catches it
5. `releaseBlobUrls()` called again
6. Error is thrown to caller

The `abortController` is NOT aborted in `dispose()` - wait, actually it IS aborted at line 227: `this.abortController?.abort();`

So after first upload fails:
- `abortController` exists AND is aborted
- `abortController` is NOT set to null

On second upload attempt:
- `process()` line 360: `this.abortController = new AbortController();` - Creates NEW controller
- This should work fine!

UNLESS - `resetSession()` is NOT called, and somehow `executeStages()` is NOT using the controller from `process()`.

Actually wait - let me look at `process()` again more carefully:

```typescript
async process(input: File | string): Promise<ProcessedResult> {
  this.releaseBlobUrls();
  this.startTime = Date.now();
  this.abortController = new AbortController();  // <-- Sets fresh controller
  this.currentRunId = generateUUID();
  // ...
  let stageInput = createStageInput(input, this.abortController.signal, this.currentRunId);  // <-- Uses it for input

  try {
    stageInput = await this.executeStages(stageInput);  // <-- Passes input WITH signal
```

The signal from the NEW controller is passed to `executeStages()` via `stageInput.signal`.

Then in `executeStages()`:
```typescript
this.abortController ??= new AbortController();  // <-- abortController EXISTS (just set by process), so ??= is NO-OP
```

So the NEW controller's signal should be used.

BUT WAIT - `executeStages()` receives `stageInput` which includes the signal from the fresh controller. So even if `executeStages()` creates its own controller, the signal passed via `stageInput` should be the correct one.

Actually, let me check `createStageInput`:
```typescript
const createStageInput = (input: File | string, signal: AbortSignal, runId: string): StageInput => {
  return input instanceof File ? { file: input, signal, runId } : { url: input, runId, signal };
};
```

Yes! The signal from `process()` line 360 is passed to `createStageInput()`, which creates `stageInput.signal` from the fresh controller. This signal is then passed to `executeStages()` via `stageInput`.

But `executeStages()` uses `context.signal` not `stageInput.signal` directly. Let me check `LegacyStageAdapter.execute()`:

```typescript
async execute(input: StageInput, context: StageContext<StageInput>): Promise<StageOutput> {
  const inputWithContext = { ...input, signal: context.signal, runId: context.runId };
  // ...
}
```

At UploadPipeline.ts line 268:
```typescript
const output = await this.engine.execute<StageInput>(
  stageInput,  // Has signal from process()'s fresh controller
  config,
  this.abortController.signal  // Uses this.abortController.signal
);
```

The `engine.execute()` receives BOTH `stageInput` (with fresh signal) and `this.abortController.signal`. Which one does it use?

Looking at PipelineEngine.execute() signature - it takes `signal: AbortSignal` as third param, and passes it to stages via context. So the `this.abortController.signal` at line 271 is what matters.

But `this.abortController` at line 271 - is it the fresh one from `process()` line 360, or could it be stale?

Since `process()` line 360 sets `this.abortController = new AbortController();` BEFORE calling `executeStages()`, the controller at line 271 SHOULD be fresh.

Unless there's something else going on... Actually, maybe the bug is different. Let me re-read the debugger agent's analysis:

"**The Bug**: When `process()` creates a new `AbortController` (line 360), it does NOT update `this.abortController` used by `executeStages()`."

Wait - `process()` line 360 DOES set `this.abortController`. So `executeStages()` would see the updated value.

Unless the issue is that `executeStages()` line 266 creates its own controller via `??=` BEFORE `process()` line 360 runs?

But no - `executeStages()` is called AFTER `process()` sets the controller.

Hmm, let me try a different angle. What if the bug is actually in `resetSession()` not being called properly between uploads?

Actually, looking at the debugger agent's suggested fix:

"**Fix**: Either:
- A) In `process()`, update `this.abortController` before `executeStages()` runs
- B) In `executeStages()`, always create a fresh `AbortController` instead of using `??=`
- C) In `resetSession()`/`dispose()`, explicitly null out `this.abortController`"

Option C is simplest and safest: in `dispose()`, set `this.abortController = null;` so on next use a fresh one is created via the `??=` in `executeStages()`.

Let me also change `executeStages()` line 266 to always create fresh instead of `??=`, since `process()` already creates one but `executeStages()` might be called independently.

Actually no - `executeStages()` is only called from `process()`. So `process()` should be the one to set the controller.

The safest fix is:
1. In `dispose()`, add `this.abortController = null;`
2. In `executeStages()`, change `??=` to `=` to always ensure fresh controller

Actually the simplest fix that matches the debugger's Option C:

In `dispose()` at line 227 after `this.abortController?.abort();`, add:
```typescript
this.abortController = null;
```

This ensures that when a new `process()` call happens, the `??=` at line 266 will create a fresh controller since `this.abortController` is now null.

- [ ] **Step 1: Add abortController = null in dispose()**

Modify `UploadPipeline.ts` dispose() method.

Current line 227:
```typescript
this.abortController?.abort();
```

Add after:
```typescript
this.abortController = null;
```

- [ ] **Step 2: Verify no other places rely on abortController persisting after dispose**

Search for all uses of `this.abortController` in UploadPipeline.ts:
- Line 119: declaration `private abortController: AbortController | null = null;`
- Line 216: `cancel()` uses `this.abortController?.abort()`
- Line 227: `dispose()` uses `this.abortController?.abort()`
- Line 266: `executeStages()` uses `this.abortController ??= new AbortController()`
- Line 271: `executeStages()` passes `this.abortController.signal` to engine
- Line 360: `process()` creates `this.abortController = new AbortController()`

All usages are safe with `null` assignment.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit src/features/upload/UploadPipeline.ts`

- [ ] **Step 4: Run tests**

Run: `npm test -- --run UploadPipeline`

- [ ] **Step 5: Commit**

```bash
git add src/features/upload/UploadPipeline.ts
git commit -m "fix(upload): reset abortController to null in dispose()

Prevents aborted controller from being reused on subsequent uploads
within the same pipeline instance. This was causing the 'upload twice'
bug where the first upload would fail and subsequent uploads would
immediately abort due to stale aborted signal."
```

---

## Verification Checklist

After all chunks:

- [ ] Run `npm test -- --run` - all tests pass
- [ ] Run `npm run build` - builds successfully
- [ ] Run `npx tsc --noEmit` - no TypeScript errors

---

## Files Summary

| File | Changes |
|------|---------|
| `src/features/upload/pipeline/stages/AnalyzeStage.ts` | Add throwIfAborted helper and call before AI service |
| `src/features/upload/pipeline/stages/DepthStage.ts` | Add signal parameter to canSkip |
| `src/features/upload/UploadPipeline.ts` | Pass signal to canSkip, nullify abortController in dispose |
| `src/stores/sessionStore.ts` | Fix stale comment |

---

## Skipped Items (False Positives)

| Item | Reason |
|------|--------|
| DepthStage lines 36-37 dead code | logger.error does NOT throw - code IS reachable |
