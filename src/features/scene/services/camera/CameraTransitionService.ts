import type { OrthographicCamera, PerspectiveCamera } from 'three';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

import { getEventBus } from '@/core/EventBus';
import type { LifecycleAware } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import { CAMERA_TRANSITION, PERSPECTIVE_ORTHO } from '@/shared/constants/camera';
import type {
    AnimationHandle,
    CameraStateSnapshot,
    CameraTransitionConfig,
    ProjectionCameraPreset,
    Vec3,
} from '@/shared/types';
import { CameraMode, ProjectionMode } from '@/shared/types';
import { useCameraStore, useSceneStore } from '@/stores/index';
import { getAnimationScheduler } from './AnimationScheduler';
import { captureSnapshot, createSnapshot, interpolateSnapshots } from './CameraStateSnapshot';
import { calculateCameraSync } from './PerspectiveOrthoBridge';
import { getPresetForProjection, getTransitionConfig } from './ProjectionCameraPresets';

export interface TransitionCallbacks {
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: (progress: number, current: Partial<CameraStateSnapshot>) => void;
}

export const getCameraTransitionService = (): CameraTransitionServiceImpl =>
  CameraTransitionServiceImpl.getInstance();
const logger = createLogger({ module: 'CameraTransitionService' });

class CameraTransitionServiceImpl implements LifecycleAware {
  private static instance: CameraTransitionServiceImpl | null = null;
  private _isInitialized = false;

  private activeTransition: AnimationHandle | null = null;
  readonly dependencies = ['CameraService', 'AnimationScheduler'];
  private lastProjectionMode: ProjectionMode | null = null;
  readonly serviceId = 'CameraTransitionService';

  private constructor() {}

  static getInstance(): CameraTransitionServiceImpl {
    CameraTransitionServiceImpl.instance ??= new CameraTransitionServiceImpl();

    return CameraTransitionServiceImpl.instance;
  }

  private calculateTargetSnapshot(
    from: CameraStateSnapshot,
    preset: ProjectionCameraPreset,
    targetMode: ProjectionMode,
    cameraMode: CameraMode
  ): CameraStateSnapshot {
    const dir = new Vector3(
      from.position.x - from.target.x,
      from.position.y - from.target.y,
      from.position.z - from.target.z
    );

    if (dir.lengthSq() < CAMERA_TRANSITION.EPSILON) {
      dir.set(0, 0, 1);
    }
    dir.normalize();

    let targetPosition: Vec3;
    const targetLookAt: Vec3 = { ...preset.targetOffset };

    if (preset.positionHint === 'inside') {
      targetPosition = {
        x: targetLookAt.x + dir.x * preset.idealDistance,
        y: targetLookAt.y + dir.y * preset.idealDistance,
        z: targetLookAt.z + dir.z * preset.idealDistance,
      };
    } else if (preset.positionHint === 'above') {
      targetPosition = {
        x: targetLookAt.x,
        y: targetLookAt.y + preset.idealDistance,
        z: targetLookAt.z + CAMERA_TRANSITION.ABOVE_Z_OFFSET,
      };
    } else {
      targetPosition = {
        x: targetLookAt.x + dir.x * preset.idealDistance,
        y: targetLookAt.y + dir.y * preset.idealDistance,
        z: targetLookAt.z + dir.z * preset.idealDistance,
      };
    }

    return createSnapshot(
      targetPosition,
      targetLookAt,
      preset.idealFov,
      cameraMode,
      targetMode,
      from.zoom
    );
  }

  cancelTransition(): void {
    if (this.activeTransition) {
      this.activeTransition.cancel();
      this.activeTransition = null;
    }
  }

  async destroy(): Promise<void> {
    this.cancelTransition();
    this._isInitialized = false;
  }

