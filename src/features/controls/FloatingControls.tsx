import {
  Box,
  Camera,
  Globe,
  Grid,
  Layers,
  Monitor,
  Move,
  Video,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { CameraMode, CameraMotionType, type CameraViewPreset } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useSceneStore } from '@/stores/sharedStore';

interface FloatingControlsProps {
  activeCameraView: CameraViewPreset | 'default';
  onSetCameraView: (view: CameraViewPreset) => void;
}

const ControlGroup = ({ children, label }: { children: React.ReactNode; label?: string }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <span
        className="text-[10px] uppercase tracking-widest text-cyan-400/80 font-bold ml-1 mb-1"
        style={{ fontFamily: 'var(--font-tech)' }}
      >
        {label}
      </span>
    )}
    {/* HUD Panel Background */}
    <div className="flex items-center gap-1 p-1.5 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/50 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group/panel">
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
      {/* Tech Border Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600 opacity-50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-600 opacity-50" />

      {children}
    </div>
  </div>
);

const IconButton = ({
  active,
  icon: Icon,
  onClick,
  title,
}: {
  active?: boolean;
  icon: React.ElementType<{ className?: string }>;
  onClick: () => void;
  title: string;
}) => (
  <button
    className={cn(
      'p-2.5 btn-cyber group flex items-center justify-center relative',
      'border border-transparent hover:border-zinc-700/50',
      active
        ? 'text-cyan-400 bg-cyan-500/10 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]'
        : 'text-zinc-500 hover:text-cyan-300 hover:bg-cyan-900/10'
    )}
    onClick={onClick}
    title={title}
    type="button"
  >
    <Icon
      className={cn(
        'w-4 h-4 transition-transform duration-75 group-hover:scale-110',
        active && 'drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]'
      )}
    />

    {active && (
      <>
        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
        <span className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0" />
      </>
    )}
  </button>
);

export const FloatingControls = memo(
  ({ activeCameraView, onSetCameraView }: FloatingControlsProps) => {
    const config = useSceneStore((s) => s.config);
    const setConfig = useSceneStore((s) => s.setConfig);

    const setCameraMode = (mode: CameraMode) =>
      setConfig((prev) => ({ ...prev, cameraMode: mode }));
    const setMotion = (type: CameraMotionType) =>
      setConfig((prev) => ({ ...prev, cameraMotionType: type }));

    // FOV 减小 = 视角变窄 = 放大效果 (Zoom In)
    const handleZoomIn = () => {
      const currentFov = config.fov;
      const newFov = Math.max(35, currentFov - 5);

      setConfig((prev) => ({ ...prev, fov: newFov }));
    };

    // FOV 增大 = 视角变宽 = 缩小效果 (Zoom Out)
    const handleZoomOut = () => {
      const currentFov = config.fov;
      const newFov = Math.min(120, currentFov + 5);

      setConfig((prev) => ({ ...prev, fov: newFov }));
    };

    return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-end gap-6 pointer-events-auto select-none">
        {/* Left Decoration Line */}
        <div className="hidden md:block w-12 h-[1px] bg-gradient-to-r from-transparent to-zinc-700 mb-6" />

        {/* 1. VIEW PRESETS */}
        <ControlGroup label="Viewpoint">
          <IconButton
            active={activeCameraView === 'FRONT'}
            icon={Monitor}
            onClick={() => onSetCameraView('FRONT')}
            title="Front View [CMD+1]"
          />
          <IconButton
            active={activeCameraView === 'ISO'}
            icon={Box}
            onClick={() => onSetCameraView('ISO')}
            title="Isometric [CMD+2]"
          />
          <IconButton
            active={activeCameraView === 'TOP'}
            icon={Layers}
            onClick={() => onSetCameraView('TOP')}
            title="Top Down [CMD+3]"
          />
        </ControlGroup>

        {/* 2. LENS MODE */}
        <ControlGroup label="Optics">
          <IconButton
            active={config.cameraMode === CameraMode.PERSPECTIVE}
            icon={Globe}
            onClick={() => setCameraMode(CameraMode.PERSPECTIVE)}
            title="Perspective Lens"
          />
          <IconButton
            active={config.cameraMode === CameraMode.ORTHOGRAPHIC}
            icon={Grid}
            onClick={() => setCameraMode(CameraMode.ORTHOGRAPHIC)}
            title="Orthographic (Blueprint)"
          />
        </ControlGroup>

        {/* 3. ZOOM CONTROLS */}
        <ControlGroup label="Zoom">
          <IconButton icon={ZoomIn} onClick={handleZoomIn} title="Zoom In (减小FOV)" />
          <div className="px-2 py-1 text-xs font-mono text-cyan-400 min-w-[3ch] text-center">
            {config.fov}°
          </div>
          <IconButton icon={ZoomOut} onClick={handleZoomOut} title="Zoom Out (增大FOV)" />
        </ControlGroup>

        {/* 4. CAMERA MOTION */}
        <ControlGroup label="System">
          <IconButton
            active={config.cameraMotionType === CameraMotionType.STATIC}
            icon={Camera}
            onClick={() => setMotion(CameraMotionType.STATIC)}
            title="Static Feed"
          />
          <IconButton
            active={config.cameraMotionType === CameraMotionType.ORBIT}
            icon={Move}
            onClick={() => setMotion(CameraMotionType.ORBIT)}
            title="Orbit Mode"
          />
          <IconButton
            active={config.cameraMotionType === CameraMotionType.FLY_BY}
            icon={Video}
            onClick={() => setMotion(CameraMotionType.FLY_BY)}
            title="Drone Fly-by"
          />
        </ControlGroup>

        {/* Right Decoration Line */}
        <div className="hidden md:block w-12 h-[1px] bg-gradient-to-l from-transparent to-zinc-700 mb-6" />
      </div>
    );
  }
);

FloatingControls.displayName = 'FloatingControls';
