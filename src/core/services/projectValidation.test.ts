import { describe, expect, it } from 'vitest';

import type { ProjectData } from '@/core/types/project';
import { CameraMode, ProjectionMode, RenderStyle } from '@/shared/types';

import { isValidProjectData } from './projectValidation';

interface SceneOverrides {
  camera?: Partial<ProjectData['scene']['camera']>;
  config?: Record<string, unknown>;
  precision?: Partial<ProjectData['scene']['precision']>;
  video?: Partial<NonNullable<ProjectData['scene']['video']>>;
}

interface ProjectDataOverrides {
  assets?: Partial<ProjectData['assets']>;
  meta?: Partial<ProjectData['meta']>;
  scene?: SceneOverrides;
}

function createProjectData(overrides?: ProjectDataOverrides): ProjectData {
  const defaultConfig = {
    cameraMode: CameraMode.PERSPECTIVE,
    renderStyle: RenderStyle.NORMAL,
    projectionMode: ProjectionMode.PLANE,
    isImmersive: false,
    fov: 50,
    displacementScale: 1,
  } as ProjectData['scene']['config'];

  return {
    meta: {
      name: '测试项目',
      createdAt: 1,
      lastModified: 2,
      version: '1.0.0',
      ...overrides?.meta,
    },
    assets: {
      sourceType: 'image',
      sourcePath: 'https://example.com/source.png',
      ...overrides?.assets,
    },
    scene: {
      camera: {
        position: [0, 0, 5],
        target: [0, 0, 0],
        fov: 50,
        ...overrides?.scene?.camera,
      },
      config: (overrides?.scene?.config ?? defaultConfig) as ProjectData['scene']['config'],
      precision: {
        moveSensitivity: 1,
        rotateSensitivity: 1,
        zoomSensitivity: 1,
        dampingFactor: 0.1,
        fovStep: 1,
        fovRange: { min: 1, max: 180 },
        minMoveThreshold: 0.001,
        ...overrides?.scene?.precision,
      },
      video: {
        currentTime: 0,
        duration: 10,
        isLooping: true,
        isMuted: true,
        isPlaying: false,
        playbackRate: 1,
        ...overrides?.scene?.video,
      },
    },
  };
}

describe('projectValidation', () => {
  it('应接受结构完整的项目数据', () => {
    expect(isValidProjectData(createProjectData())).toBe(true);
  });

  it('应拒绝缺少关键配置字段的项目数据', () => {
    const invalidData = createProjectData({
      scene: {
        camera: {
          position: [0, 0, 5],
          target: [0, 0, 0],
          fov: 50,
        },
        config: {},
        precision: {
          moveSensitivity: 1,
          rotateSensitivity: 1,
          zoomSensitivity: 1,
          dampingFactor: 0.1,
          fovStep: 1,
          fovRange: { min: 1, max: 180 },
          minMoveThreshold: 0.001,
        },
      },
    });

    expect(isValidProjectData(invalidData)).toBe(false);
  });

  it('应拒绝内嵌资源字段不完整的项目数据', () => {
    const invalidData = createProjectData({
      assets: {
        sourceType: 'video',
        sourcePath: 'blob:test',
        inlineDataUrl: 'data:video/mp4;base64,AAAA',
      },
    });

    expect(isValidProjectData(invalidData)).toBe(false);
  });

  it('应拒绝损坏的视频状态结构', () => {
    const invalidData = createProjectData({
      scene: {
        video: {
          currentTime: 0,
          duration: 10,
          isLooping: true,
          isMuted: true,
          isPlaying: false,
          playbackRate: Number.NaN,
        },
      },
    });

    expect(isValidProjectData(invalidData)).toBe(false);
  });
});
