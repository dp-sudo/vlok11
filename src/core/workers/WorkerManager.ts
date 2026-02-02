import { generateUUID } from '@/shared/utils/uuid';
import { createLogger } from '@/core/Logger';

import type { Disposable } from '@/shared/types';

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
    for (const [name, pool] of this.workerPools) {
      for (const worker of pool) {
        worker.terminate();
      }
      logger.info(`Terminated ${pool.length} workers for: ${name}`);
    }
    this.workerPools.clear();
    this.pendingTasks.clear();
  }

  execute<T, R>(
    workerName: string,
    taskType: string,
    payload: T,
    transfer?: Transferable[]
  ): Promise<R> {
    const taskId = generateUUID();

    return new Promise<R>((resolve, reject) => {
      this.pendingTasks.set(taskId, { resolve: resolve as (v: unknown) => void, reject });

      const message: WorkerTask<T> = {
        id: taskId,
        payload,
        transfer,
        type: taskType,
      };

      const worker = this.getNextWorker(workerName);

      worker.postMessage(message, transfer ?? []);
    });
  }

  private getNextWorker(name: string): Worker {
    if (!this.workerPools.has(name)) {
      this.warmupPool(name);
    }

    const pool = this.workerPools.get(name)!;
    const currentIndex = this.workerRoundRobin.get(name) ?? 0;
    const worker = pool[currentIndex % pool.length];

    this.workerRoundRobin.set(name, currentIndex + 1);

    return worker;
  }

  warmupPool(name: string): void {
    if (this.workerPools.has(name)) {
      return;
    }

    const pool: Worker[] = [];

    for (let i = 0; i < this.poolSize; i++) {
      pool.push(this.createWorker(name));
    }
    this.workerPools.set(name, pool);
    this.workerRoundRobin.set(name, 0);
    logger.info(`Warmed up pool for ${name} with ${this.poolSize} workers`);
  }
}

export function getWorkerManager(): WorkerManager {
  return WorkerManager.getInstance();
}
