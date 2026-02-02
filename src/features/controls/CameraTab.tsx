import {
  ArrowDown,
  ArrowRight,
  Box,
  Camera,
  Eye,
  Focus,
  Grid3X3,
  Move3D,
  Ruler,
  Sliders,
} from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { OrthoViewPresetType } from '@/features/scene/services/camera/OrthographicPresets';
import { getOrthoPresetDisplayInfo } from '@/features/scene/services/camera/OrthographicPresets';
import { getMeasurementService } from '@/features/scene/services/measurement/MeasurementService';
import type { CameraViewPreset, SceneConfig } from '@/shared/types';
import { CameraMode, CameraMotionType } from '@/shared/types';
import {
  CAMERA_MODE_LABELS,
  CAMERA_VIEWS,
  CONTROL_PARAMS,
  FOV,
  MOTION_RESUME_DELAY,
  MOTION_RESUME_TRANSITION,
  MOTION_SPEED,
  ORBIT,
  ORTHO_ZOOM,
  SPIRAL,
} from './CameraTab.constants';
import { Btn, CardBtn, CollapsibleSection, Slider, Toggle } from './components';
import { FOV_PRESETS, getCameraViewLabel, MOTIONS } from './constants';

interface CameraTabProps {
  activeCameraView?: CameraViewPreset | null;
  activeMotion: (typeof MOTIONS)[number] | undefined;
  activeOrthoPreset?: OrthoViewPresetType | null;
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  onSetCameraView?: (view: CameraViewPreset) => void;
  onSetOrthoPreset?: (preset: OrthoViewPresetType) => void;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}

const CameraModeSection = memo<{
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}>(({ config, set }) => (
  <CollapsibleSection icon={<Camera className="w-3.5 h-3.5" />} title="相机模式">
    <div className="grid grid-cols-2 gap-1.5">
      <CardBtn
        active={config.cameraMode === CameraMode.PERSPECTIVE}
        onClick={() => set('cameraMode', CameraMode.PERSPECTIVE)}
      >
        <Eye className="w-4 h-4 mb-1" />
        <span>{CAMERA_MODE_LABELS.PERSPECTIVE}</span>
      </CardBtn>
      <CardBtn
        active={config.cameraMode === CameraMode.ORTHOGRAPHIC}
        onClick={() => set('cameraMode', CameraMode.ORTHOGRAPHIC)}
      >
        <Grid3X3 className="w-4 h-4 mb-1" />
        <span>{CAMERA_MODE_LABELS.ORTHOGRAPHIC}</span>
      </CardBtn>
    </div>
    {config.cameraMode === CameraMode.PERSPECTIVE ? (
      <Slider
        label="广角"
        max={FOV.MAX}
        min={FOV.MIN}
        onChange={(v) => set('fov', v)}
        presets={FOV_PRESETS as unknown as number[]}
        showPresets
        step={FOV.STEP}
        value={config.fov}
      />
    ) : (
      <Slider
        label="正交缩放"
        max={ORTHO_ZOOM.MAX}
        min={ORTHO_ZOOM.MIN}
        onChange={(v) => set('orthoZoom', v)}
        step={ORTHO_ZOOM.STEP}
        value={config.orthoZoom}
      />
    )}
  </CollapsibleSection>
));

