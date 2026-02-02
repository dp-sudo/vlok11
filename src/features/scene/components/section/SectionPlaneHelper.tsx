import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide, type Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { createLogger } from '@/core/Logger';
import {
  getSectionViewService,
  type SectionConfig,
} from '../../services/camera/SectionViewService';

const logger = createLogger({ module: 'SectionPlaneHelper' });

interface SectionPlaneHelperProps {
  config: SectionConfig | null;
  size?: number;
}

const SectionPlaneHelperComponent: React.FC<SectionPlaneHelperProps> = ({ config, size = 20 }) => {
  const meshRef = useRef<Mesh>(null);

  // 根据剖面轴计算平面方向
  const planeOrientation = useMemo<[number, number, number] | null>(() => {
    if (!config) return null;

    switch (config.axis) {
      case 'x':
        return [0, Math.PI / 2, 0];
      case 'y':
        return config.flipNormal ? [Math.PI / 2, 0, Math.PI] : [Math.PI / 2, 0, 0];
      case 'z':
        return config.flipNormal ? [0, Math.PI, 0] : [0, 0, 0];
      case 'custom':
        return [0, 0, 0];
      default:
        return [0, 0, 0];
    }
  }, [config]);

  // 计算平面位置
  const position = useMemo<[number, number, number]>(() => {
    if (!config) return [0, 0, 0];

    switch (config.axis) {
      case 'x':
        return [config.position, 0, 0];
      case 'y':
        return [0, config.position, 0];
      case 'z':
        return [0, 0, config.position];
      case 'custom':
        return [config.position, 0, 0];
      default:
        return [0, 0, 0];
    }
  }, [config]);

  // 创建平面几何体
  const planeGeometry = useMemo(() => new PlaneGeometry(size, size), [size]);

  // 创建平面材质
  const planeMaterial = useMemo(() => {
    if (!config) return null;

    return new MeshBasicMaterial({
      color: config.helperColor,
      transparent: true,
      opacity: config.helperOpacity,
      side: DoubleSide,
      depthWrite: false,
      depthTest: true,
    });
  }, [config]);

  // 订阅剖面配置变化
  useEffect(() => {
    if (!config?.showHelper) return;

    const unsubscribe = getSectionViewService().subscribe((_planes, newConfig) => {
      logger.debug('Section config updated', { config: newConfig });
    });

    return () => {
      unsubscribe();
    };
  }, [config?.showHelper]);

  // 如果剖面未启用或不需要显示辅助平面，返回null
  if (!config || !config.enabled || !config.showHelper || !planeOrientation) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={planeOrientation}
      geometry={planeGeometry}
      material={planeMaterial!}
      name="SectionPlaneHelper"
    />
  );
};

export const SectionPlaneHelper = SectionPlaneHelperComponent;

export default SectionPlaneHelper;
