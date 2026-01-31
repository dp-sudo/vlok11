import { getEventBus } from './EventBus';
import { SystemEvents } from './EventTypes';
import { createLogger } from './Logger';

export interface LifecycleAware {
  readonly dependencies?: string[];
  destroy(): Promise<void>;
  initialize(): Promise<void>;
  pause?(): void;
  resume?(): void;
  readonly serviceId: string;
}
export interface LifecycleManagerOptions {
  continueOnError?: boolean;
  initTimeout?: number;
}
interface ServiceMetadata {
  initDuration?: number;
  initOrder: number;
  service: LifecycleAware;
  state: LifecycleState;
}

export enum LifecycleState {
  DESTROYED = 'destroyed',
  DESTROYING = 'destroying',
  INITIALIZING = 'initializing',
  PAUSED = 'paused',
  READY = 'ready',
  UNINITIALIZED = 'uninitialized',
}

const DEFAULT_INIT_TIMEOUT = 30000;

export const getLifecycleManager = (): LifecycleManagerImpl => LifecycleManagerImpl.getInstance();
const logger = createLogger({ module: 'LifecycleManager' });

export const resetLifecycleManager = (): void => {
  LifecycleManagerImpl.resetInstance();
};

class LifecycleManagerImpl {
  private static instance: LifecycleManagerImpl | null = null;
  private initStartTime = 0;
  private options: Required<LifecycleManagerOptions>;
  private services = new Map<string, ServiceMetadata>();
  private state: LifecycleState = LifecycleState.UNINITIALIZED;

  private constructor(options: LifecycleManagerOptions = {}) {
    this.options = {
      initTimeout: options.initTimeout ?? DEFAULT_INIT_TIMEOUT,
      continueOnError: options.continueOnError ?? false,
    };
  }

  static getInstance(options?: LifecycleManagerOptions): LifecycleManagerImpl {
    LifecycleManagerImpl.instance ??= new LifecycleManagerImpl(options);

    return LifecycleManagerImpl.instance;
  }

  static resetInstance(): void {
    if (LifecycleManagerImpl.instance) {
      LifecycleManagerImpl.instance.services.clear();
      LifecycleManagerImpl.instance.state = LifecycleState.UNINITIALIZED;
    }
    LifecycleManagerImpl.instance = null;
  }

  private calculateInitOrder(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const path: string[] = [];

    const visit = (serviceId: string): void => {
      if (visited.has(serviceId)) {
        return;
      }
      if (visiting.has(serviceId)) {
        const cycleStart = path.indexOf(serviceId);
        const cyclePath = [...path.slice(cycleStart), serviceId].join(' -> ');

        throw new Error(
          `[LifecycleManager] Circular dependency detected!\n` +
            `  Cycle: ${cyclePath}\n` +
            `  Service "${serviceId}" depends on itself through: ${path.slice(cycleStart).join(' -> ')}`
        );
      }

      const metadata = this.services.get(serviceId);

      if (!metadata) {
        return;
      }

      visiting.add(serviceId);
      path.push(serviceId);

      const deps = metadata.service.dependencies ?? [];

      for (const dep of deps) {
        if (!this.services.has(dep)) {
          logger.warn(`Missing dependency: ${dep} for ${serviceId}. Skipping.`);
          continue;
        }
        visit(dep);
      }

      path.pop();
      visiting.delete(serviceId);
      visited.add(serviceId);
      result.push(serviceId);
    };

    for (const serviceId of this.services.keys()) {
      visit(serviceId);
    }

    return result;
  }

  async destroyAll(): Promise<void> {
    if (this.state === LifecycleState.DESTROYED || this.state === LifecycleState.DESTROYING) {
      return;
    }

    this.state = LifecycleState.DESTROYING;

    const sortedServices = [...this.services.entries()]
      .filter(([, meta]) => meta.initOrder >= 0)
      .sort((a, b) => b[1].initOrder - a[1].initOrder);

    for (const [serviceId, metadata] of sortedServices) {
      try {
        metadata.state = LifecycleState.DESTROYING;
        await metadata.service.destroy();
        metadata.state = LifecycleState.DESTROYED;

        getEventBus().emit('lifecycle:service:destroyed', { serviceId });
      } catch (error) {
        logger.error(`Error destroying ${serviceId}`, { error: String(error) });
      }
    }

    this.state = LifecycleState.DESTROYED;
  }

