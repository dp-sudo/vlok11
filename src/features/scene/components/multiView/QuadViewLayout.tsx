import { useCallback, useState } from 'react';
import { CameraMode } from '@/shared/types';
import { Viewport } from './Viewport';

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

const DEFAULT_QUAD_VIEWS: ViewportConfig[] = [
  {
    id: 'top',
    type: 'ortho-top',
    cameraMode: CameraMode.ORTHOGRAPHIC,
    position: [0, 20, 0],
    target: [0, 0, 0],
    up: [0, 0, -1],
    zoom: 25,
    gridVisible: true,
    syncWithOthers: true,
  },
  {
    id: 'front',
    type: 'ortho-front',
    cameraMode: CameraMode.ORTHOGRAPHIC,
    position: [0, 0, 20],
    target: [0, 0, 0],
    up: [0, 1, 0],
    zoom: 25,
    gridVisible: true,
    syncWithOthers: true,
  },
  {
    id: 'side',
    type: 'ortho-side',
    cameraMode: CameraMode.ORTHOGRAPHIC,
    position: [20, 0, 0],
    target: [0, 0, 0],
    up: [0, 1, 0],
    zoom: 25,
    gridVisible: true,
    syncWithOthers: true,
  },
  {
    id: 'perspective',
    type: 'perspective',
    cameraMode: CameraMode.PERSPECTIVE,
    position: [15, 15, 15],
    target: [0, 0, 0],
    up: [0, 1, 0],
    gridVisible: false,
    syncWithOthers: true,
  },
];

interface QuadViewLayoutProps {
  viewports?: ViewportConfig[];
  onViewportChange?: (viewports: ViewportConfig[]) => void;
  className?: string;
}

export const QuadViewLayout: React.FC<QuadViewLayoutProps> = ({
  viewports = DEFAULT_QUAD_VIEWS,
  onViewportChange,
  className = '',
}) => {
  const [activeViewport, setActiveViewport] = useState<string>('perspective');
  const [localViewports, setLocalViewports] = useState<ViewportConfig[]>(viewports);

  // 同步相机变化到其他视口
  const handleCameraChange = useCallback(
    (
      sourceId: string,
      pose: { position: [number, number, number]; target: [number, number, number] }
    ) => {
      setLocalViewports((prev) => {
        const updated = prev.map((vp) => {
          if (vp.id === sourceId || !vp.syncWithOthers) return vp;

          // 正交视口只同步target
          if (vp.cameraMode === CameraMode.ORTHOGRAPHIC) {
            return { ...vp, target: pose.target };
          }

          // 透视视口同步位置和target
          return {
            ...vp,
            position: vp.type === 'perspective' ? pose.position : vp.position,
            target: pose.target,
          };
        });

        onViewportChange?.(updated);

        return updated;
      });
    },
    [onViewportChange]
  );

  return (
    <div className={`grid grid-cols-2 grid-rows-2 gap-0.5 bg-zinc-800 p-0.5 ${className}`}>
      {localViewports.map((viewport) => (
        <Viewport
          key={viewport.id}
          config={viewport}
          isActive={activeViewport === viewport.id}
          onClick={() => setActiveViewport(viewport.id)}
          onCameraChange={(pose) => handleCameraChange(viewport.id, pose)}
          style={{
            aspectRatio: '1 / 1',
            minHeight: '200px',
          }}
        />
      ))}
    </div>
  );
};

export default QuadViewLayout;
