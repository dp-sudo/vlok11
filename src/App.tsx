import { Loader2 } from 'lucide-react';
import { lazy, memo, Suspense, useRef, useState } from 'react';
import { getErrorHandler } from '@/core/ErrorHandler';
import { createLogger } from '@/core/Logger';
import { ModelManager } from '@/features/ai/components/ModelManager';
import { useAppViewModel } from '@/features/app/viewmodels/useAppViewModel';
import { ControlPanel } from '@/features/controls';
import { FloatingControls } from '@/features/controls/FloatingControls';
import type { SceneViewerHandle } from '@/features/scene';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import { StatusDisplay, UploadPanel } from '@/features/upload';
import { MobileDrawer } from '@/shared/components';
import { TitleBar } from '@/shared/components/layout/TitleBar';
import { useAIMotion } from '@/shared/hooks/useAIMotion';
import { useProjectShortcuts } from '@/shared/hooks/useProjectShortcuts';
import { useSceneConfigSubscriber } from '@/shared/hooks/useSceneConfigSubscriber';
import { useWeatherEffect } from '@/shared/hooks/useWeatherEffect';
import type { CameraViewPreset, ProcessingState } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

// Lazy load SceneViewer to optimize initial bundle size
const SceneViewer = lazy(() =>
  import('@/features/scene').then((module) => ({ default: module.SceneViewer }))
);

const logger = createLogger({ module: 'App' });

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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    try {
      if (!sceneRef.current?.seekVideo) {
        const errorHandler = getErrorHandler();
        const appError = errorHandler.handle(new Error('Video seek not available'), {
          context: 'video-seek',
        });

        logger.warn('Video seek unavailable', { context: appError.context });

        return;
      }

      const success = sceneRef.current.seekVideo(time);

      if (success) {
        setVideoTime(time);
      } else {
        const errorHandler = getErrorHandler();

        errorHandler.handle(new Error('Video seek operation failed'), { context: 'video-seek' });
      }
    } catch (error) {
      const errorHandler = getErrorHandler();

      errorHandler.handle(error instanceof Error ? error : new Error(String(error)), {
        context: 'video-seek',
      });
      logger.error('Video seek error', { error });
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
      <TitleBar
        onOpenModelManager={() => setModelManagerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden pt-12">
        {/* Main Content Area - pt-12 added above for TitleBar offset if needed, or if TitleBar is fixed. TitleBar is fixed (Step 365 line 8). Layout needs to account for it. 
            Before: AppHeader was flex-none h-16.
            Now: No AppHeader. TitleBar is fixed top.
            We need padding-top on the container equal to TitleBar height (h-12 = 3rem = 48px).
            Wait, TitleBar has 'fixed top-0'.
            So content needs 'pt-12'.
            The previous AppHeader was IN THE FLEX FLOW.
            So removing AppHeader means content slides up.
            If TitleBar is fixed, we definitely need pt-12 on the container.
            I added `pt-12` to the `flex-col` container.
        */}

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
                <Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center bg-zinc-950 text-cyan-500 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-mono text-sm tracking-widest">
                        LOADING 3D ENGINE...
                      </span>
                    </div>
                  }
                >
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
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  );
});

export { App };

App.displayName = 'App';
