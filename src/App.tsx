import { Suspense, lazy, memo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { ModelManager } from '@/features/ai/components/ModelManager';
import { useAppViewModel } from '@/features/app/viewmodels/useAppViewModel';
import { ControlPanel } from '@/features/controls';
import { FloatingControls } from '@/features/controls/FloatingControls';
import type { SceneViewerHandle } from '@/features/scene';
import { StatusDisplay, UploadPanel } from '@/features/upload';
import { AppHeader, MobileDrawer } from '@/shared/components';
import { TitleBar } from '@/shared/components/layout/TitleBar';

import { useAIMotion } from '@/shared/hooks/useAIMotion';
import { useProjectShortcuts } from '@/shared/hooks/useProjectShortcuts';
import { useSceneConfigSubscriber } from '@/shared/hooks/useSceneConfigSubscriber';
import { useWeatherEffect } from '@/shared/hooks/useWeatherEffect';
import type { CameraViewPreset, ProcessingState } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

// Lazy load SceneViewer to optimize initial bundle size
const SceneViewer = lazy(() => import('@/features/scene').then(module => ({ default: module.SceneViewer })));

type AppCameraView = CameraViewPreset | 'default';

const App = memo(() => {
  const vm = useAppViewModel();

  useProjectShortcuts();

  // 场景配置
  const sceneConfig = useSceneStore((s) => s.config);

  useAIMotion(sceneConfig);
  useWeatherEffect(sceneConfig);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [modelManagerOpen, setModelManagerOpen] = useState(false);
  const [activeCameraView, setActiveCameraView] = useState<AppCameraView>('default');
  const [isRecording, setIsRecording] = useState(false);

  const { videoState, setVideoTime, setVideoDuration, toggleVideoPlay } = vm;

  const sceneRef = useRef<SceneViewerHandle>(null);

  useSceneConfigSubscriber();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) vm.uploadStart(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      vm.uploadStart(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleSetCameraView = (view: CameraViewPreset) => {
    setActiveCameraView(view);
    sceneRef.current?.setCameraView(view);
  };

  const handleVideoSeek = (time: number) => {
    if (!sceneRef.current?.seekVideo) {
      console.warn('Video seek not available');

      return;
    }

    const success = sceneRef.current.seekVideo(time);

    if (success) {
      setVideoTime(time);
    }
  };

  const controlPanelProps = {
    hasVideo: vm.currentAsset?.type === 'video',
    videoState,
    onVideoTogglePlay: toggleVideoPlay,
    onVideoSeek: handleVideoSeek,
    onSetCameraView: handleSetCameraView,
    activeCameraView: activeCameraView === 'default' ? null : activeCameraView,
    onExportScene: () => sceneRef.current?.exportScene(),
    onDownloadSnapshot: () => sceneRef.current?.downloadSnapshot(),
    onToggleRecording: () => {
      if (isRecording) {
        sceneRef.current?.stopRecording();
        setIsRecording(false);
      } else {
        sceneRef.current?.startRecording(true);
        setIsRecording(true);
      }
    },
    isRecording,
  };

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden flex flex-col">
      <TitleBar onOpenModelManager={() => setModelManagerOpen(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />

        <main className="flex-1 flex overflow-hidden">
          {/* ... main content */}
          {vm.showUpload ? (
            <div className="flex-1 flex items-center justify-center">
              <UploadPanel
                acceptedFormats=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
                onFileUpload={handleFileUpload}
                onUrlSubmit={handleUrlSubmit}
                setShowUrlInput={setShowUrlInput}
                setUrlInput={setUrlInput}
                showUrlInput={showUrlInput}
                urlInput={urlInput}
              />
            </div>
          ) : null}

          {vm.showProcessing ? (
            <div className="flex-1 flex items-center justify-center">
              <StatusDisplay
                onRetry={vm.resetSession}
                processingState={{
                  status: vm.status as ProcessingState['status'],
                  progress: vm.progress,
                  message: vm.statusMessage ?? '',
                }}
              />
            </div>
          ) : null}

          {vm.showScene && vm.result ? (
            <>
              {/* Scene Container */}
              <div className="flex-1 relative bg-zinc-950">
                <Suspense fallback={
                  <div className="flex-1 flex items-center justify-center bg-zinc-950 text-cyan-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-mono text-sm tracking-widest">LOADING 3D ENGINE...</span>
                  </div>
                }>
                  <SceneViewer
                    aspectRatio={vm.result.asset.aspectRatio}
                    backgroundUrl={vm.result.backgroundUrl ?? null}
                    depthUrl={vm.result.depthMapUrl}
                    imageUrl={vm.result.imageUrl}
                    isLooping={vm.videoState.isLooping}
                    isVideoPlaying={vm.videoState.isPlaying}
                    onVideoDurationChange={setVideoDuration}
                    onVideoEnded={() => toggleVideoPlay()}
                    onVideoTimeUpdate={setVideoTime}
                    playbackRate={vm.videoState.playbackRate}
                    ref={sceneRef}
                    videoUrl={vm.result.asset.type === 'video' ? vm.result.asset.sourceUrl : null}
                  />
                </Suspense>

                {/* INDUSTRIAL HUD OVERLAY */}
                <FloatingControls
                  activeCameraView={activeCameraView}
                  onSetCameraView={handleSetCameraView}
                />
              </div>

              {/* Side Panel - Glassmorphism */}
              <div className="w-80 overflow-y-auto z-10 shadow-xl hidden lg:block">
                <ControlPanel {...controlPanelProps} />
              </div>
            </>
          ) : null}
        </main>
      </div>

      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpen={() => setMobileDrawerOpen(true)}
      >
        {vm.showScene ? <ControlPanel {...controlPanelProps} /> : null}
      </MobileDrawer>

      <ModelManager isOpen={modelManagerOpen} onClose={() => setModelManagerOpen(false)} />
    </div>
  );
});

export { App };

App.displayName = 'App';
