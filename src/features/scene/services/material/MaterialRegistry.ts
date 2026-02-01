import type { Material } from 'three';
import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import type { RenderStyle } from '@/shared/types';

interface MaterialEntry {
  createdAt: number;
  id: string;
  lastUsed: number;
  material: Material;
  refCount: number;
  style: RenderStyle;
}

export const getMaterialRegistry = (): MaterialRegistryImpl => MaterialRegistryImpl.getInstance();
const logger = createLogger({ module: 'MaterialRegistry' });

class MaterialRegistryImpl {
  private static instance: MaterialRegistryImpl | null = null;
  private idCounter = 0;
  private materials: Map<string, MaterialEntry> = new Map();

  private constructor() {}

  static getInstance(): MaterialRegistryImpl {
    MaterialRegistryImpl.instance ??= new MaterialRegistryImpl();

    return MaterialRegistryImpl.instance;
  }

  acquire(id: string): Material | undefined {
    const entry = this.materials.get(id);

    if (entry) {
      entry.refCount++;
      entry.lastUsed = Date.now();

      return entry.material;
    }

    return undefined;
  }

  dispose(id: string): void {
    const entry = this.materials.get(id);

    if (entry) {
      entry.material.dispose();
      this.materials.delete(id);
      getEventBus().emit('material:disposed', { id, style: entry.style });
      logger.debug(`Disposed material: ${id}`);
    }
  }

  disposeAll(): void {
    for (const [id, entry] of this.materials) {
      entry.material.dispose();
      logger.debug(`Disposed material: ${id}`);
    }

    this.materials.clear();
    logger.info('Disposed all materials');
  }

  disposeUnused(maxAgeMs = 60000): number {
    const now = Date.now();
    let disposed = 0;

    for (const [id, entry] of this.materials) {
      if (entry.refCount <= 0 && now - entry.lastUsed > maxAgeMs) {
        entry.material.dispose();
        this.materials.delete(id);
        disposed++;
      }
    }

    if (disposed > 0) {
      logger.info(`Disposed ${disposed} unused materials`);
    }

    return disposed;
  }

  get(id: string): Material | undefined {
    const entry = this.materials.get(id);

    if (entry) {
      entry.lastUsed = Date.now();

      return entry.material;
    }

    return undefined;
  }

  getByStyle(style: RenderStyle): MaterialEntry[] {
    return Array.from(this.materials.values()).filter((e) => e.style === style);
  }

  getStats(): {
    byStyle: Record<string, number>;
    total: number;
    totalRefCount: number;
  } {
    const byStyle: Record<string, number> = {};
    let totalRefCount = 0;

    for (const entry of this.materials.values()) {
      byStyle[entry.style] = (byStyle[entry.style] ?? 0) + 1;
      totalRefCount += entry.refCount;
    }

    return {
      total: this.materials.size,
      byStyle,
      totalRefCount,
    };
  }

  register(material: Material, style: RenderStyle): string {
    const id = `mat_${++this.idCounter}`;
    const now = Date.now();

    this.materials.set(id, {
      id,
      material,
      style,
      createdAt: now,
      lastUsed: now,
      refCount: 1,
    });

    getEventBus().emit('material:created', { id, style });
    logger.debug(`Registered material: ${id}, style: ${style}`);

    return id;
  }

  release(id: string): void {
    const entry = this.materials.get(id);

    if (entry) {
      entry.refCount--;

      if (entry.refCount <= 0) {
        this.dispose(id);
      }
    }
  }
}

export { MaterialRegistryImpl as MaterialRegistry };
