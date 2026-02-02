import type { Camera } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { getEventBus } from '@/core/EventBus';
import type { LifecycleAware } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';
import { getAnimationScheduler } from '@/features/scene/services/camera/AnimationScheduler';
import { ANIMATION_DURATION, DEFAULT_ANIMATION_DURATION } from '@/shared/constants';
import { CAMERA_ANIMATION, CAMERA_LIMITS } from '@/shared/constants/camera';
import type {
  AnimationHandle,
  CameraBookmark,
  CameraPose,
  CameraPreset,
  CameraService as CameraServiceType,
  ProjectionType,
  TransitionOptions,
  Vec3,
} from '@/shared/types';
import { lerpVec3 } from '@/shared/utils';
import { useCameraPoseStore } from '@/stores/cameraStore';
import { type CameraPresetType, calculateDistance, calculatePresetPose } from './CameraPresets';
import {
  calculateOrthoPresetPose,
  emitOrthoPresetApplied,
  type OrthoViewPresetType,
} from './OrthographicPresets';
import { getPrecisionConfigService, type PrecisionControlConfig } from './PrecisionConfigService';

const logger = createLogger({ module: 'CameraService' });

let cameraServiceInstance: CameraServiceImpl | null = null;

export class CameraServiceImpl implements CameraServiceType, LifecycleAware {
  private _isInitialized = false;
  private animationId: AnimationHandle | null = null;

  readonly dependencies: string[] = [];

  private projectionMode: ProjectionType = 'perspective';
  readonly serviceId = 'CameraService';

  static getInstance(): CameraServiceImpl {
    cameraServiceInstance ??= new CameraServiceImpl();

    return cameraServiceInstance;
  }

  static resetInstance(): void {
    cameraServiceInstance = null;
  }

  private animatePose(from: CameraPose, to: Partial<CameraPose>, options: TransitionOptions): void {
    const scheduler = getAnimationScheduler();
    const eventBus = getEventBus();
    const targetPose: CameraPose = {
      ...from,
      ...to,
      position: to.position ? { ...from.position, ...to.position } : from.position,
      target: to.target ? { ...from.target, ...to.target } : from.target,
      up: to.up ? { ...from.up, ...to.up } : from.up,
    };

    if (this.animationId) {
      scheduler.cancel(this.animationId);
    }

    this.animationId = scheduler.animate(0, 1, {
      duration: options.duration ?? ANIMATION_DURATION.DEFAULT,
      easing: options.easing ?? 'ease-out-cubic',
      onUpdate: (progress) => {
        const interpolated = this.interpolatePose(from, targetPose, progress);

        this.store.setPose(interpolated, 'motion');
        options.onUpdate?.(progress);

        eventBus.emit('camera:pose-animating', {
          currentPose: interpolated,
          targetPose,
          progress,
        });
      },
      onComplete: () => {
        this.animationId = null;
        this.store.setPose(targetPose, 'preset');

        eventBus.emit('camera:pose-changed', {
          pose: targetPose,
          previousPose: from,
          source: 'animation',
        });

        options.onComplete?.();
      },
    });
  }

  async applyPreset(preset: CameraPreset): Promise<void> {
    const currentPose = this.getPose();
    const currentDist = calculateDistance(currentPose.position, currentPose.target);
    const presetPose = calculatePresetPose(preset as CameraPresetType, currentDist);

    return new Promise((resolve) => {
      this.setPose(presetPose, {
        duration: CAMERA_ANIMATION.PRESET,
        easing: 'ease-in-out-cubic',
        onComplete: () => {
          getEventBus().emit('camera:preset-applied', { preset, pose: this.getPose() });
          resolve();
        },
      });
    });
  }

  canRedo(): boolean {
    return false;
  }

  canUndo(): boolean {
    return this.store.history.length > 1;
  }

  deleteBookmark(id: string): void {
    this.store.removeBookmark(id);
    getEventBus().emit('camera:bookmark-deleted', { bookmarkId: id });
  }

  async destroy(): Promise<void> {
    logger.info('Destroying');
    this._isInitialized = false;
  }

