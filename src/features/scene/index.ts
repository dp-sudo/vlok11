import { createLogger } from '@/core/Logger';

import type { LifecycleAware } from '@/core/LifecycleManager';

const logger = createLogger({ module: 'SceneModule' });

export const getSceneModule = (): SceneModuleImpl => {
  sceneModuleInstance ??= new SceneModuleImpl();

  return sceneModuleInstance;
};
export const resetSceneModule = (): void => {
  sceneModuleInstance = null;
};

let sceneModuleInstance: SceneModuleImpl | null = null;

class SceneModuleImpl implements LifecycleAware {
  readonly dependencies: string[] = ['ai-service'];
  private initialized = false;
  readonly serviceId = 'scene-module';

  async destroy(): Promise<void> {
    if (!this.initialized) return;

    this.initialized = false;
    logger.info('SceneModule destroyed');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.initialized = true;
    logger.info('SceneModule initialized');
  }
}

export { SceneViewer } from './SceneViewer';
export type { SceneViewerHandle } from './SceneViewer';
