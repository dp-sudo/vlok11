import { Preload } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { forwardRef, memo, useImperativeHandle, useRef } from 'react';

import {
  calculateDistance,
  calculatePresetPoseForProjection,
  CoreControllerProvider,
} from '@/features/scene/services/camera';
import { PerformanceOverlay } from '@/shared/components';
import { RENDERER, SCENE_CONFIG } from '@/shared/constants';
import { VIGNETTE } from '@/shared/constants/image';
import { RenderStyle } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

import { CameraRig, SceneExporter, SceneRecorder } from './components';
import {
  CoordinateDebug,
  InputBindingEffect,
  ToneMappingEffect,
  TrackingBridge,
  WebcamTracker,
} from './components/effects';
import { SceneContent } from './components/SceneContent';
import { useColorGrade, useVideoControl } from './hooks';

import type { ExporterRef, RecordingRef } from './components';
import type { CameraPresetType } from '@/features/scene/services/camera';
import type { CameraViewPreset } from '@/shared/types';
import type { Group, VideoTexture } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

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
    const renderStyle = useSceneStore((state) => state.config.renderStyle);
    const enableVignette = useSceneStore((state) => state.config.enableVignette);
    const exposure = useSceneStore((state) => state.config.exposure);
    const config = useSceneStore((state) => state.config);
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
      onTimeUpdate: onVideoTimeUpdate,
      onDurationChange: onVideoDurationChange,
      onEnded: onVideoEnded,
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
    const planeWidth = SCENE_CONFIG.PLANE_BASE_WIDTH;
    const planeHeight = planeWidth / aspectRatio;
    const { enableFaceTracking } = config;

    return (
      <div
        className="w-full h-full bg-black relative rounded-lg overflow-hidden shadow-2xl border border-zinc-800 transition-all duration-200"
        style={colorGradeStyle}
      >
        <PerformanceOverlay position="bottom-left" visible />
        {enableFaceTracking && <WebcamTracker />}

        {enableVignette ? (
          <div
            className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: `radial-gradient(circle at center, transparent 55%, rgba(0,0,0,${Math.max(0, Math.min(1, VIGNETTE.BASE_OPACITY + config.vignetteStrength * VIGNETTE.STRENGTH_MULTIPLIER))}) 100%)`,
            }}
          />
        ) : null}

        {renderStyle === RenderStyle.HOLOGRAM_V2 && (
          <div className="absolute top-4 right-4 z-10 text-cyan-400 text-xs font-mono animate-pulse border border-cyan-500/50 px-2 py-1 rounded bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            HOLOGRAM V2 ACTIVE
          </div>
        )}

        <CoreControllerProvider autoInit>
          <Canvas dpr={RENDERER.DPR} gl={{ preserveDrawingBuffer: true }} shadows>
            <ToneMappingEffect exposure={exposure} />
            <InputBindingEffect />
            <CoordinateDebug
              depthUrl={depthUrl}
              planeHeight={planeHeight}
              planeWidth={planeWidth}
              sceneGroupRef={sceneGroupRef}
            />
            <TrackingBridge
              depthUrl={depthUrl}
              planeHeight={planeHeight}
              planeWidth={planeWidth}
              sceneGroupRef={sceneGroupRef}
            />
            <CameraRig config={config} controlsRef={controlsRef}>
              <SceneContent
                aspectRatio={aspectRatio}
                backgroundUrl={backgroundUrl}
                depthUrl={depthUrl}
                imageUrl={imageUrl}
                sceneGroupRef={sceneGroupRef}
                videoTextureRef={videoTextureRef}
                videoUrl={videoUrl}
              />
            </CameraRig>
            <SceneRecorder ref={recorderRef} videoTexture={videoTextureRef.current} />
            <SceneExporter ref={exporterRef} sceneGroupRef={sceneGroupRef} />
            <Preload all />
          </Canvas>
        </CoreControllerProvider>
      </div>
    );
  })
);

SceneViewer.displayName = 'SceneViewer';