export const CameraTab: React.FC<CameraTabProps> = memo(
  ({
    config,
    set,
    expandedSections,
    toggleSection,
    activeCameraView,
    onSetCameraView,
    activeMotion,
    activeOrthoPreset,
    onSetOrthoPreset,
  }) => (
    <>
      <div className="mb-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-zinc-100 tracking-wide font-tech">
              {config.cameraMode === CameraMode.PERSPECTIVE
                ? CAMERA_MODE_LABELS.PERSPECTIVE
                : CAMERA_MODE_LABELS.ORTHOGRAPHIC}
              相机
            </div>
            <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
              {activeMotion?.label} · FOV {config.fov}°
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-0.5">
              速度
            </div>
            <div className="text-base font-mono text-violet-600 font-semibold">
              {config.cameraMotionSpeed.toFixed(1)}x
            </div>
          </div>
        </div>
      </div>

      <CameraViewSection
        activeCameraView={activeCameraView}
        expandedSections={expandedSections}
        onSetCameraView={onSetCameraView}
        toggleSection={toggleSection}
      />
      <CameraModeSection config={config} set={set} />
      <OrthoPresetSection
        activePreset={activeOrthoPreset}
        config={config}
        expandedSections={expandedSections}
        onSetPreset={onSetOrthoPreset}
        toggleSection={toggleSection}
      />
      <MotionSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
      <ControlParamsSection config={config} set={set} />
    </>
  )
);
const CameraViewSection = memo<{
  activeCameraView?: CameraViewPreset | null;
  expandedSections: Record<string, boolean>;
  onSetCameraView?: (view: CameraViewPreset) => void;
  toggleSection: (key: string) => void;
}>(({ expandedSections, toggleSection, activeCameraView, onSetCameraView }) => (
  <CollapsibleSection
    expanded={expandedSections.camera}
    icon={<Focus className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('camera')}
    title="快捷视角"
  >
    <div className="grid grid-cols-5 gap-1.5">
      {CAMERA_VIEWS.map((v) => (
        <CardBtn active={activeCameraView === v} key={v} onClick={() => onSetCameraView?.(v)} small>
          {getCameraViewLabel(v)}
        </CardBtn>
      ))}
    </div>
  </CollapsibleSection>
));
const ControlParamsSection = memo<{
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}>(({ config, set }) => (
  <CollapsibleSection icon={<Sliders className="w-3.5 h-3.5" />} title="控制参数">
    <Slider
      label="阻尼系数"
      max={CONTROL_PARAMS.DAMPING_MAX}
      min={CONTROL_PARAMS.DAMPING_MIN}
      onChange={(v) => set('dampingFactor', v)}
      step={CONTROL_PARAMS.DAMPING_STEP}
      value={config.dampingFactor}
    />
    <Slider
      label="旋转速度"
      max={CONTROL_PARAMS.ROTATE_SPEED_MAX}
      min={CONTROL_PARAMS.ROTATE_SPEED_MIN}
      onChange={(v) => set('rotateSpeed', v)}
      step={CONTROL_PARAMS.ROTATE_SPEED_STEP}
      value={config.rotateSpeed}
    />
    <Slider
      label="缩放速度"
      max={CONTROL_PARAMS.ZOOM_SPEED_MAX}
      min={CONTROL_PARAMS.ZOOM_SPEED_MIN}
      onChange={(v) => set('zoomSpeed', v)}
      step={CONTROL_PARAMS.ZOOM_SPEED_STEP}
      value={config.zoomSpeed}
    />
    <Slider
      label="平移速度"
      max={CONTROL_PARAMS.PAN_SPEED_MAX}
      min={CONTROL_PARAMS.PAN_SPEED_MIN}
      onChange={(v) => set('panSpeed', v)}
      step={CONTROL_PARAMS.PAN_SPEED_STEP}
      value={config.panSpeed}
    />
    <Toggle checked={config.enablePan} label="启用平移" onChange={(v) => set('enablePan', v)} />
  </CollapsibleSection>
));
const MotionSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.motion}
    icon={<Move3D className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('motion')}
    title="自动运镜"
  >
    <div className="grid grid-cols-3 gap-1.5">
      {MOTIONS.map((m) => (
        <CardBtn
          active={config.cameraMotionType === m.type}
          key={m.type}
          onClick={() => set('cameraMotionType', m.type)}
        >
          <span className="text-sm mb-0.5">{m.icon}</span>
          <span>{m.label}</span>
        </CardBtn>
      ))}
    </div>
    {config.cameraMotionType !== CameraMotionType.STATIC ? (
      <>
        <div className="grid grid-cols-3 gap-1.5">
          <Btn
            active={config.cameraMotionBlend === 'override'}
            onClick={() => set('cameraMotionBlend', 'override')}
          >
            覆盖
          </Btn>
          <Btn
            active={config.cameraMotionBlend === 'additive'}
            onClick={() => set('cameraMotionBlend', 'additive')}
          >
            叠加
          </Btn>
          <Btn
            active={config.cameraMotionBlend === 'manual-priority'}
            onClick={() => set('cameraMotionBlend', 'manual-priority')}
          >
            手动优先
          </Btn>
        </div>
        <Slider
          label="运镜速度"
          max={MOTION_SPEED.MAX}
          min={MOTION_SPEED.MIN}
          onChange={(v) => set('cameraMotionSpeed', v)}
          step={MOTION_SPEED.STEP}
          value={config.cameraMotionSpeed}
        />
        <Slider
          label="松手后恢复延迟(ms)"
          max={MOTION_RESUME_DELAY.MAX}
          min={MOTION_RESUME_DELAY.MIN}
          onChange={(v) => set('motionResumeDelayMs', v)}
          step={MOTION_RESUME_DELAY.STEP}
          value={config.motionResumeDelayMs}
        />
        <Slider
          label="恢复过渡时长(ms)"
          max={MOTION_RESUME_TRANSITION.MAX}
          min={MOTION_RESUME_TRANSITION.MIN}
          onChange={(v) => set('motionResumeTransitionMs', v)}
          step={MOTION_RESUME_TRANSITION.STEP}
          value={config.motionResumeTransitionMs}
        />
        {config.cameraMotionType === CameraMotionType.ORBIT ? (
          <>
            <Slider
              label="环绕半径"
              max={ORBIT.RADIUS_MAX}
              min={ORBIT.RADIUS_MIN}
              onChange={(v) => set('orbitRadius', v)}
              step={ORBIT.RADIUS_STEP}
              value={config.orbitRadius}
            />
            <Slider
              label="倾斜角度"
              max={ORBIT.TILT_MAX}
              min={ORBIT.TILT_MIN}
              onChange={(v) => set('orbitTilt', v)}
              step={ORBIT.TILT_STEP}
              value={config.orbitTilt}
            />
          </>
        ) : null}
        {config.cameraMotionType === CameraMotionType.SPIRAL ? (
          <>
            <Slider
              label="螺旋圈数"
              max={SPIRAL.LOOPS_MAX}
              min={SPIRAL.LOOPS_MIN}
              onChange={(v) => set('spiralLoops', v)}
              step={SPIRAL.LOOPS_STEP}
              value={config.spiralLoops}
            />
            <Slider
              label="螺旋高度"
              max={SPIRAL.HEIGHT_MAX}
              min={SPIRAL.HEIGHT_MIN}
              onChange={(v) => set('spiralHeight', v)}
              step={SPIRAL.HEIGHT_STEP}
              value={config.spiralHeight}
            />
          </>
        ) : null}
      </>
    ) : null}
  </CollapsibleSection>
));

