import { Loader2 } from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useAppViewModel } from '@/features/app/viewmodels/useAppViewModel';
import { useSceneStore } from '@/stores/sharedStore';

import { AITab } from './AITab';
import { CameraTab } from './CameraTab';
import { VideoControls } from './components';
import { MOTIONS, PROJECTIONS, RENDER_STYLES, type TabType } from './constants';
import { EffectsTab } from './EffectsTab';
import { ImmersiveTab } from './ImmersiveTab';
import { ControlPanelHeader, ControlPanelTabBar, SceneTab } from './parts';

import type { CameraViewPreset, SceneConfig } from '@/shared/types';

interface ControlPanelNewProps {
  activeCameraView?: CameraViewPreset | null;
  hasVideo: boolean;
  isRecording?: boolean;
  onDownloadSnapshot?: () => void;
  onExportScene?: () => void;
  onSetCameraView?: (view: CameraViewPreset) => void;
  onToggleRecording?: () => void;
  onVideoSeek?: (time: number) => void;
  onVideoTogglePlay?: () => void;
  videoState?: {
    currentTime: number;
    duration: number;
    isLooping: boolean;
    isPlaying: boolean;
    playbackRate: number;
  };
}

export const ControlPanelNew: React.FC<ControlPanelNewProps> = memo(
  ({
    hasVideo,
    videoState,
    onVideoTogglePlay,
    onVideoSeek,
    onSetCameraView,
    activeCameraView,
    onExportScene,
    onDownloadSnapshot,
    onToggleRecording,
    isRecording,
  }) => {
    const [activeTab, setActiveTab] = useState<TabType>('scene');
    const [sliderValue, setSliderValue] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      projection: true,
      depth: true,
      camera: true,
      motion: true,
      style: true,
      color: true,
      lighting: true,
      aiMotion: true,
      immersiveAudio: true,
      weather: true,
      emotionalTone: true,
    });
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const config = useSceneStore((s) => s.config);
    const setConfig = useSceneStore((s) => s.setConfig);
    const resetConfig = useSceneStore((s) => s.resetConfig);
    const { exportState, setPlaybackRate, toggleVideoLoop } = useAppViewModel();

    useEffect(() => {
      if (!dragging && videoState) setSliderValue(videoState.currentTime);
    }, [videoState, dragging]);

    const set = useCallback(
      <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => {
        setConfig((p) => ({ ...p, [k]: v }));
      },
      [setConfig]
    );

    const toggleSection = useCallback((key: string) => {
      setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

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
    const { isExporting } = exportState;

    return (
      <div className="w-80 bg-zinc-900/98 backdrop-blur-md flex flex-col h-full border-l border-zinc-800/80 shadow-2xl relative">
        {isExporting ? (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <div className="text-sm font-medium text-white">
                {exportState.format ? `导出 ${exportState.format.toUpperCase()}...` : '导出中...'}
              </div>
              <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${exportState.progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        <ControlPanelHeader
          isExporting={isExporting}
          isRecording={isRecording}
          onDownloadSnapshot={onDownloadSnapshot}
          onExportScene={onExportScene}
          onReset={resetConfig}
          onToggleRecording={onToggleRecording}
        />

        <ControlPanelTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {hasVideo && videoState ? (
          <VideoControls
            isLooping={videoState.isLooping}
            onDragEnd={() => setDragging(false)}
            onDragStart={() => setDragging(true)}
            onSeek={onVideoSeek}
            onSetPlaybackRate={setPlaybackRate}
            onSliderChange={setSliderValue}
            onToggleLoop={toggleVideoLoop}
            onToggleMute={() => set('videoMuted', !config.videoMuted)}
            onTogglePlay={onVideoTogglePlay}
            playbackRate={videoState.playbackRate}
            sliderValue={sliderValue}
            videoMuted={config.videoMuted}
            videoState={videoState}
          />
        ) : null}

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="p-3 space-y-1">
            {activeTab === 'scene' && (
              <SceneTab
                activeProjection={activeProjection}
                config={config}
                expandedSections={expandedSections}
                hoveredItem={hoveredItem}
                set={set}
                setHoveredItem={setHoveredItem}
                toggleSection={toggleSection}
              />
            )}

            {activeTab === 'camera' && (
              <CameraTab
                activeCameraView={activeCameraView}
                activeMotion={activeMotion}
                config={config}
                expandedSections={expandedSections}
                onSetCameraView={onSetCameraView}
                set={set}
                toggleSection={toggleSection}
              />
            )}

            {activeTab === 'effects' && (
              <EffectsTab
                activeStyle={activeStyle}
                config={config}
                expandedSections={expandedSections}
                set={set}
                toggleSection={toggleSection}
              />
            )}

            {activeTab === 'immersive' && (
              <ImmersiveTab
                config={config}
                expandedSections={expandedSections}
                set={set}
                toggleSection={toggleSection}
              />
            )}

            {activeTab === 'ai' && <AITab config={config} set={set} />}
          </div>
        </div>
      </div>
    );
  }
);

ControlPanelNew.displayName = 'ControlPanelNew';