  private executeTransition(
    from: CameraStateSnapshot,
    to: CameraStateSnapshot,
    config: CameraTransitionConfig,
    callbacks?: TransitionCallbacks
  ): AnimationHandle {
    const scheduler = getAnimationScheduler();

    callbacks?.onStart?.();

    return scheduler.animate(0, 1, {
      duration: config.duration,
      easing: config.easing,
      onUpdate: (progress) => {
        const interpolated = interpolateSnapshots(from, to, progress);

        useCameraStore.getState().setPose(
          {
            position: interpolated.position,
            target: interpolated.target,
            fov: interpolated.fov,
          },
          'motion'
        );
        callbacks?.onUpdate?.(progress, interpolated);
      },
      onComplete: () => {
        this.activeTransition = null;
        useCameraStore.getState().setPose(
          {
            position: to.position,
            target: to.target,
            fov: to.fov,
          },
          'preset'
        );
        callbacks?.onComplete?.();
        getEventBus().emit('camera:transition-complete', {
          projectionMode: to.projectionMode,
          cameraMode: to.cameraMode,
        });
      },
    });
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;
    logger.info('Initializing');
    this._isInitialized = true;
  }

  isTransitioning(): boolean {
    return this.activeTransition?.isActive() ?? false;
  }

  setLastProjectionMode(mode: ProjectionMode): void {
    this.lastProjectionMode = mode;
  }

  transitionCameraMode(
    targetMode: CameraMode,
    currentPosition: Vec3,
    currentTarget: Vec3,
    currentFovOrZoom: number,
    cameraDistance: number,
    callbacks?: TransitionCallbacks
  ): AnimationHandle | null {
    this.cancelTransition();

    const { config: sceneConfig } = useSceneStore.getState();

    if (sceneConfig.cameraMode === targetMode) return null;

    const { projectionMode, cameraMode: sourceMode } = sceneConfig;
    const fromSnapshot = createSnapshot(
      currentPosition,
      currentTarget,
      sourceMode === CameraMode.PERSPECTIVE ? currentFovOrZoom : PERSPECTIVE_ORTHO.DEFAULT_FOV,
      sourceMode,
      projectionMode,
      sourceMode === CameraMode.ORTHOGRAPHIC ? currentFovOrZoom : PERSPECTIVE_ORTHO.BASE_ZOOM
    );

    const syncResult = calculateCameraSync(
      sourceMode === CameraMode.PERSPECTIVE ? 'perspective' : 'orthographic',
      currentFovOrZoom,
      cameraDistance
    );

    const toSnapshot = createSnapshot(
      currentPosition,
      currentTarget,
      targetMode === CameraMode.PERSPECTIVE
        ? syncResult.perspectiveFov
        : PERSPECTIVE_ORTHO.DEFAULT_FOV,
      targetMode,
      projectionMode,
      targetMode === CameraMode.ORTHOGRAPHIC ? syncResult.orthoZoom : PERSPECTIVE_ORTHO.BASE_ZOOM
    );

    const transitionConfig: CameraTransitionConfig = {
      duration: 400,
      easing: 'ease-in-out-cubic',
      preserveDistance: true,
      preserveDirection: true,
    };

    this.activeTransition = this.executeTransition(
      fromSnapshot,
      toSnapshot,
      transitionConfig,
      callbacks
    );

    return this.activeTransition;
  }

  transitionToProjection(
    targetMode: ProjectionMode,
    currentPosition: Vec3,
    currentTarget: Vec3,
    currentFov: number,
    callbacks?: TransitionCallbacks
  ): AnimationHandle | null {
    const sourceMode = this.lastProjectionMode ?? ProjectionMode.PLANE;

    if (sourceMode === targetMode) return null;

    this.cancelTransition();

    const { config: sceneConfig } = useSceneStore.getState();
    const fromSnapshot = captureSnapshot({
      cameraMode: sceneConfig.cameraMode,
      projectionMode: sourceMode,
    });

    fromSnapshot.position = { ...currentPosition };
    fromSnapshot.target = { ...currentTarget };
    fromSnapshot.fov = currentFov;

    const preset = getPresetForProjection(targetMode);
    const toSnapshot = this.calculateTargetSnapshot(
      fromSnapshot,
      preset,
      targetMode,
      sceneConfig.cameraMode
    );

    const transitionConfig = getTransitionConfig(sourceMode, targetMode);

    this.activeTransition = this.executeTransition(
      fromSnapshot,
      toSnapshot,
      transitionConfig,
      callbacks
    );

    this.lastProjectionMode = targetMode;

    getEventBus().emit('camera:transition-started', {
      from: sourceMode,
      to: targetMode,
      duration: transitionConfig.duration,
    });

    return this.activeTransition;
  }