const OrthoPresetSection = memo<{
  activePreset?: OrthoViewPresetType | null;
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  onSetPreset?: (preset: OrthoViewPresetType) => void;
  toggleSection: (key: string) => void;
}>(({ expandedSections, toggleSection, config, activePreset, onSetPreset }) => {
  // 只有在正交模式下才显示
  if (config.cameraMode !== CameraMode.ORTHOGRAPHIC) {
    return null;
  }

  const presets: OrthoViewPresetType[] = ['top', 'front', 'side', 'iso'];
  const icons: Record<OrthoViewPresetType, React.ReactNode> = {
    top: <ArrowDown className="w-4 h-4 mb-1" />,
    front: <Eye className="w-4 h-4 mb-1" />,
    side: <ArrowRight className="w-4 h-4 mb-1" />,
    iso: <Box className="w-4 h-4 mb-1" />,
  };

  return (
    <CollapsibleSection
      expanded={expandedSections.orthoPresets}
      icon={<Grid3X3 className="w-3.5 h-3.5" />}
      onToggle={() => toggleSection('orthoPresets')}
      title="正交视图"
    >
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => {
          const info = getOrthoPresetDisplayInfo(preset);

          return (
            <CardBtn
              active={activePreset === preset}
              key={preset}
              onClick={() => onSetPreset?.(preset)}
            >
              {icons[preset]}
              <span>{info.label}</span>
            </CardBtn>
          );
        })}
      </div>
    </CollapsibleSection>
  );
});

export type { CameraTabProps };

// 测量工具部分
interface MeasurementSectionProps {
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}

const MeasurementSection = memo<MeasurementSectionProps>(({ config, set }) => {
  const measurementService = getMeasurementService();

  const handleStartDistance = () => {
    measurementService.startTool('distance');
    set('measurementEnabled', true);
  };

  const handleStartAngle = () => {
    measurementService.startTool('angle');
    set('measurementEnabled', true);
  };

  const handleStop = () => {
    measurementService.stopTool();
    set('measurementEnabled', false);
  };

  const handleClear = () => {
    measurementService.clearAll();
  };

  return (
    <CollapsibleSection icon={<Ruler className="w-3.5 h-3.5" />} title="测量工具">
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <Btn
          active={
            config.measurementEnabled &&
            measurementService.getConfig().measurementType === 'distance'
          }
          onClick={handleStartDistance}
        >
          <Move3D className="w-4 h-4 mb-1" />
          <span>距离</span>
        </Btn>
        <Btn
          active={
            config.measurementEnabled && measurementService.getConfig().measurementType === 'angle'
          }
          onClick={handleStartAngle}
        >
          <Focus className="w-4 h-4 mb-1" />
          <span>角度</span>
        </Btn>
      </div>

      {config.measurementEnabled && (
        <>
          <div className="text-xs text-zinc-400 mb-2">点击场景中的点进行测量</div>
          <div className="grid grid-cols-2 gap-1.5">
            <Btn active={false} onClick={handleStop}>
              停止
            </Btn>
            <Btn active={false} onClick={handleClear}>
              清除
            </Btn>
          </div>
        </>
      )}
    </CollapsibleSection>
  );
});

CameraViewSection.displayName = 'CameraViewSection';
CameraModeSection.displayName = 'CameraModeSection';
MotionSection.displayName = 'MotionSection';
MeasurementSection.displayName = 'MeasurementSection';
ControlParamsSection.displayName = 'ControlParamsSection';
OrthoPresetSection.displayName = 'OrthoPresetSection';
CameraTab.displayName = 'CameraTab';
