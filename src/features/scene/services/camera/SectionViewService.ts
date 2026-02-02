import { Plane, Vector3 } from 'three';
import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';

const logger = createLogger({ module: 'SectionViewService' });

/**
 * 剖面类型
 */
export type SectionAxis = 'x' | 'y' | 'z' | 'custom';

/**
 * 剖面配置
 */
export interface SectionConfig {
  /** 剖面轴 */
  axis: SectionAxis;
  /** 剖面位置（沿轴的距离） */
  position: number;
  /** 是否启用剖面 */
  enabled: boolean;
  /** 是否显示剖面辅助平面 */
  showHelper: boolean;
  /** 剖面辅助平面颜色 */
  helperColor: string;
  /** 剖面辅助平面透明度 */
  helperOpacity: number;
  /** 是否翻转剖面方向 */
  flipNormal: boolean;
}

/**
 * 剖面平面定义
 */
export interface SectionPlane {
  plane: Plane;
  axis: SectionAxis;
  position: number;
}

/**
 * 剖面视图服务
 * 管理场景的剖面裁剪功能
 */
export class SectionViewService {
  private static instance: SectionViewService | null = null;
  private clippingPlanes: Plane[] = [];
  private currentConfig: SectionConfig | null = null;
  private subscribers: Set<(planes: Plane[], config: SectionConfig | null) => void> = new Set();

  private constructor() {}

  static getInstance(): SectionViewService {
    SectionViewService.instance ??= new SectionViewService();

    return SectionViewService.instance;
  }

  static resetInstance(): void {
    SectionViewService.instance = null;
  }

  /**
   * 创建剖面配置
   * @param axis - 剖面轴
   * @param position - 剖面位置
   * @param partialConfig - 部分配置
   * @returns 完整配置
   */
  createConfig(
    axis: SectionAxis,
    position: number,
    partialConfig: Partial<Omit<SectionConfig, 'axis' | 'position'>> = {}
  ): SectionConfig {
    return {
      axis,
      position,
      enabled: partialConfig.enabled ?? true,
      showHelper: partialConfig.showHelper ?? true,
      helperColor: partialConfig.helperColor ?? '#ff6b6b',
      helperOpacity: partialConfig.helperOpacity ?? 0.3,
      flipNormal: partialConfig.flipNormal ?? false,
    };
  }

  /**
   * 创建剖面平面
   * @param config - 剖面配置
   * @returns 剖面平面
   */
  createPlane(config: SectionConfig): SectionPlane {
    let normal: Vector3;

    switch (config.axis) {
      case 'x':
        normal = new Vector3(config.flipNormal ? -1 : 1, 0, 0);
        break;
      case 'y':
        normal = new Vector3(0, config.flipNormal ? -1 : 1, 0);
        break;
      case 'z':
        normal = new Vector3(0, 0, config.flipNormal ? -1 : 1);
        break;
      case 'custom':
        // 自定义轴，这里简化处理为X轴
        normal = new Vector3(config.flipNormal ? -1 : 1, 0, 0);
        break;
      default:
        normal = new Vector3(1, 0, 0);
    }

    const plane = new Plane(normal, -config.position);

    return {
      plane,
      axis: config.axis,
      position: config.position,
    };
  }

  /**
   * 应用剖面
   * @param config - 剖面配置
   */
  applySection(config: SectionConfig): void {
    if (!config.enabled) {
      this.clearSection();

      return;
    }

    const sectionPlane = this.createPlane(config);

    this.clippingPlanes = [sectionPlane.plane];
    this.currentConfig = config;

    // 通知订阅者
    this.notifySubscribers();

    // 发射事件
    getEventBus().emit('camera:section-applied', {
      axis: config.axis,
      position: config.position,
      plane: sectionPlane.plane,
    });

    logger.info(`应用剖面: ${config.axis}轴 @ ${config.position}`, {
      axis: config.axis,
      position: config.position,
    });
  }

  /**
   * 清除剖面
   */
  clearSection(): void {
    this.clippingPlanes = [];
    const previousConfig = this.currentConfig;

    this.currentConfig = null;

    this.notifySubscribers();

    getEventBus().emit('camera:section-cleared', {
      previousAxis: previousConfig?.axis,
      previousPosition: previousConfig?.position,
    });

    logger.info('清除剖面', {});
  }

  /**
   * 更新剖面位置
   * @param position - 新位置
   */
  updateSectionPosition(position: number): void {
    if (!this.currentConfig) return;

    const newConfig = { ...this.currentConfig, position };

    this.applySection(newConfig);
  }

  /**
   * 获取当前裁剪平面
   * @returns 裁剪平面数组
   */
  getClippingPlanes(): Plane[] {
    return this.clippingPlanes;
  }

  /**
   * 获取当前配置
   * @returns 当前剖面配置
   */
  getCurrentConfig(): SectionConfig | null {
    return this.currentConfig;
  }

  /**
   * 检查剖面是否启用
   * @returns 是否启用
   */
  isEnabled(): boolean {
    return this.currentConfig?.enabled ?? false;
  }

  /**
   * 订阅剖面变化
   * @param callback - 回调函数
   * @returns 取消订阅函数
   */
  subscribe(callback: (planes: Plane[], config: SectionConfig | null) => void): () => void {
    this.subscribers.add(callback);

    return () => this.subscribers.delete(callback);
  }

  /**
   * 通知所有订阅者
   */
  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      callback(this.clippingPlanes, this.currentConfig);
    });
  }

  /**
   * 获取剖面轴的显示名称
   * @param axis - 剖面轴
   * @returns 显示名称
   */
  getAxisDisplayName(axis: SectionAxis): string {
    const names: Record<SectionAxis, string> = {
      x: 'X轴 (左右)',
      y: 'Y轴 (上下)',
      z: 'Z轴 (前后)',
      custom: '自定义',
    };

    return names[axis];
  }

  /**
   * 获取预设剖面位置
   * @param axis - 剖面轴
   * @returns 推荐位置数组
   */
  getPresetPositions(axis: SectionAxis): number[] {
    // 根据轴返回常用的剖面位置
    switch (axis) {
      case 'x':
        return [-10, -5, 0, 5, 10];
      case 'y':
        return [-10, -5, 0, 5, 10];
      case 'z':
        return [-10, -5, 0, 5, 10];
      case 'custom':
        return [0];
      default:
        return [0];
    }
  }
}

/**
 * 获取剖面视图服务实例
 * @returns 服务实例
 */
export function getSectionViewService(): SectionViewService {
  return SectionViewService.getInstance();
}

/**
 * 重置剖面视图服务
 */
export function resetSectionViewService(): void {
  SectionViewService.resetInstance();
}
