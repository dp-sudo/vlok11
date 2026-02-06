import { createLogger } from '@/core/Logger';
import type { Disposable } from '@/shared/types';
import { generateUUID } from '@/shared/utils/uuid';

export interface WorkerTask<T = unknown> {
  id: string;
  payload: T;
  transfer?: Transferable[];
  type: string;
}

export interface WorkerResponse<R = unknown> {
  error?: string;
  id: string;
  payload?: R;
  success: boolean;
}

const logger = createLogger({ module: 'WorkerManager' });

const FALLBACK_POOL_SIZE = 4;
const DEFAULT_POOL_SIZE =
  typeof navigator !== 'undefined'
    ? navigator.hardwareConcurrency || FALLBACK_POOL_SIZE
    : FALLBACK_POOL_SIZE;

let workerManagerInstance: WorkerManager | null = null;

export class WorkerManager implements Disposable {
  private pendingTasks = new Map<
    string,
    { reject: (reason: unknown) => void; resolve: (value: unknown) => void }
  >();
  private poolSize: number;
  private workerPools = new Map<string, Worker[]>();
  private workerRoundRobin = new Map<string, number>();
  private disposed = false;

  constructor(poolSize: number = DEFAULT_POOL_SIZE) {
    this.poolSize = poolSize;
  }

  static getInstance(): WorkerManager {
    workerManagerInstance ??= new WorkerManager();

    return workerManagerInstance;
  }

  private createWorker(name: string): Worker {
    const workerUrl = new URL(`./${name}.worker.ts`, import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, success, payload, error } = event.data;
      const task = this.pendingTasks.get(id);

      if (task) {
        if (success) {
          task.resolve(payload);
        } else {
          task.reject(new Error(error));
        }
        this.pendingTasks.delete(id);
      }
    };

    worker.onerror = (error) => {
      logger.error(`Worker error in ${name}`, { error: String(error) });
    };

    return worker;
  }

  async dispose(): Promise<void> {
    if (this.disposed) {
      logger.warn('WorkerManager already disposed');
      return;
    }

    this.disposed = true;
    const errors: Error[] = [];

    for (const [name, pool] of this.workerPools) {
      for (const worker of pool) {
        try {
          worker.terminate();
        } catch (error) {
          errors.push(error as Error);
        }
      }
      logger.info(`Terminated ${pool.length} workers for: ${name}`);
    }

    this.workerPools.clear();
    this.pendingTasks.clear();
    workerManagerInstance = null;

    if (errors.length > 0) {
      logger.error('Some workers failed to terminate', { errors });
    }

    logger.info('WorkerManager disposed');
  }

  execute<T, R>(
    workerName: string,
    taskType: string,
    payload: T,
    transfer?: Transferable[]
  ): Promise<R> {
    if (this.disposed) {
      return Promise.reject(new Error('WorkerManager has been disposed'));
    }

    const taskId = generateUUID();

    return new Promise<R>((resolve, reject) => {
      this.pendingTasks.set(taskId, { resolve: resolve as (v: unknown) => void, reject });

      const message: WorkerTask<T> = {
        id: taskId,
        payload,
        ...(transfer ? { transfer } : {}),
        type: taskType,
      };

      const worker = this.getNextWorker(workerName);

      try {
        worker.postMessage(message, transfer ?? []);
      } catch (error) {
        this.pendingTasks.delete(taskId);
        reject(error);
      }
    });
  }

  private getNextWorker(name: string): Worker {
    if (!this.workerPools.has(name)) {
      this.warmupPool(name);
    }

    const pool = this.workerPools.get(name)!;
    const currentIndex = this.workerRoundRobin.get(name) ?? 0;
    const worker = pool[currentIndex % pool.length]!;

    this.workerRoundRobin.set(name, currentIndex + 1);

    return worker;
  }

  warmupPool(name: string): void {
    if (this.workerPools.has(name)) {
      return;
    }

    const pool: Worker[] = [];

    try {
      for (let i = 0; i < this.poolSize; i++) {
        const worker = this.createWorker(name);
        pool.push(worker);
      }
    } catch (error) {
      // 清理已创建的 worker
      pool.forEach((w) => w.terminate());
      logger.error(`Failed to warm up pool for ${name}`, { error });
      throw error;
    }

    this.workerPools.set(name, pool);
    this.workerRoundRobin.set(name, 0);
    logger.info(`Warmed up pool for ${name} with ${this.poolSize} workers`);
  }

  /** 获取指定 worker pool 的状态信息 */
  getPoolStatus(name: string): { workerCount: number; pendingTasks: number } | null {
    const pool = this.workerPools.get(name);
    if (!pool) return null;

    return {
      workerCount: pool.length,
      pendingTasks: this.pendingTasks.size,
    };
  }
}

export function getWorkerManager(): WorkerManager {
  return WorkerManager.getInstance();
}
