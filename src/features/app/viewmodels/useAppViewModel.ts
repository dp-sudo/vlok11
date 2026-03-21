import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/sharedStore';

type AppStoreState = ReturnType<typeof useAppStore.getState>;
interface AppViewModelSource {
  currentAsset: AppStoreState['currentAsset'];
  currentTime: AppStoreState['currentTime'];
  duration: AppStoreState['duration'];
  error: AppStoreState['error'];
  exportState: AppStoreState['exportState'];
  finishExport: AppStoreState['finishExport'];
  isLooping: AppStoreState['isLooping'];
  isMuted: AppStoreState['isMuted'];
  isPlaying: AppStoreState['isPlaying'];
  pause: AppStoreState['pause'];
  playbackRate: AppStoreState['playbackRate'];
  progress: AppStoreState['progress'];
  resetSession: AppStoreState['resetSession'];
  result: AppStoreState['result'];
  setLooping: AppStoreState['setLooping'];
  setMuted: AppStoreState['setMuted'];
  setPlaybackRate: AppStoreState['setPlaybackRate'];
  setPlaying: AppStoreState['setPlaying'];
  setVideoDuration: AppStoreState['setVideoDuration'];
  setVideoTime: AppStoreState['setVideoTime'];
  startExport: AppStoreState['startExport'];
  status: AppStoreState['status'];
  statusMessage: AppStoreState['statusMessage'];
  toggleLoop: AppStoreState['toggleLoop'];
  togglePlay: AppStoreState['togglePlay'];
  updateExportProgress: AppStoreState['updateExportProgress'];
  uploadComplete: AppStoreState['uploadComplete'];
  uploadStart: AppStoreState['uploadStart'];
}

export interface AppViewModel {
  status: AppStoreState['status'];
  progress: AppStoreState['progress'];
  statusMessage: AppStoreState['statusMessage'];
  currentAsset: AppStoreState['currentAsset'];
  result: AppStoreState['result'];
  error: AppStoreState['error'];
  exportState: AppStoreState['exportState'];
  videoState: {
    currentTime: AppStoreState['currentTime'];
    duration: AppStoreState['duration'];
    isMuted: AppStoreState['isMuted'];
    isPlaying: AppStoreState['isPlaying'];
    isLooping: AppStoreState['isLooping'];
    playbackRate: AppStoreState['playbackRate'];
  };
  showUpload: boolean;
  showProcessing: boolean;
  showScene: boolean;
  uploadStart: AppStoreState['uploadStart'];
  uploadComplete: AppStoreState['uploadComplete'];
  resetSession: AppStoreState['resetSession'];
  startExport: AppStoreState['startExport'];
  updateExportProgress: AppStoreState['updateExportProgress'];
  finishExport: AppStoreState['finishExport'];
  setVideoDuration: AppStoreState['setVideoDuration'];
  setVideoTime: AppStoreState['setVideoTime'];
  toggleVideoPlay: AppStoreState['togglePlay'];
  setMuted: AppStoreState['setMuted'];
  setVideoLooping: AppStoreState['setLooping'];
  setVideoPlaying: AppStoreState['setPlaying'];
  toggleVideoLoop: AppStoreState['toggleLoop'];
  setPlaybackRate: AppStoreState['setPlaybackRate'];
  pauseVideo: AppStoreState['pause'];
}

const createAppViewModel = (state: AppViewModelSource): AppViewModel => ({
  status: state.status,
  progress: state.progress,
  statusMessage: state.statusMessage,
  currentAsset: state.currentAsset,
  result: state.result,
  error: state.error,
  exportState: state.exportState,

  videoState: {
    currentTime: state.currentTime,
    duration: state.duration,
    isMuted: state.isMuted,
    isPlaying: state.isPlaying,
    isLooping: state.isLooping,
    playbackRate: state.playbackRate,
  },

  showUpload: state.status === 'idle',
  showProcessing: ['uploading', 'analyzing', 'processing_depth', 'error'].includes(state.status),
  showScene: state.status === 'ready' && !!state.result,

  uploadStart: state.uploadStart,
  uploadComplete: state.uploadComplete,
  resetSession: state.resetSession,
  startExport: state.startExport,
  updateExportProgress: state.updateExportProgress,
  finishExport: state.finishExport,

  setVideoDuration: state.setVideoDuration,
  setVideoTime: state.setVideoTime,
  toggleVideoPlay: state.togglePlay,
  setMuted: state.setMuted,
  setVideoLooping: state.setLooping,
  setVideoPlaying: state.setPlaying,
  toggleVideoLoop: state.toggleLoop,
  setPlaybackRate: state.setPlaybackRate,
  pauseVideo: state.pause,
});

export function useAppViewModel(): AppViewModel;
export function useAppViewModel<T>(selector: (viewModel: AppViewModel) => T): T;
export function useAppViewModel<T>(selector?: (viewModel: AppViewModel) => T) {
  const source = useAppStore(
    useShallow((state) => ({
      currentAsset: state.currentAsset,
      currentTime: state.currentTime,
      duration: state.duration,
      error: state.error,
      exportState: state.exportState,
      finishExport: state.finishExport,
      isLooping: state.isLooping,
      isMuted: state.isMuted,
      isPlaying: state.isPlaying,
      pause: state.pause,
      playbackRate: state.playbackRate,
      progress: state.progress,
      resetSession: state.resetSession,
      result: state.result,
      setLooping: state.setLooping,
      setMuted: state.setMuted,
      setPlaybackRate: state.setPlaybackRate,
      setPlaying: state.setPlaying,
      setVideoDuration: state.setVideoDuration,
      setVideoTime: state.setVideoTime,
      startExport: state.startExport,
      status: state.status,
      statusMessage: state.statusMessage,
      toggleLoop: state.toggleLoop,
      togglePlay: state.togglePlay,
      updateExportProgress: state.updateExportProgress,
      uploadComplete: state.uploadComplete,
      uploadStart: state.uploadStart,
    }))
  );

  const viewModel = useMemo(() => createAppViewModel(source), [source]);

  return selector ? selector(viewModel) : viewModel;
}
