import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { memo, useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { CameraMode } from '@/shared/types';

interface ViewportConfig {
  id: string;
  type: 'perspective' | 'ortho-top' | 'ortho-front' | 'ortho-side';
  cameraMode: CameraMode;
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  zoom?: number;
  gridVisible: boolean;
  syncWithOthers: boolean;
}

interface ViewportProps {
  config: ViewportConfig;
  isActive: boolean;
  onClick: () => void;
  onCameraChange: (pose: {
    position: [number, number, number];
    target: [number, number, number];
  }) => void;
  style?: React.CSSProperties;
  className?: string;
}

const ViewportComponent: React.FC<ViewportProps> = ({
  config,
  isActive,
  onClick,
  onCameraChange,
  style,
  className = '',
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);

  // 同步相机变化
  useEffect(() => {
    if (!controlsRef.current || !config.syncWithOthers) return;

    const handleChange = () => {
      const controls = controlsRef.current;
      if (controls) {
        const position = controls.object.position.toArray() as [number, number, number];
        const target = controls.target.toArray() as [number, number, number];
        onCameraChange({ position, target });
      }
    };

    const controls = controlsRef.current;
    controls.addEventListener('change', handleChange);

    return () => {
      controls.removeEventListener('change', handleChange);
    };
  }, [config.syncWithOthers, onCameraChange]);

  return (
    <div
      className={`relative border ${isActive ? 'border-cyan-500' : 'border-zinc-700'} ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* 标签 */}
      <div
        className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-medium ${
          isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800/80 text-zinc-400'
        }`}
      >
        {config.type === 'perspective'
          ? '透视'
          : config.type === 'ortho-top'
            ? '顶视图'
            : config.type === 'ortho-front'
              ? '前视图'
              : '侧视图'}
      </div>

      {/* 渲染区域 */}
      <div className="w-full h-full">
        {config.cameraMode === CameraMode.ORTHOGRAPHIC ? (
          <OrthographicCamera
            makeDefault
            position={config.position}
            up={config.up}
            zoom={config.zoom ?? 20}
            near={0.1}
            far={1000}
          />
        ) : (
          <PerspectiveCamera
            makeDefault
            position={config.position}
            fov={50}
            near={0.1}
            far={1000}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          target={config.target}
          enableDamping
          dampingFactor={0.05}
        />

        {config.gridVisible && (
          <gridHelper args={[20, 20, '#444', '#222']} position={[0, -0.01, 0]} />
        )}
      </div>
    </div>
  );
};

export const Viewport = memo(ViewportComponent);

export default Viewport;
