import { forwardRef, memo, useImperativeHandle, useRef } from 'react';
import type { Group, VideoTexture } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import type { CameraPresetType } from '@/features/scene/services/camera';
import {
  calculateDistance,
  calculatePresetPoseForProjection,
} from '@/features/scene/services/camera';
import { PerformanceOverlay } from '@/shared/components';
import { WebcamTracker } from './components/effects';
import type { CameraViewPreset } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';
import type { ExporterRef, RecordingRef } from './components';
import { Scene3DContent, SceneEffectsLayer } from './components';
import { useColorGrade, useVideoControl } from './hooks';

export interface SceneViewerHandle {
  captureVideoFrame: () => void;
  downloadSnapshot: () => void;
  exportScene: () => void;
  seekVideo: (time: number) => boolean;
  setCameraView: (view: CameraViewPreset) => void;
  startRecording: (withAudio?: boolean) => void;
  stopRecording: () => void;
}
interface SceneViewerProps {
  aspectRatio: number;
  backgroundUrl: string | null;
  depthUrl: string | null;
  imageUrl: string | null;
  isLooping: boolean;
  isVideoPlaying: boolean;
  onVideoDurationChange?: (duration: number) => void;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (time: number) => void;
  playbackRate: number;
  videoUrl: string | null;
}

export const SceneViewer = memo(
  forwardRef<SceneViewerHandle, SceneViewerProps>((props, ref) => {
    const {
      imageUrl,
      depthUrl,
      backgroundUrl,
      videoUrl,
      aspectRatio,
      isVideoPlaying,
      isLooping,
      playbackRate,
      onVideoTimeUpdate,
      onVideoDurationChange,
      onVideoEnded,
    } = props;
    // 合并为单次订阅，避免多次重渲染
    const config = useSceneStore((state) => state.config);
    const { renderStyle, enableVignette, exposure, enableFaceTracking, vignetteStrength } = config;
    const exporterRef = useRef<ExporterRef>(null);
    const recorderRef = useRef<RecordingRef>(null);
    const controlsRef = useRef<OrbitControlsType | null>(null);
    const videoTextureRef = useRef<VideoTexture | null>(null);
    const sceneGroupRef = useRef<Group>(null);
    const colorGradeStyle = useColorGrade();
    const { seek } = useVideoControl({
      videoTextureRef,
      isPlaying: isVideoPlaying,
      isLooping,
      playbackRate,
      ...(onVideoTimeUpdate ? { onTimeUpdate: onVideoTimeUpdate } : {}),
      ...(onVideoDurationChange ? { onDurationChange: onVideoDurationChange } : {}),
      ...(onVideoEnded ? { onEnded: onVideoEnded } : {}),
    });

    useImperativeHandle(ref, () => ({
      exportScene: () => exporterRef.current?.exportScene(),
      downloadSnapshot: () => exporterRef.current?.downloadSnapshot(),
      captureVideoFrame: () => recorderRef.current?.captureVideoFrame(),
      startRecording: (withAudio) => recorderRef.current?.startRecording(withAudio),
      stopRecording: () => recorderRef.current?.stopRecording(),
      seekVideo: seek,
      setCameraView: (view) => {
        const controls = controlsRef.current;

        if (!controls) return;
        const camera = controls.object;
        const currentDist = calculateDistance(
          { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          { x: controls.target.x, y: controls.target.y, z: controls.target.z }
        );
        const presetPose = calculatePresetPoseForProjection(
          view as CameraPresetType,
          config.projectionMode,
          config.isImmersive,
          currentDist
        );

        camera.position.set(presetPose.position.x, presetPose.position.y, presetPose.position.z);
        controls.target.set(presetPose.target.x, presetPose.target.y, presetPose.target.z);
        controls.update();
      },
    }));
    if (!imageUrl || !depthUrl) return null;

    return (
      <div
        className="w-full h-full bg-black relative rounded-lg overflow-hidden shadow-2xl border border-zinc-800 transition-all duration-200"
        style={colorGradeStyle}
      >
        <PerformanceOverlay position="bottom-left" visible />
        {enableFaceTracking && <WebcamTracker />}

        <SceneEffectsLayer
          enableVignette={enableVignette}
          renderStyle={renderStyle}
          vignetteStrength={vignetteStrength}
          config={config}
        />

        <Scene3DContent
          aspectRatio={aspectRatio}
          backgroundUrl={backgroundUrl}
          config={config}
          depthUrl={depthUrl}
          exposure={exposure}
          imageUrl={imageUrl}
          sceneGroupRef={sceneGroupRef}
          videoTextureRef={videoTextureRef}
          videoUrl={videoUrl}
          exporterRef={exporterRef}
          recorderRef={recorderRef}
          controlsRef={controlsRef}
        />
      </div>
    );
  })
);

SceneViewer.displayName = 'SceneViewer';
