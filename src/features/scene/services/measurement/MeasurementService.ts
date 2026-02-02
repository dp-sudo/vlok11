import { Vector3 } from 'three';
import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';

const logger = createLogger({ module: 'MeasurementService' });

export type MeasurementType = 'distance' | 'angle';

export interface Measurement {
  id: string;
  type: MeasurementType;
  points: Vector3[];
  value: number;
  label: string;
  createdAt: number;
}

export interface MeasurementConfig {
  enabled: boolean;
  measurementType: MeasurementType;
  snapToGrid: boolean;
  gridSize: number;
  showLabels: boolean;
}

class MeasurementService {
  private measurements: Map<string, Measurement> = new Map();
  private activeTool: MeasurementType | null = null;
  private currentPoints: Vector3[] = [];
  private config: MeasurementConfig = {
    enabled: false,
    measurementType: 'distance',
    snapToGrid: true,
    gridSize: 1,
    showLabels: true,
  };

  private generateId(): string {
    return `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动测量工具
   */
  startTool(type: MeasurementType): void {
    this.activeTool = type;
    this.currentPoints = [];
    this.config.enabled = true;
    this.config.measurementType = type;

    getEventBus().emit('measurement:tool-activated', { tool: type });
    logger.info(`测量工具已启动: ${type}`);
  }

  /**
   * 停止测量工具
   */
  stopTool(): void {
    this.activeTool = null;
    this.currentPoints = [];
    this.config.enabled = false;

    getEventBus().emit('measurement:tool-deactivated', {});
    logger.info('测量工具已停止');
  }

  /**
   * 添加测量点
   */
  addPoint(point: Vector3): void {
    if (!this.activeTool) return;

    // 网格吸附
    if (this.config.snapToGrid) {
      point = this.snapToGrid(point);
    }

    this.currentPoints.push(point.clone());

    const eventBus = getEventBus();

    if (this.activeTool === 'distance') {
      if (this.currentPoints.length === 1) {
        eventBus.emit('measurement:point-added', {
          point: point.toArray(),
          totalPoints: 1,
        });
      } else if (this.currentPoints.length === 2) {
        // 计算距离
        const [p1, p2] = this.currentPoints;
        const distance = p1.distanceTo(p2);

        const measurement: Measurement = {
          id: this.generateId(),
          type: 'distance',
          points: [...this.currentPoints],
          value: distance,
          label: `${distance.toFixed(2)} units`,
          createdAt: Date.now(),
        };

        this.measurements.set(measurement.id, measurement);
        this.currentPoints = [];

        eventBus.emit('measurement:completed', { measurement });
        logger.info('距离测量完成', { id: measurement.id, value: measurement.value });
      }
    } else if (this.activeTool === 'angle') {
      if (this.currentPoints.length < 3) {
        eventBus.emit('measurement:point-added', {
          point: point.toArray(),
          totalPoints: this.currentPoints.length,
        });
      } else if (this.currentPoints.length === 3) {
        // 计算角度
        const [p1, p2, p3] = this.currentPoints;
        const v1 = p1.clone().sub(p2);
        const v2 = p3.clone().sub(p2);
        const angle = v1.angleTo(v2);
        const angleDegrees = (angle * 180) / Math.PI;

        const measurement: Measurement = {
          id: this.generateId(),
          type: 'angle',
          points: [...this.currentPoints],
          value: angleDegrees,
          label: `${angleDegrees.toFixed(1)}°`,
          createdAt: Date.now(),
        };

        this.measurements.set(measurement.id, measurement);
        this.currentPoints = [];

        eventBus.emit('measurement:completed', { measurement });
        logger.info('角度测量完成', { id: measurement.id, value: measurement.value });
      }
    }
  }

  /**
   * 网格吸附
   */
  snapToGrid(point: Vector3): Vector3 {
    const size = this.config.gridSize;
    return new Vector3(
      Math.round(point.x / size) * size,
      Math.round(point.y / size) * size,
      Math.round(point.z / size) * size
    );
  }

  /**
   * 获取所有测量
   */
  getMeasurements(): Measurement[] {
    return Array.from(this.measurements.values());
  }

  /**
   * 获取指定类型的测量
   */
  getMeasurementsByType(type: MeasurementType): Measurement[] {
    return this.getMeasurements().filter((m) => m.type === type);
  }

  /**
   * 删除测量
   */
  deleteMeasurement(id: string): boolean {
    const deleted = this.measurements.delete(id);
    if (deleted) {
      getEventBus().emit('measurement:deleted', { id });
    }
    return deleted;
  }

  /**
   * 清空所有测量
   */
  clearAll(): void {
    this.measurements.clear();
    getEventBus().emit('measurement:cleared', {});
    logger.info('所有测量已清除');
  }

  /**
   * 更新配置
   */
  updateConfig(partialConfig: Partial<MeasurementConfig>): void {
    this.config = { ...this.config, ...partialConfig };
    getEventBus().emit('measurement:config-changed', { config: this.config });
  }

  /**
   * 获取当前配置
   */
  getConfig(): MeasurementConfig {
    return { ...this.config };
  }

  /**
   * 检查是否正在测量
   */
  isMeasuring(): boolean {
    return this.activeTool !== null;
  }

  /**
   * 获取当前测量点数
   */
  getCurrentPointCount(): number {
    return this.currentPoints.length;
  }

  /**
   * 获取当前测量点
   */
  getCurrentPoints(): Vector3[] {
    return [...this.currentPoints];
  }
}

// 单例实例
let measurementServiceInstance: MeasurementService | null = null;

export function getMeasurementService(): MeasurementService {
  measurementServiceInstance ??= new MeasurementService();
  return measurementServiceInstance;
}

export function resetMeasurementService(): void {
  measurementServiceInstance = null;
}
