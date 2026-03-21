import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEventBus, resetEventBus } from '@/core/EventBus';
import { PipelineEngine } from './PipelineEngine';
import { getStageRegistry, StageRegistry } from './StageRegistry';
import type { PipelineConfig, PipelineStage } from './types';

describe('PipelineEngine', () => {
  let engine: PipelineEngine;

  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset singleton instances
    resetEventBus();
    engine = PipelineEngine.getInstance();
    void engine.dispose();
    StageRegistry.getInstance();

    // Clear the registry
    const registry = getStageRegistry();

    registry.unregister('test1');
    registry.unregister('test2');
    registry.unregister('failStage');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetEventBus();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = PipelineEngine.getInstance();
      const instance2 = PipelineEngine.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('execute', () => {
    it('should execute registered stages in order', async () => {
      const executionOrder: string[] = [];

      const stage1: PipelineStage = {
        name: 'stage1',
        async execute(input) {
          executionOrder.push('stage1');

          return { ...(input as object), stage1: true };
        },
      };

      const stage2: PipelineStage = {
        name: 'stage2',
        async execute(input) {
          executionOrder.push('stage2');

          return { ...(input as object), stage2: true };
        },
      };

      const registry = getStageRegistry();

      registry.register('stage1', stage1);
      registry.register('stage2', stage2);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [
          { id: 'stage1', type: 'stage1', order: 0 },
          { id: 'stage2', type: 'stage2', order: 1, dependsOn: ['stage1'] },
        ],
      };

      const result = await engine.execute({}, config);

      expect(executionOrder).toEqual(['stage1', 'stage2']);
      expect(result).toMatchObject({ stage1: true, stage2: true });
    });

    it('should pass data between stages', async () => {
      let receivedInput: unknown;

      const stage1: PipelineStage = {
        name: 'stage1',
        async execute(input) {
          return { ...(input as object), fromStage1: 'data1' };
        },
      };

      const stage2: PipelineStage = {
        name: 'stage2',
        async execute(input) {
          receivedInput = input;

          return { ...(input as object), fromStage2: 'data2' };
        },
      };

      const registry = getStageRegistry();

      registry.register('stage1', stage1);
      registry.register('stage2', stage2);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [
          { id: 'stage1', type: 'stage1', order: 0 },
          { id: 'stage2', type: 'stage2', order: 1, dependsOn: ['stage1'] },
        ],
      };

      const result = await engine.execute({ initial: 'data' }, config);

      expect(receivedInput).toMatchObject({ initial: 'data', fromStage1: 'data1' });
      expect(result).toMatchObject({ fromStage1: 'data1', fromStage2: 'data2' });
    });

    it('should throw on stage not found', async () => {
      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [{ id: 'missing', type: 'nonExistent', order: 0 }],
      };

      await expect(engine.execute({}, config)).rejects.toThrow(
        "Stage type 'nonExistent' not found in registry"
      );
    });

    it('should throw on deadlock', async () => {
      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [
          { id: 'stage1', type: 'stage1', order: 0, dependsOn: ['stage2'] },
          { id: 'stage2', type: 'stage2', order: 1, dependsOn: ['stage1'] },
        ],
      };

      await expect(engine.execute({}, config)).rejects.toThrow(/Pipeline deadlock/);
    });

    it('should respect abort signal', async () => {
      const longRunning: PipelineStage = {
        name: 'longRunning',
        async execute() {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return {};
        },
      };

      const registry = getStageRegistry();

      registry.register('longRunning', longRunning);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [{ id: 'longRunning', type: 'longRunning', order: 0 }],
      };

      const controller = new AbortController();

      controller.abort();

      await expect(engine.execute({}, config, controller.signal)).rejects.toThrow(
        'Pipeline aborted'
      );
    });

    it('should skip disabled stages', async () => {
      const executedStages: string[] = [];

      const stage1: PipelineStage = {
        name: 'stage1',
        async execute() {
          executedStages.push('stage1');

          return { stage1: true };
        },
      };

      const stage2: PipelineStage = {
        name: 'stage2',
        async execute() {
          executedStages.push('stage2');

          return { stage2: true };
        },
      };

      const registry = getStageRegistry();

      registry.register('stage1', stage1);
      registry.register('stage2', stage2);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [
          { id: 'stage1', type: 'stage1', order: 0, enabled: true },
          { id: 'stage2', type: 'stage2', order: 1, enabled: false },
        ],
      };

      await engine.execute({}, config);

      expect(executedStages).toEqual(['stage1']);
    });

    it('should emit events during execution', async () => {
      const stage: PipelineStage = {
        name: 'testStage',
        async execute(input) {
          return { ...(input as object), done: true };
        },
      };

      const registry = getStageRegistry();

      registry.register('testStage', stage);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [{ id: 'testStage', type: 'testStage', order: 0 }],
      };

      const startedHandler = vi.fn();
      const completedHandler = vi.fn();

      const bus = getEventBus();

      bus.on('pipeline:stage-started', startedHandler);
      bus.on('pipeline:stage-completed', completedHandler);

      await engine.execute({}, config);

      expect(startedHandler).toHaveBeenCalled();
      expect(completedHandler).toHaveBeenCalled();
    });
  });

  describe('registerStage', () => {
    it('should register a stage', () => {
      const stage: PipelineStage = {
        name: 'newStage',
        async execute(input) {
          return input;
        },
      };

      const registry = getStageRegistry();

      registry.register('newStage', stage);

      const retrieved = registry.getStage('newStage');

      expect(retrieved).toBe(stage);
    });

    it('should overwrite existing stage', () => {
      const stage1: PipelineStage = {
        name: 'stage1',
        async execute(input) {
          return { ...(input as object), v: 1 };
        },
      };

      const stage2: PipelineStage = {
        name: 'stage2',
        async execute(input) {
          return { ...(input as object), v: 2 };
        },
      };

      const registry = getStageRegistry();

      registry.register('same', stage1);
      registry.register('same', stage2);

      const retrieved = registry.getStage('same');

      expect(retrieved).toBe(stage2);
    });
  });

  describe('dispose', () => {
    it('should clear instance after dispose', async () => {
      await engine.dispose();
      const newEngine = PipelineEngine.getInstance();

      expect(newEngine).not.toBe(engine);
    });
  });

  describe('error handling', () => {
    it('should handle stage execution error', async () => {
      const errorStage: PipelineStage = {
        name: 'errorStage',
        async execute() {
          throw new Error('Stage failed');
        },
      };

      const registry = getStageRegistry();

      registry.register('errorStage', errorStage);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [{ id: 'errorStage', type: 'errorStage', order: 0 }],
      };

      await expect(engine.execute({}, config)).rejects.toThrow('Stage failed');
    });

    it('should handle empty stages array', async () => {
      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [],
      };

      const result = await engine.execute({ initial: 'data' }, config);

      expect(result).toEqual({ initial: 'data' });
    });

    it('should handle stages with no dependencies', async () => {
      const executedStages: string[] = [];

      const stage1: PipelineStage = {
        name: 'stage1',
        async execute() {
          executedStages.push('stage1');

          return { result: 1 };
        },
      };

      const stage2: PipelineStage = {
        name: 'stage2',
        async execute() {
          executedStages.push('stage2');

          return { result: 2 };
        },
      };

      const registry = getStageRegistry();

      registry.register('stage1', stage1);
      registry.register('stage2', stage2);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [
          { id: 'stage1', type: 'stage1', order: 0 },
          { id: 'stage2', type: 'stage2', order: 1 },
        ],
      };

      await engine.execute({}, config);

      expect(executedStages).toContain('stage1');
      expect(executedStages).toContain('stage2');
    });

    it('should handle circular dependency detection', async () => {
      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [
          { id: 'stage1', type: 'stage1', order: 0, dependsOn: ['stage2'] },
          { id: 'stage2', type: 'stage2', order: 1, dependsOn: ['stage3'] },
          { id: 'stage3', type: 'stage3', order: 2, dependsOn: ['stage1'] },
        ],
      };

      await expect(engine.execute({}, config)).rejects.toThrow();
    });

    it('should handle missing dependency', async () => {
      const stage1: PipelineStage = {
        name: 'stage1',
        async execute(input) {
          return input;
        },
      };

      const registry = getStageRegistry();

      registry.register('stage1', stage1);

      const config: PipelineConfig = {
        id: 'test-pipeline',
        version: '1.0.0',
        stages: [{ id: 'stage1', type: 'stage1', order: 0, dependsOn: ['missing'] }],
      };

      await expect(engine.execute({}, config)).rejects.toThrow();
    });
  });
});
