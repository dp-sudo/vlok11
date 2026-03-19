import { ErrorBoundaryWithRecovery, MobileDrawer } from '@/shared/components';
import { Loader2, Sparkles } from 'lucide-react';
import { lazy, memo, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { getErrorHandler } from '@/core/ErrorHandler';
import { createLogger } from '@/core/Logger';
import { useAIMotion } from '@/features/ai/hooks/useAIMotion';
import { useAppViewModel } from '@/features/app/viewmodels/useAppViewModel';
import { ControlPanel } from '@/features/controls';
import { FloatingControls } from '@/features/controls/FloatingControls';
import { NeuralRenderView } from '@/features/render';
import type { SceneViewerHandle } from '@/features/scene';
import { useSceneConfigSubscriber } from '@/features/scene/hooks/useSceneConfigSubscriber';
import { useWeatherEffect } from '@/features/scene/hooks/useWeatherEffect';
import { StatusDisplay, UploadPanel } from '@/features/upload';
import { TitleBar } from '@/shared/components/layout/TitleBar';
import { useProjectShortcuts } from '@/shared/hooks/useProjectShortcuts';
import type { CameraViewPreset, ProcessingState } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

const SceneViewer = lazy(() =>
  import('@/features/scene').then((module) => ({ default: module.SceneViewer }))
);

const ModelManagerLazy = lazy(() =>
  import('@/features/ai/components/ModelManager').then((module) => ({
    default: module.ModelManager,
  }))
);

const SettingsModalLazy = lazy(() =>
  import('@/features/settings/components/SettingsModal').then((module) => ({
    default: module.SettingsModal,
  }))
);

const logger = createLogger({ module: 'App' });

type AppCameraView = CameraViewPreset | 'default';

const App = memo(() => {
  const vm = useAppViewModel();

  useProjectShortcuts();

  const sceneConfig = useSceneStore((s) => s.config);

  useAIMotion(sceneConfig);
  useWeatherEffect(sceneConfig);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [modelManagerOpen, setModelManagerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeCameraView, setActiveCameraView] = useState<AppCameraView>('default');
  const [isRecording, setIsRecording] = useState(false);
  const [showNeuralRender, setShowNeuralRender] = useState(false);

  const { videoState, setVideoTime, setVideoDuration, toggleVideoPlay } = vm;

  const sceneRef = useRef<SceneViewerHandle>(null);

  useSceneConfigSubscriber();

  const handleFileUpload = (file: File) => {
    if (file) vm.uploadStart(file);
  };

  const handleUrlSubmit = (url: string) => {
    if (url.trim()) {
      vm.uploadStart(url.trim());
    }
  };

  const handleSetCameraView = useCallback((view: CameraViewPreset) => {
    setActiveCameraView(view);
    sceneRef.current?.setCameraView(view);
  }, []);

  const handleVideoSeek = useCallback(
    (time: number) => {
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
    },
    [setVideoTime]
  );

  const handleExportScene = useCallback(() => sceneRef.current?.exportScene(), []);
  const handleDownloadSnapshot = useCallback(() => sceneRef.current?.downloadSnapshot(), []);
  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      sceneRef.current?.stopRecording();
      setIsRecording(false);
    } else {
      sceneRef.current?.startRecording(true);
      setIsRecording(true);
    }
  }, [isRecording]);

  const controlPanelProps = useMemo(
    () => ({
      hasVideo: vm.currentAsset?.type === 'video',
      videoState,
      onVideoTogglePlay: toggleVideoPlay,
      onVideoSeek: handleVideoSeek,
      onSetCameraView: handleSetCameraView,
      activeCameraView: activeCameraView === 'default' ? null : activeCameraView,
      onExportScene: handleExportScene,
      onDownloadSnapshot: handleDownloadSnapshot,
      onToggleRecording: handleToggleRecording,
      isRecording,
    }),
    [
      vm.currentAsset?.type,
      videoState,
      toggleVideoPlay,
      handleVideoSeek,
      handleSetCameraView,
      activeCameraView,
      handleExportScene,
      handleDownloadSnapshot,
      handleToggleRecording,
      isRecording,
    ]
  );

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden flex flex-col">
      <TitleBar
        onOpenModelManager={() => setModelManagerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Neural Render Toggle */}
      {vm.showScene && (
        <button
          type="button"
          aria-pressed={showNeuralRender}
          onClick={() => setShowNeuralRender(!showNeuralRender)}
          className={`
            fixed top-14 md:top-16 right-2 md:right-4 z-50
            flex items-center gap-2 px-3 py-2 rounded-lg
            border transition-all duration-300 group
            touch-optimized
            ${showNeuralRender
              ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5),0_0_40px_rgba(168,85,247,0.3)]'
              : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }
          `}
        >
          <Sparkles className={`w-4 h-4 ${showNeuralRender ? 'text-cyan-300' : 'text-zinc-500'} group-hover:text-cyan-300 transition-colors`} />
          <span className={`text-xs font-mono tracking-wider hidden sm:inline ${showNeuralRender ? 'text-cyan-300' : 'text-zinc-500'} group-hover:text-white transition-colors`}>
            {showNeuralRender ? '退出神经渲染' : '神经渲染'}
          </span>
        </button>
      )}

      <div className="flex-1 flex flex-col overflow-hidden pt-12">
        <main className="flex-1 flex overflow-hidden">
          {vm.showUpload ? (
            <div className="flex-1 flex items-center justify-center">
              <UploadPanel
                acceptedFormats=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
                onFileUpload={handleFileUpload}
                onUrlSubmit={handleUrlSubmit}
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
              <div className="flex-1 relative bg-zinc-950">
                <Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center bg-zinc-950 text-cyan-500 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-mono text-sm tracking-widest">正在加载 3D 引擎...</span>
                    </div>
                  }
                >
                  {showNeuralRender ? (
                    <NeuralRenderView className="w-full h-full" />
                  ) : (
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
                  )}
                </Suspense>

                <FloatingControls
                  activeCameraView={activeCameraView}
                  onSetCameraView={handleSetCameraView}
                />
              </div>

              {/* Control Panel - Show on md+ for tablets, hide on mobile (use drawer) */}
              <div className="w-full md:w-80 overflow-y-auto z-10 shadow-xl hidden md:block h-full">
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

      <ModelManagerLazy isOpen={modelManagerOpen} onClose={() => setModelManagerOpen(false)} />
      {settingsOpen ? <SettingsModalLazy onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  );
});

const AppWithBoundary = memo(() => {
  return (
    <ErrorBoundaryWithRecovery>
      <App />
    </ErrorBoundaryWithRecovery>
  );
});

AppWithBoundary.displayName = 'AppWithBoundary';

export { AppWithBoundary as App };
