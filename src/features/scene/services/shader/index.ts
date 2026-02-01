import type { LifecycleAware } from '@/core/LifecycleManager';
import { createLogger } from '@/core/Logger';

const logger = createLogger({ module: 'ShaderService' });

export const getShaderService = (): ShaderServiceImpl => {
  instance ??= new ShaderServiceImpl();

  return instance;
};
export const resetShaderService = (): void => {
  instance = null;
};

let instance: ShaderServiceImpl | null = null;

class ShaderServiceImpl implements LifecycleAware {
  readonly dependencies: string[] = [];
  private initialized = false;
  readonly serviceId = 'shader-service';

  async destroy(): Promise<void> {
    if (!this.initialized) return;

    this.initialized = false;
    logger.info('ShaderService destroyed');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.initialized = true;
    logger.info('ShaderService initialized');
  }
}

export { ShaderServiceImpl as ShaderService };
