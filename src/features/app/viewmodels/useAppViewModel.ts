import { useAppStore } from '@/stores/sharedStore';

export function useAppViewModel() {
  const state = useAppStore();

  return {
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
    toggleVideoLoop: state.toggleLoop,
    setPlaybackRate: state.setPlaybackRate,
  };
}