  /**
   * 执行透视-正交平滑切换动画（阶段二增强功能）
   * @param fromMode - 源相机模式
   * @param toMode - 目标相机模式
   * @param fromCamera - 源相机实例（PerspectiveCamera | OrthographicCamera）
   * @param toCamera - 目标相机实例
   * @param controls - OrbitControls实例
   * @param callbacks - 回调函数
   * @returns 动画句柄
   */
  transitionProjectionMode(
    fromMode: CameraMode,
    toMode: CameraMode,
    fromCamera: PerspectiveCamera | OrthographicCamera,
    toCamera: PerspectiveCamera | OrthographicCamera,
    controls: OrbitControlsType,
    callbacks?: TransitionCallbacks & {
      onProgress?: (progress: number, state: { fov?: number; zoom?: number }) => void;
    }
  ): AnimationHandle | null {
    if (fromMode === toMode) return null;

    this.cancelTransition();

    const startPosition = fromCamera.position.clone();
    const startTarget = controls.target.clone();
    const startUp = fromCamera.up.clone();
    const distance = startPosition.distanceTo(startTarget);

    // 计算同步参数
    const currentValue =
      fromMode === CameraMode.PERSPECTIVE
        ? (fromCamera as PerspectiveCamera).fov
        : (fromCamera as OrthographicCamera).zoom;

    const syncResult = calculateCameraSync(
      fromMode === CameraMode.PERSPECTIVE ? 'perspective' : 'orthographic',
      currentValue,
      distance
    );

    // 发射过渡开始事件
    getEventBus().emit('camera:projection-transition-start', {
      from: fromMode,
      to: toMode,
      duration: 600,
    });

    const scheduler = getAnimationScheduler();

    callbacks?.onStart?.();

    this.activeTransition = scheduler.animate(0, 1, {
      duration: 600,
      easing: 'ease-in-out-cubic',
      onUpdate: (progress) => {
        // 插值位置
        toCamera.position.lerpVectors(startPosition, startPosition, progress);
        toCamera.up.lerpVectors(startUp, startUp, progress);
        controls.target.lerpVectors(startTarget, startTarget, progress);

        // 插值FOV/Zoom
        if (toMode === CameraMode.ORTHOGRAPHIC) {
          (toCamera as OrthographicCamera).zoom = lerp(
            currentValue,
            syncResult.orthoZoom,
            this.easeInOutCubic(progress)
          );
        } else {
          (toCamera as PerspectiveCamera).fov = lerp(
            currentValue,
            syncResult.perspectiveFov,
            this.easeInOutCubic(progress)
          );
        }

        toCamera.updateProjectionMatrix();
        controls.update();

        // 发射进度事件
        getEventBus().emit('camera:projection-transition-update', {
          progress,
          from: fromMode,
          to: toMode,
        });

        callbacks?.onProgress?.(progress, {
          ...(toMode === CameraMode.PERSPECTIVE ? { fov: syncResult.perspectiveFov } : {}),
          ...(toMode === CameraMode.ORTHOGRAPHIC ? { zoom: syncResult.orthoZoom } : {}),
        });
      },
      onComplete: () => {
        this.activeTransition = null;

        // 发射完成事件
        getEventBus().emit('camera:projection-transition-complete', {
          mode: toMode,
          restoredSettings: {
            fov: toMode === CameraMode.PERSPECTIVE ? syncResult.perspectiveFov : undefined,
            zoom: toMode === CameraMode.ORTHOGRAPHIC ? syncResult.orthoZoom : undefined,
          },
        });

        callbacks?.onComplete?.();
        logger.info(`投影模式切换完成: ${fromMode} -> ${toMode}`);
      },
    });

    return this.activeTransition;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }
}

// 线性插值辅助函数
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export { CameraTransitionServiceImpl as CameraTransitionService };
