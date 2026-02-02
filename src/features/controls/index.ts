import type { LifecycleAware } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';

const logger = createLogger({ module: 'ControlsModule' });

export const getControlsModule = (): ControlsModuleImpl => {
  controlsModuleInstance ??= new ControlsModuleImpl();

  return controlsModuleInstance;
};
export const resetControlsModule = (): void => {
  controlsModuleInstance = null;
};

let controlsModuleInstance: ControlsModuleImpl | null = null;

class ControlsModuleImpl implements LifecycleAware {
  readonly dependencies: string[] = [];
  private initialized = false;
  readonly serviceId = 'controls-module';

  async destroy(): Promise<void> {
    if (!this.initialized) return;

    this.initialized = false;
    logger.info('ControlsModule destroyed');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.initialized = true;
    logger.info('ControlsModule initialized');
  }
}

export { ControlPanel } from './ControlPanel';