  getServiceState(serviceId: string): LifecycleState | undefined {
    return this.services.get(serviceId)?.state;
  }

  getState(): LifecycleState {
    return this.state;
  }

  async initializeAll(): Promise<void> {
    if (this.state !== LifecycleState.UNINITIALIZED) {
      logger.warn('Already initialized or initializing');

      return;
    }

    this.state = LifecycleState.INITIALIZING;
    this.initStartTime = Date.now();

    try {
      const order = this.calculateInitOrder();

      for (let i = 0; i < order.length; i++) {
        const serviceId = order[i];

        if (!serviceId) {
          continue;
        }
        const metadata = this.services.get(serviceId);

        if (!metadata) {
          continue;
        }

        metadata.state = LifecycleState.INITIALIZING;
        const serviceStartTime = Date.now();

        try {
          await this.initializeWithTimeout(metadata.service, serviceId);
          metadata.initDuration = Date.now() - serviceStartTime;
          metadata.state = LifecycleState.READY;
          metadata.initOrder = i;

          getEventBus().emit('lifecycle:service:initialized', { serviceId });
        } catch (error) {
          metadata.state = LifecycleState.DESTROYED;
          const errorMsg = error instanceof Error ? error.message : String(error);

          getEventBus().emit(SystemEvents.ERROR, {
            error: error instanceof Error ? error : new Error(errorMsg),
            context: `LifecycleManager.initializeAll(${serviceId})`,
            recoverable: this.options.continueOnError,
          });

          if (!this.options.continueOnError) {
            throw error;
          }
          logger.error(`Service ${serviceId} failed to initialize, continuing...`, {
            error: errorMsg,
          });
        }
      }

      this.state = LifecycleState.READY;

      const initTime = Date.now() - this.initStartTime;

      getEventBus().emit('lifecycle:app:ready', { initTime });
    } catch (error) {
      logger.error('Initialization failed', { error: String(error) });
      this.state = LifecycleState.UNINITIALIZED;
      throw error;
    }
  }

  private async initializeWithTimeout(service: LifecycleAware, serviceId: string): Promise<void> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Service ${serviceId} initialization timed out after ${this.options.initTimeout}ms`
          )
        );
      }, this.options.initTimeout);
    });

    try {
      await Promise.race([service.initialize(), timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  isServiceReady(serviceId: string): boolean {
    return this.services.get(serviceId)?.state === LifecycleState.READY;
  }

  pause(): void {
    if (this.state !== LifecycleState.READY) {
      return;
    }

    for (const [, metadata] of this.services) {
      if (metadata.service.pause) {
        metadata.service.pause();
      }
    }

    this.state = LifecycleState.PAUSED;
    getEventBus().emit('lifecycle:app:paused', undefined);
  }

  register(service: LifecycleAware): void {
    if (this.services.has(service.serviceId)) {
      logger.warn(`Service ${service.serviceId} already registered`);

      return;
    }

    this.services.set(service.serviceId, {
      service,
      state: LifecycleState.UNINITIALIZED,
      initOrder: -1,
    });
  }

  resume(): void {
    if (this.state !== LifecycleState.PAUSED) {
      return;
    }

    for (const [, metadata] of this.services) {
      if (metadata.service.resume) {
        metadata.service.resume();
      }
    }

    this.state = LifecycleState.READY;
    getEventBus().emit('lifecycle:app:resumed', undefined);
  }

  unregister(serviceId: string): void {
    this.services.delete(serviceId);
  }
}

export { LifecycleManagerImpl as LifecycleManager };
