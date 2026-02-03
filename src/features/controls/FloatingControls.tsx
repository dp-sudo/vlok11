import {
  Box,
  Camera,
  Globe,
  Grid3X3,
  Layers,
  Monitor,
  Move,
  Video,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type React from 'react';
import { memo, useCallback } from 'react';
import { CameraMode, CameraMotionType, type CameraViewPreset } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useSceneStore } from '@/stores/sharedStore';

interface FloatingControlsProps {
  activeCameraView: CameraViewPreset | 'default';
  onSetCameraView: (view: CameraViewPreset) => void;
}

// 控制组容器 - 带科技感背景
const ControlGroup = ({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && (
      <span
        className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-cyan-500/90 font-bold ml-1 mb-0.5 text-center"
        style={{ fontFamily: 'var(--font-tech)', textShadow: '0 0 10px rgba(6,182,212,0.5)' }}
      >
        {label}
      </span>
    )}
    {/* HUD Panel Background - 优化科技感 */}
    <div className="flex items-center gap-0.5 p-1.5 bg-slate-950/90 backdrop-blur-xl border border-cyan-900/30 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
      {/* 扫描线效果 */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.03)_50%)] bg-[length:100%_3px] opacity-30 pointer-events-none" />

      {/* 顶部光效 */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* 科技感边框角落 */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/40 opacity-60" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-500/40 opacity-60" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-cyan-500/40 opacity-60" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-cyan-500/40 opacity-60" />

      {/* 角落发光点 */}
      <div className="absolute top-0 left-0 w-1 h-1 bg-cyan-500/60 rounded-full" />
      <div className="absolute top-0 right-0 w-1 h-1 bg-cyan-500/60 rounded-full" />
      <div className="absolute bottom-0 left-0 w-1 h-1 bg-cyan-500/60 rounded-full" />
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-cyan-500/60 rounded-full" />

      {children}
    </div>
  </div>
);

// 图标按钮 - 优化交互和视觉效果
const IconButton = ({
  active,
  icon: Icon,
  onClick,
  title,
  showIndicator = true,
}: {
  active?: boolean;
  icon: React.ElementType<{ className?: string }>;
  onClick: () => void;
  title: string;
  showIndicator?: boolean;
}) => (
  <button
    className={cn(
      'relative p-2.5 rounded-md transition-all duration-200 group',
      'flex items-center justify-center',
      'border overflow-hidden',
      active
        ? [
            'text-cyan-400 bg-cyan-500/15',
            'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3),inset_0_0_10px_rgba(6,182,212,0.1)]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
          ]
        : [
            'text-slate-400 hover:text-cyan-300',
            'border-transparent hover:border-cyan-700/50',
            'hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]',
          ]
    )}
    onClick={onClick}
    title={title}
    type="button"
  >
    {/* 悬停时的背景光效 */}
    <div
      className={cn(
        'absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        active && 'opacity-100 from-cyan-500/10 via-cyan-500/5 to-cyan-500/10'
      )}
    />

    <Icon
      className={cn(
        'w-4 h-4 relative z-10 transition-all duration-200',
        'group-hover:scale-110',
        active && 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
      )}
    />

    {/* 激活状态指示器 */}
    {active && showIndicator && (
      <>
        {/* 底部发光条 */}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,1)]" />
        {/* 左侧渐变线 */}
        <span className="absolute top-1/2 -translate-y-1/2 left-0 w-[2px] h-6 bg-gradient-to-b from-cyan-500/0 via-cyan-500/60 to-cyan-500/0" />
        {/* 右上角发光点 */}
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,1)]" />
      </>
    )}
  </button>
);

// 数值显示组件 - 用于 FOV 等数值
const ValueDisplay = ({
  value,
  unit = '',
  min = 0,
  max = 100,
  optimalRange = { min: 45, max: 75 },
}: {
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  optimalRange?: { min: number; max: number };
}) => {
  // 计算颜色 - 在最佳范围内显示青色，超出范围显示警告色
  const isOptimal = value >= optimalRange.min && value <= optimalRange.max;

  return (
    <div className="flex flex-col items-center justify-center px-2 py-1 min-w-[4ch]">
      <span
        className={cn(
          'text-sm font-mono font-bold tracking-wider',
          isOptimal ? 'text-cyan-400' : 'text-amber-400'
        )}
        style={{ textShadow: isOptimal ? '0 0 10px rgba(6,182,212,0.6)' : 'none' }}
      >
        {value}
        {unit}
      </span>
      {/* 进度条指示 */}
      <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isOptimal ? 'bg-cyan-500' : 'bg-amber-500'
          )}
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
};

