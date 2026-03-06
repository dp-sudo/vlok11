import type React from 'react';
import { memo, useCallback, useState } from 'react';

import { useAppViewModel } from '@/features/app/viewmodels/useAppViewModel';
import type { CameraViewPreset, SceneConfig } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';
import { ControlPanelCompound } from './compound';
import type { TabType } from './constants';

interface ControlPanelProps {
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

export const ControlPanel: React.FC<ControlPanelProps> = memo(
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
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      projection: true,
      depth: true,
      camera: true,
      motion: true,
      style: true,
      color: true,
      lighting: true,
      aiMotion: true,
      weather: true,
    });
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const config = useSceneStore((s) => s.config);
    const setConfig = useSceneStore((s) => s.setConfig);
    const resetConfig = useSceneStore((s) => s.resetConfig);
    const { exportState, setPlaybackRate, toggleVideoLoop } = useAppViewModel();

    const set = useCallback(
      <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => {
        setConfig((p) => ({ ...p, [k]: v }));
      },
      [setConfig]
    );

    const toggleSection = useCallback((key: string) => {
      setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const { isExporting } = exportState;

    return (
      <ControlPanelCompound
        activeCameraView={activeCameraView}
        activeTab={activeTab}
        config={config}
        expandedSections={expandedSections}
        hasVideo={hasVideo}
        hoveredItem={hoveredItem}
        isExporting={isExporting}
        isRecording={isRecording}
        onDownloadSnapshot={onDownloadSnapshot}
        onExportScene={onExportScene}
        onReset={resetConfig}
        onSetCameraView={onSetCameraView}
        onSetPlaybackRate={setPlaybackRate}
        onToggleRecording={onToggleRecording}
        onToggleVideoLoop={toggleVideoLoop}
        onVideoSeek={onVideoSeek}
        onVideoTogglePlay={onVideoTogglePlay}
        setConfig={set}
        setHoveredItem={setHoveredItem}
        toggleSection={toggleSection}
        videoState={videoState}
      >
        <ControlPanelCompound.Header
          isExporting={isExporting}
          isRecording={isRecording}
          onDownloadSnapshot={onDownloadSnapshot}
          onExportScene={onExportScene}
          onReset={resetConfig}
          onToggleRecording={onToggleRecording}
        />

        <ControlPanelCompound.TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <ControlPanelCompound.VideoControlsWrapper
          hasVideo={hasVideo}
          onSetPlaybackRate={setPlaybackRate}
          onToggleVideoLoop={toggleVideoLoop}
          onVideoSeek={onVideoSeek}
          onVideoTogglePlay={onVideoTogglePlay}
          videoMuted={config.videoMuted}
          videoState={videoState}
        />

        <ControlPanelCompound.Content
          activeCameraView={activeCameraView}
          activeTab={activeTab}
          onSetCameraView={onSetCameraView}
        />
      </ControlPanelCompound>
    );
  }
);

ControlPanel.displayName = 'ControlPanel';
