import { Loader2, Search, X } from 'lucide-react';
import type React from 'react';
import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
  videoState?:
    | {
        currentTime: number;
        duration: number;
        isLooping: boolean;
        isPlaying: boolean;
        playbackRate: number;
      }
    | undefined;
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
  searchQuery?: string;
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
  videoState?:
    | {
        currentTime: number;
        duration: number;
        isLooping: boolean;
        isPlaying: boolean;
        playbackRate: number;
      }
    | undefined;
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
const ControlPanelCompoundInner: React.FC<ControlPanelCompoundProps> = memo(
  (props: ControlPanelCompoundProps) => {
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

    const [searchQuery, setSearchQuery] = useState('');

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
        searchQuery,
        setSearchQuery,
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
        searchQuery,
      ]
    );

    return (
      <ControlPanelContext.Provider value={ctxValue}>
        <div className="w-full lg:w-80 bg-zinc-950/90 backdrop-blur-xl flex flex-col h-full border-l border-white/10 shadow-2xl relative text-zinc-100">
          {/* 搜索栏 */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                className="w-full pl-9 pr-8 py-2 bg-zinc-900/80 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索参数..."
                type="text"
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                  onClick={() => setSearchQuery('')}
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {isExporting ? (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                <div className="text-sm font-semibold text-slate-200">导出中...</div>
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </ControlPanelContext.Provider>
    );
  }
);

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

    // Track dragging state for proper seek handling
    const [isDragging, setIsDragging] = useState(false);
    const [dragTime, setDragTime] = useState(0);

    const handleDragStart = useCallback(() => {
      setIsDragging(true);
    }, []);

    const handleDragEnd = useCallback(() => {
      setIsDragging(false);
      // Only seek when drag ends
      if (onVideoSeek && dragTime > 0) {
        onVideoSeek(dragTime);
      }
    }, [onVideoSeek, dragTime]);

    const handleSliderChange = useCallback((time: number) => {
      setDragTime(time);
    }, []);

    if (!hasVideo || !videoState) return null;

    // Determine if we should call onSeek during drag (only on drag end)
    const handleSeek = isDragging ? undefined : onVideoSeek;

    return (
      <VideoControls
        isLooping={videoState.isLooping}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onSeek={handleSeek}
        onSetPlaybackRate={onSetPlaybackRate}
        onSliderChange={handleSliderChange}
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
const TabBar: React.FC<TabBarProps> = memo(({ activeTab, onTabChange }) => {
  const { searchQuery } = useControlPanel();

  return (
    <>
      <ControlPanelTabBar activeTab={activeTab} onTabChange={onTabChange} />
      {searchQuery && (
        <div className="px-3 pb-2">
          <div className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
            搜索: "{searchQuery}" - 切换Tab查看筛选结果
          </div>
        </div>
      )}
    </>
  );
});

// Content sub-component - renders the active tab
const Content: React.FC<ContentProps> = memo(({ activeTab, activeCameraView, onSetCameraView }) => {
  const {
    config,
    setConfig,
    expandedSections,
    toggleSection,
    hoveredItem,
    setHoveredItem,
    activeProjection,
    activeStyle,
    activeMotion,
    searchQuery,
  } = useControlPanel();

  // 搜索过滤 - 过滤tab显示
  const showContent =
    !searchQuery ||
    activeTab === 'scene' ||
    activeTab === 'camera' ||
    activeTab === 'effects' ||
    activeTab === 'immersive' ||
    activeTab === 'ai';

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="p-3 space-y-1">
        {showContent && activeTab === 'scene' && (
          <SceneTab
            activeProjection={activeProjection}
            config={config}
            expandedSections={expandedSections}
            hoveredItem={hoveredItem}
            searchQuery={searchQuery}
            set={setConfig}
            setHoveredItem={setHoveredItem}
            toggleSection={toggleSection}
          />
        )}

        {showContent && activeTab === 'camera' && (
          <CameraTab
            {...(activeCameraView !== undefined
              ? { activeCameraView: activeCameraView ?? null }
              : {})}
            activeMotion={activeMotion}
            config={config}
            expandedSections={expandedSections}
            searchQuery={searchQuery}
            {...(onSetCameraView ? { onSetCameraView } : {})}
            set={setConfig}
            toggleSection={toggleSection}
          />
        )}

        {showContent && activeTab === 'effects' && (
          <EffectsTab
            activeStyle={activeStyle}
            config={config}
            expandedSections={expandedSections}
            searchQuery={searchQuery}
            set={setConfig}
            toggleSection={toggleSection}
          />
        )}

        {showContent && activeTab === 'immersive' && (
          <ImmersiveTab
            config={config}
            expandedSections={expandedSections}
            searchQuery={searchQuery}
            set={setConfig}
            toggleSection={toggleSection}
          />
        )}

        {showContent && activeTab === 'ai' && (
          <AITab config={config} set={setConfig} searchQuery={searchQuery} />
        )}
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

export type {
  ContentProps,
  ControlPanelCompoundProps,
  ControlPanelContextValue,
  HeaderProps,
  TabBarProps,
  VideoControlsWrapperProps,
};
export { ControlPanelCompound };