// 分隔线组件
const Divider = () => (
  <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-600 to-transparent mx-1" />
);

export const FloatingControls = memo(
  ({ activeCameraView, onSetCameraView }: FloatingControlsProps) => {
    const config = useSceneStore((s) => s.config);
    const setConfig = useSceneStore((s) => s.setConfig);

    const setCameraMode = useCallback(
      (mode: CameraMode) => setConfig((prev) => ({ ...prev, cameraMode: mode })),
      [setConfig]
    );

    const setMotion = useCallback(
      (type: CameraMotionType) => setConfig((prev) => ({ ...prev, cameraMotionType: type })),
      [setConfig]
    );

    // FOV 控制
    const handleZoomIn = useCallback(() => {
      setConfig((prev) => ({ ...prev, fov: Math.max(35, prev.fov - 5) }));
    }, [setConfig]);

    const handleZoomOut = useCallback(() => {
      setConfig((prev) => ({ ...prev, fov: Math.min(120, prev.fov + 5) }));
    }, [setConfig]);

    return (
      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-wrap justify-center items-end gap-2 md:gap-4 max-w-[95vw] pointer-events-auto select-none">
        {/* 左侧装饰线 */}
        <div className="hidden md:block w-16 h-px bg-gradient-to-r from-transparent via-cyan-900/50 to-cyan-500/30 mb-8 relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500/40 rounded-full blur-sm" />
        </div>

        {/* 1. 视角预设 */}
        <ControlGroup label="Viewpoint">
          <IconButton
            active={activeCameraView === 'FRONT'}
            icon={Monitor}
            onClick={() => onSetCameraView('FRONT')}
            title="正视图 [Cmd+1]"
          />
          <Divider />
          <IconButton
            active={activeCameraView === 'ISO'}
            icon={Box}
            onClick={() => onSetCameraView('ISO')}
            title="等轴测图 [Cmd+2]"
          />
          <Divider />
          <IconButton
            active={activeCameraView === 'TOP'}
            icon={Layers}
            onClick={() => onSetCameraView('TOP')}
            title="俯视图 [Cmd+3]"
          />
        </ControlGroup>

        {/* 2. 镜头模式 */}
        <ControlGroup label="Optics">
          <IconButton
            active={config.cameraMode === CameraMode.PERSPECTIVE}
            icon={Globe}
            onClick={() => setCameraMode(CameraMode.PERSPECTIVE)}
            title="透视模式"
          />
          <Divider />
          <IconButton
            active={config.cameraMode === CameraMode.ORTHOGRAPHIC}
            icon={Grid3X3}
            onClick={() => setCameraMode(CameraMode.ORTHOGRAPHIC)}
            title="正交模式 (蓝图风格)"
          />
        </ControlGroup>

        {/* 3. 缩放控制 */}
        <ControlGroup label="Zoom">
          <IconButton
            icon={ZoomIn}
            onClick={handleZoomIn}
            title="放大 (减小视场角)"
            showIndicator={false}
          />
          <ValueDisplay
            value={config.fov}
            unit="°"
            min={35}
            max={120}
            optimalRange={{ min: 45, max: 75 }}
          />
          <IconButton
            icon={ZoomOut}
            onClick={handleZoomOut}
            title="缩小 (增大视场角)"
            showIndicator={false}
          />
        </ControlGroup>

        {/* 4. 相机运动 */}
        <ControlGroup label="System">
          <IconButton
            active={config.cameraMotionType === CameraMotionType.STATIC}
            icon={Camera}
            onClick={() => setMotion(CameraMotionType.STATIC)}
            title="静态模式"
          />
          <Divider />
          <IconButton
            active={config.cameraMotionType === CameraMotionType.ORBIT}
            icon={Move}
            onClick={() => setMotion(CameraMotionType.ORBIT)}
            title="轨道环绕模式"
          />
          <Divider />
          <IconButton
            active={config.cameraMotionType === CameraMotionType.FLY_BY}
            icon={Video}
            onClick={() => setMotion(CameraMotionType.FLY_BY)}
            title="无人机飞掠模式"
          />
        </ControlGroup>

        {/* 右侧装饰线 */}
        <div className="hidden md:block w-16 h-px bg-gradient-to-l from-transparent via-cyan-900/50 to-cyan-500/30 mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500/40 rounded-full blur-sm" />
        </div>
      </div>
    );
  }
);

FloatingControls.displayName = 'FloatingControls';
