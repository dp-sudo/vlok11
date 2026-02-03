/**
 * Resource Manager
 *
 * Centralized resource lifecycle management to prevent memory leaks.
 * Tracks disposables and provides cleanup mechanisms.
 */

import { createLogger } from '@/core/Logger';

const logger = createLogger({ module: 'ResourceManager' });

export type CleanupFunction = () => void;

export class ResourceManager {
  private disposables: Set<CleanupFunction> = new Set();
  private namedResources: Map<string, CleanupFunction> = new Map();
  private isDisposed = false;

  /**
   * Register a cleanup function
   * @returns Unregister function
   */
  add(cleanup: CleanupFunction): () => void {
    if (this.isDisposed) {
      logger.warn('Attempting to add resource to already disposed manager');
      cleanup();

      return () => {};
    }

    this.disposables.add(cleanup);

    return () => {
      cleanup();
      this.disposables.delete(cleanup);
    };
  }

  /**
   * Register a named resource for easy tracking
   */
  addNamed(name: string, cleanup: CleanupFunction): void {
    if (this.isDisposed) {
      logger.warn(`Attempting to add named resource "${name}" to already disposed manager`);
      cleanup();

      return;
    }

    // Clean up existing resource with same name
    if (this.namedResources.has(name)) {
      logger.warn(`Resource "${name}" already exists, cleaning up old instance`);
      this.namedResources.get(name)?.();
    }

    this.namedResources.set(name, cleanup);
  }

  /**
   * Register event listener with automatic cleanup
   */
  addEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(event, handler, options);

    this.add(() => {
      target.removeEventListener(event, handler, options);
    });
  }

  /**
   * Register setTimeout/setInterval with automatic cleanup
   */
  addTimeout(handler: TimerHandler, timeout: number): number {
    const id = window.setTimeout(handler, timeout);

    this.add(() => {
      window.clearTimeout(id);
    });

    return id;
  }

  addInterval(handler: TimerHandler, interval: number): number {
    const id = window.setInterval(handler, interval);

    this.add(() => {
      window.clearInterval(id);
    });

    return id;
  }

  /**
   * Dispose a specific named resource
   */
  disposeNamed(name: string): boolean {
    const cleanup = this.namedResources.get(name);

    if (cleanup) {
      cleanup();
      this.namedResources.delete(name);
      logger.debug(`Disposed resource: ${name}`);

      return true;
    }

    return false;
  }

  /**
   * Dispose all registered resources
   */
  disposeAll(): void {
    if (this.isDisposed) {
      return;
    }

    logger.info(
      `Disposing ${this.disposables.size} resources and ${this.namedResources.size} named resources`
    );

    // Dispose named resources first
    for (const [name, cleanup] of this.namedResources) {
      try {
        cleanup();
        logger.debug(`Disposed named resource: ${name}`);
      } catch (error) {
        logger.error(`Failed to dispose named resource "${name}"`, { error });
      }
    }
    this.namedResources.clear();

    // Dispose anonymous resources
    for (const cleanup of this.disposables) {
      try {
        cleanup();
      } catch (error) {
        logger.error('Failed to dispose resource', { error });
      }
    }
    this.disposables.clear();

    this.isDisposed = true;
    logger.info('All resources disposed');
  }

  /**
   * Check if manager has been disposed
   */
  get disposed(): boolean {
    return this.isDisposed;
  }

  /**
   * Get count of registered resources
   */
  get resourceCount(): number {
    return this.disposables.size + this.namedResources.size;
  }
}

/**
 * Global resource manager for application-level resources
 */
let globalResourceManager: ResourceManager | null = null;

export function getGlobalResourceManager(): ResourceManager {
  globalResourceManager ??= new ResourceManager();

  return globalResourceManager;
}

export function resetGlobalResourceManager(): void {
  if (globalResourceManager) {
    globalResourceManager.disposeAll();
    globalResourceManager = null;
  }
}

/**
 * Hook for React components to use resource manager
 */
export function useResourceManager(): ResourceManager {
  const manager = new ResourceManager();

  // Auto-cleanup on component unmount would need React integration
  // For now, manual cleanup is required

  return manager;
}