  private emitHistoryChanged(): void {
    getEventBus().emit('camera:history-changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.store.history.length,
    });
  }

  getBookmarks(): CameraBookmark[] {
    return this.store.bookmarks.map((b) => ({
      id: b.id,
      name: b.name,
      pose: { ...b.pose, near: CAMERA_LIMITS.NEAR, far: CAMERA_LIMITS.FAR },
      createdAt: b.createdAt,
    }));
  }

  getPose(): CameraPose {
    const { pose } = this.store;

    return {
      position: { ...pose.position },
      target: { ...pose.target },
      up: { ...pose.up },
      fov: pose.fov,
      near: CAMERA_LIMITS.NEAR,
      far: CAMERA_LIMITS.FAR,
    };
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;
    logger.info('Initializing');
    this._isInitialized = true;
  }

  private interpolatePose(from: CameraPose, to: CameraPose, t: number): CameraPose {
    return {
      position: lerpVec3(from.position, to.position, t),
      target: lerpVec3(from.target, to.target, t),
      up: lerpVec3(from.up, to.up, t),
      fov: from.fov + (to.fov - from.fov) * t,
      near: from.near,
      far: from.far,
    };
  }

  async loadBookmark(id: string): Promise<void> {
    const bookmark = this.store.bookmarks.find((b) => b.id === id);

    if (!bookmark) return;

    return new Promise((resolve) => {
      this.setPose(bookmark.pose, {
        duration: CAMERA_ANIMATION.BOOKMARK,
        easing: 'ease-in-out-cubic',
        onComplete: () => {
          getEventBus().emit('camera:bookmark-loaded', { bookmark });
          resolve();
        },
      });
    });
  }

  async lookAt(target: Vec3, duration = DEFAULT_ANIMATION_DURATION): Promise<void> {
    return new Promise((resolve) => {
      this.setPose(
        { target },
        {
          duration,
          easing: 'ease-out-cubic',
          onComplete: resolve,
        }
      );
    });
  }

  async moveTo(position: Vec3, duration = DEFAULT_ANIMATION_DURATION): Promise<void> {
    return new Promise((resolve) => {
      this.setPose(
        { position },
        {
          duration,
          easing: 'ease-out-cubic',
          onComplete: resolve,
        }
      );
    });
  }

  redo(): void {}

  saveBookmark(name: string): string {
    this.store.addBookmark(name);
    const { bookmarks } = this.store;
    const bookmark = bookmarks[bookmarks.length - 1];

    if (bookmark) {
      getEventBus().emit('camera:bookmark-saved', { bookmark });

      return bookmark.id;
    }

    return '';
  }

  async setFov(fov: number, duration = ANIMATION_DURATION.FOV): Promise<void> {
    const precisionConfig = this.getPrecisionConfig();

    // 应用FOV范围限制
    const clampedFov = Math.max(
      precisionConfig.fovRange.min,
      Math.min(precisionConfig.fovRange.max, fov)
    );

    // 应用细粒度步进
    const steppedFov = Math.round(clampedFov / precisionConfig.fovStep) * precisionConfig.fovStep;

    return new Promise((resolve) => {
      this.setPose(
        { fov: steppedFov },
        {
          duration,
          easing: 'ease-out-cubic',
          onComplete: resolve,
        }
      );
    });
  }

  setPose(newPose: Partial<CameraPose>, options?: TransitionOptions): void {
    const previousPose = this.getPose();

    if (options?.duration && options.duration > 0) {
      this.animatePose(previousPose, newPose, options);
    } else {
      this.store.setPose(newPose, 'user');
      getEventBus().emit('camera:pose-changed', {
        pose: this.getPose(),
        previousPose,
        source: 'user',
      });
    }
  }

  setProjection(mode: ProjectionType): void {
    const previousMode = this.projectionMode;

    this.projectionMode = mode;
    getEventBus().emit('camera:projection-changed', { mode, previousMode });
  }

  /**
   * 应用正交视图预设
   * @param presetType - 正交视图预设类型
   * @param duration - 动画持续时间(ms)
   */
  async applyOrthoPreset(
    presetType: OrthoViewPresetType,
    duration = CAMERA_ANIMATION.PRESET
  ): Promise<void> {
    const result = calculateOrthoPresetPose(presetType, {
      useDefaultZoom: false,
      currentZoom: this.store.orthoZoomMemory,
    });

    if (!result) {
      logger.warn(`应用正交预设失败: ${presetType}`);

      return;
    }

    const previousPreset = this.store.currentOrthoPreset;

    return new Promise((resolve) => {
      this.setPose(
        {
          position: result.position,
          target: result.target,
          up: result.up,
        },
        {
          duration,
          easing: 'ease-in-out-cubic',
          onComplete: () => {
            this.store.setCurrentOrthoPreset(presetType);
            emitOrthoPresetApplied(
              presetType,
              previousPreset as OrthoViewPresetType | null,
              {
                position: result.position,
                target: result.target,
                up: result.up,
              },
              result.zoom
            );
            resolve();
          },
        }
      );
    });
  }

  /**
   * 切换到正交模式并应用预设
   * @param camera - Three.js相机
   * @param controls - OrbitControls
   * @param presetType - 正交视图预设类型
   */
  async switchToOrthoWithPreset(
    _camera: Camera,
    _controls: OrbitControlsType,
    presetType: OrthoViewPresetType
  ): Promise<void> {
    // 如果当前不是正交模式，先保存当前设置
    if (this.projectionMode !== 'orthographic') {
      const currentFov = this.store.pose.fov;

      this.store.saveCameraModeSettings('perspective', currentFov);
    }

    // 应用正交预设
    await this.applyOrthoPreset(presetType);

    // 切换到正交投影
    this.setProjection('orthographic');

    logger.info(`切换到正交模式并应用预设: ${presetType}`);
  }

  private get store() {
    return useCameraPoseStore.getState();
  }

  syncFromThree(camera: Camera, controls: OrbitControlsType): void {
    const threeCamera = camera as THREE.PerspectiveCamera;

    this.store.setPose(
      {
        position: {
          x: threeCamera.position.x,
          y: threeCamera.position.y,
          z: threeCamera.position.z,
        },
        target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
        up: { x: threeCamera.up.x, y: threeCamera.up.y, z: threeCamera.up.z },
        fov: threeCamera.fov,
      },
      'user'
    );
  }

  syncToThree(camera: Camera, controls: OrbitControlsType): void {
    const pose = this.getPose();
    const threeCamera = camera as THREE.PerspectiveCamera;

    threeCamera.position.set(pose.position.x, pose.position.y, pose.position.z);
    controls.target.set(pose.target.x, pose.target.y, pose.target.z);
    threeCamera.up.set(pose.up.x, pose.up.y, pose.up.z);

    if (pose.fov !== undefined) {
      threeCamera.fov = pose.fov;
      threeCamera.updateProjectionMatrix();
    }

    controls.update();
  }

  undo(): void {
    this.store.undo();
    this.emitHistoryChanged();
  }

  // 精度控制方法
  getPrecisionConfig(): PrecisionControlConfig {
    return getPrecisionConfigService().getConfig();
  }

  setPrecisionConfig(config: Partial<PrecisionControlConfig>): void {
    getPrecisionConfigService().setConfig(config);
    getEventBus().emit('camera:precision-config-changed', { config: this.getPrecisionConfig() });
  }

  applyPrecisionPreset(presetId: string): void {
    getPrecisionConfigService().applyPreset(presetId);
    getEventBus().emit('camera:precision-preset-applied', { presetId });
  }

  resetPrecisionConfig(): void {
    getPrecisionConfigService().reset();
    getEventBus().emit('camera:precision-config-reset', {});
  }
}

export function getCameraService(): CameraServiceType {
  return CameraServiceImpl.getInstance();
}

export { CameraServiceImpl as CameraService };

declare namespace THREE {
  interface PerspectiveCamera extends Camera {
    far: number;
    fov: number;
    near: number;
    updateProjectionMatrix(): void;
  }
}
