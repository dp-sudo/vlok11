import { Loader2 } from 'lucide-react';
import type React from 'react';
import { createContext, memo, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { CameraViewPreset, SceneConfig } from '@/shared/types';
import { AITab } from '../AITab';
import { CameraTab } from '../CameraTab';
import { VideoControls } from '../components';
import { MOTIONS, PROJECTIONS, RENDER_STYLES, type TabType } from '../constants';
import { EffectsTab } from '../EffectsTab';
import { ImmersiveTab } from '../ImmersiveTab';
import { ControlPanelHeader, ControlPanelTabBar, SceneTab } from '../parts';

interface ControlPanelContextValue {
  config: SceneConfig;
  setConfig: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  hoveredItem: string | null;
  setHoveredItem: (item: string | null) => void;
  activeProjection: (typeof PROJECTIONS)[number] | undefined;
  activeStyle: (typeof RENDER_STYLES)[number] | undefined;
  activeMotion: (typeof MOTIONS)[number] | undefined;
}

const ControlPanelContext = createContext<ControlPanelContextValue | null>(null);

export const useControlPanel = () => {
  const ctx = useContext(ControlPanelContext);

  if (!ctx) throw new Error('useControlPanel must be used within ControlPanelCompound');

  return ctx;
};

// Props interfaces for sub-components - using flexible optional types
interface HeaderProps {
  isExporting: boolean;
  isRecording?: boolean | undefined;
  onDownloadSnapshot?: (() => void) | undefined;
  onExportScene?: (() => void) | undefined;
  onReset: () => void;
  onToggleRecording?: (() => void) | undefined;
}

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface VideoControlsWrapperProps {
  hasVideo: boolean;
  videoState?: {
    currentTime: number;
    duration: number;
    isLooping: boolean;
    isPlaying: boolean;
    playbackRate: number;
  } | undefined;
  onVideoTogglePlay?: (() => void) | undefined;
  onVideoSeek?: ((time: number) => void) | undefined;
  onSetPlaybackRate: (rate: number) => void;
  onToggleVideoLoop: () => void;
  videoMuted: boolean;
}

interface ContentProps {
  activeTab: TabType;
  activeCameraView?: CameraViewPreset | null | undefined;
  onSetCameraView?: ((view: CameraViewPreset) => void) | undefined;
}

interface ControlPanelCompoundProps {
  children: ReactNode;
  config: SceneConfig;
  setConfig: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  hoveredItem: string | null;
  setHoveredItem: (item: string | null) => void;
  isExporting: boolean;
  activeTab: TabType;
  hasVideo: boolean;
  videoState?: {
    currentTime: number;
    duration: number;
    isLooping: boolean;
    isPlaying: boolean;
    playbackRate: number;
  } | undefined;
  onVideoTogglePlay?: (() => void) | undefined;
  onVideoSeek?: ((time: number) => void) | undefined;
  onSetPlaybackRate: (rate: number) => void;
  onToggleVideoLoop: () => void;
  onReset: () => void;
  activeCameraView?: CameraViewPreset | null | undefined;
  onSetCameraView?: ((view: CameraViewPreset) => void) | undefined;
  onDownloadSnapshot?: (() => void) | undefined;
  onExportScene?: (() => void) | undefined;
  onToggleRecording?: (() => void) | undefined;
  isRecording?: boolean | undefined;
}

// Main compound component
const ControlPanelCompoundInner: React.FC<ControlPanelCompoundProps> = memo((props: ControlPanelCompoundProps) => {
  const {
    children,
    config,
    setConfig,
    expandedSections,
    toggleSection,
    hoveredItem,
    setHoveredItem,
    isExporting,
  } = props;

  const activeProjection = useMemo(
    () => PROJECTIONS.find((p) => p.mode === config.projectionMode),
    [config.projectionMode]
  );

  const activeStyle = useMemo(
    () => RENDER_STYLES.find((r) => r.style === config.renderStyle),
    [config.renderStyle]
  );

  const activeMotion = useMemo(
    () => MOTIONS.find((m) => m.type === config.cameraMotionType),
    [config.cameraMotionType]
  );

  const ctxValue = useMemo(
    () => ({
      config,
      setConfig,
      expandedSections,
      toggleSection,
      hoveredItem,
      setHoveredItem,
      activeProjection,
      activeStyle,
      activeMotion,
    }),
    [
      config,
      setConfig,
      expandedSections,
      toggleSection,
      hoveredItem,
      setHoveredItem,
      activeProjection,
      activeStyle,
      activeMotion,
    ]
  );

  return (
    <ControlPanelContext.Provider value={ctxValue}>
      <div className="w-full lg:w-80 bg-zinc-950/90 backdrop-blur-xl flex flex-col h-full border-l border-white/10 shadow-2xl relative text-zinc-100">
        {isExporting ? (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              <div className="text-sm font-semibold text-slate-200">
                导出中...
              </div>
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </ControlPanelContext.Provider>
  );
});

// VideoControlsWrapper component
const VideoControlsWrapper: React.FC<VideoControlsWrapperProps> = memo(
  ({
    hasVideo,
    videoState,
    onVideoTogglePlay,
    onVideoSeek,
    onSetPlaybackRate,
    onToggleVideoLoop,
    videoMuted,
  }) => {
    const { config, setConfig } = useControlPanel();

    const handleToggleMute = useCallback(() => {
      setConfig('videoMuted', !config.videoMuted);
    }, [config.videoMuted, setConfig]);

    if (!hasVideo || !videoState) return null;

    return (
      <VideoControls
        isLooping={videoState.isLooping}
        onDragEnd={() => {}}
        onDragStart={() => {}}
        {...(onVideoSeek ? { onSeek: onVideoSeek } : {})}
        onSetPlaybackRate={onSetPlaybackRate}
        onSliderChange={() => {}}
        onToggleLoop={onToggleVideoLoop}
        onToggleMute={handleToggleMute}
        {...(onVideoTogglePlay ? { onTogglePlay: onVideoTogglePlay } : {})}
        playbackRate={videoState.playbackRate}
        sliderValue={videoState.currentTime}
        videoMuted={videoMuted}
        videoState={videoState}
      />
    );
  }
);

// Header sub-component
const Header: React.FC<HeaderProps> = memo(
  ({ isExporting, isRecording, onDownloadSnapshot, onExportScene, onReset, onToggleRecording }) => (
    <ControlPanelHeader
      isExporting={isExporting}
      {...(isRecording !== undefined ? { isRecording } : {})}
      {...(onDownloadSnapshot ? { onDownloadSnapshot } : {})}
      {...(onExportScene ? { onExportScene } : {})}
      onReset={onReset}
      {...(onToggleRecording ? { onToggleRecording } : {})}
    />
  )
);

// TabBar sub-component
const TabBar: React.FC<TabBarProps> = memo(({ activeTab, onTabChange }) => (
  <ControlPanelTabBar activeTab={activeTab} onTabChange={onTabChange} />
));

// Content sub-component - renders the active tab
const Content: React.FC<ContentProps> = memo(({ activeTab, activeCameraView, onSetCameraView }) => {
  const { config, setConfig, expandedSections, toggleSection, hoveredItem, setHoveredItem, activeProjection, activeStyle, activeMotion } = useControlPanel();

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="p-3 space-y-1">
        {activeTab === 'scene' && (
          <SceneTab
            activeProjection={activeProjection}
            config={config}
            expandedSections={expandedSections}
            hoveredItem={hoveredItem}
            set={setConfig}
            setHoveredItem={setHoveredItem}
            toggleSection={toggleSection}
          />
        )}

        {activeTab === 'camera' && (
          <CameraTab
            {...(activeCameraView !== undefined ? { activeCameraView: activeCameraView ?? null } : {})}
            activeMotion={activeMotion}
            config={config}
            expandedSections={expandedSections}
            {...(onSetCameraView ? { onSetCameraView } : {})}
            set={setConfig}
            toggleSection={toggleSection}
          />
        )}

        {activeTab === 'effects' && (
          <EffectsTab
            activeStyle={activeStyle}
            config={config}
            expandedSections={expandedSections}
            set={setConfig}
            toggleSection={toggleSection}
          />
        )}

        {activeTab === 'immersive' && (
          <ImmersiveTab
            config={config}
            expandedSections={expandedSections}
            set={setConfig}
            toggleSection={toggleSection}
          />
        )}

        {activeTab === 'ai' && <AITab config={config} set={setConfig} />}
      </div>
    </div>
  );
});

// Create compound component with sub-components
const ControlPanelCompound = Object.assign(ControlPanelCompoundInner, {
  Header,
  TabBar,
  VideoControlsWrapper,
  Content,
});

ControlPanelCompound.displayName = 'ControlPanelCompound';

export type { ControlPanelContextValue, ControlPanelCompoundProps, HeaderProps, TabBarProps, VideoControlsWrapperProps, ContentProps };
export { ControlPanelCompound };
