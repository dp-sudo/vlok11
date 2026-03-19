import { describe, expect, it, beforeEach } from 'vitest';
import type { StageInput, StageOutput } from '../types';
import { PrepareStage } from './PrepareStage';
import { SceneType, TechPipeline } from '@/core/domain/types';

describe('PrepareStage', () => {
  let stage: PrepareStage;

  beforeEach(() => {
    stage = new PrepareStage();
  });

  const createMockInput = (overrides?: Partial<StageInput> & { imageUrl?: string; depthUrl?: string; analysis?: { description: string; estimatedDepthScale: number; recommendedFov: number; reasoning: string; recommendedPipeline: TechPipeline; sceneType: SceneType } }): StageInput => {
    const base: StageInput = {
      imageUrl: 'https://example.com/image.jpg',
      depthUrl: 'https://example.com/depth.png',
      analysis: {
        description: 'Test image',
        estimatedDepthScale: 1.5,
        recommendedFov: 50,
        reasoning: 'Test reasoning',
        recommendedPipeline: TechPipeline.DEPTH_MESH,
        sceneType: SceneType.OBJECT,
      },
    };
    if (!overrides) return base;
    const { imageUrl, depthUrl, analysis, ...rest } = overrides;
    return {
      ...base,
      ...rest,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(depthUrl !== undefined ? { depthUrl } : {}),
      ...(analysis !== undefined ? { analysis } : {}),
    } as StageInput;
  };

  describe('basic properties', () => {
    it('should have correct name', () => {
      expect(stage.name).toBe('prepare');
    });

    it('should have correct order', () => {
      expect(stage.order).toBe(3);
    });
  });

  describe('execute', () => {
    it('should return success with valid input', async () => {
      const input = createMockInput();
      const result = await stage.execute(input);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should include recommendedConfig in metadata', async () => {
      const input = createMockInput();
      const result = await stage.execute(input);

      expect(result.success).toBe(true);
      expect((result as StageOutput).metadata).toBeDefined();
      const metadata = (result as StageOutput).metadata as Record<string, unknown>;
      expect(metadata['recommendedConfig']).toEqual({
        displacementScale: 1.5,
        fov: 50,
      });
    });

    it('should set ready: true in metadata', async () => {
      const input = createMockInput();
      const result = await stage.execute(input);

      expect(result.success).toBe(true);
      const metadata = (result as StageOutput).metadata as Record<string, unknown>;
      expect(metadata['ready']).toBe(true);
    });

    it('should preserve existing metadata', async () => {
      const input = createMockInput({
        metadata: { width: 1920, height: 1080 },
      });
      const result = await stage.execute(input);

      expect(result.success).toBe(true);
      const metadata = (result as StageOutput).metadata!;
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
    });

    it('should fail when imageUrl is missing', async () => {
      const input = createMockInput({ imageUrl: '' });
      const result = await stage.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Missing image URL');
    });

    it('should fail when depthUrl is missing', async () => {
      const input = createMockInput({ depthUrl: '' });
      const result = await stage.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Missing depth URL');
    });

    it('should fail when analysis is missing', async () => {
      // Cast to any to bypass type checking for this specific test case
      const input = { ...createMockInput(), analysis: null } as unknown as StageInput;
      const result = await stage.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Missing analysis data');
    });

    it('should fail when signal is aborted', async () => {
      const mockSignal = {
        aborted: true,
      } as AbortSignal;
      const input = createMockInput({ signal: mockSignal });
      const result = await stage.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Aborted');
    });

    it('should use estimatedDepthScale from analysis', async () => {
      const input = createMockInput({
        analysis: {
          description: 'Test',
          estimatedDepthScale: 2.5,
          recommendedFov: 50,
          reasoning: 'Test reasoning',
          recommendedPipeline: TechPipeline.DEPTH_MESH,
          sceneType: SceneType.OBJECT,
        },
      });
      const result = await stage.execute(input);

      expect(result.success).toBe(true);
      const metadata = (result as StageOutput).metadata as Record<string, unknown>;
      expect((metadata['recommendedConfig'] as Record<string, unknown>)?.['displacementScale']).toBe(2.5);
    });

    it('should handle missing optional analysis fields', async () => {
      const input = createMockInput({
        analysis: {
          description: 'Test',
          estimatedDepthScale: 1.0,
          recommendedFov: 50,
          reasoning: 'Test reasoning',
          recommendedPipeline: TechPipeline.DEPTH_MESH,
          sceneType: SceneType.OBJECT,
        },
      });
      const result = await stage.execute(input);

      expect(result.success).toBe(true);
      expect((result as StageOutput).metadata).toBeDefined();
    });
  });
});
