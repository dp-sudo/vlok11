import { Preload } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { memo, Suspense } from 'react';
import type { Group, VideoTexture } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { ErrorBoundaryWithRecovery } from '@/shared/components';
import { RENDERER, SCENE_CONFIG } from '@/shared/constants';
import type { SceneConfig } from '@/shared/types';
import type { ExporterRef } from './SceneExporter';
import type { RecordingRef } from './SceneRecorder';
import { SceneRecorder } from './SceneRecorder';
import { SceneExporter } from './SceneExporter';
import { SceneContent } from './SceneContent';
import { CanvasLoader } from './CanvasLoader';
import {
  CoordinateDebug,
  InputBindingEffect,
  ToneMappingEffect,
  TrackingBridge,
} from './effects';
import { CoreControllerProvider } from '@/features/scene/services/camera';
import CameraRig from './CameraRig';

interface Scene3DContentProps {
  aspectRatio: number;
  backgroundUrl: string | null;
  config: SceneConfig;
  depthUrl: string;
  exposure: number;
  imageUrl: string;
  sceneGroupRef: React.MutableRefObject<Group | null>;
  videoTextureRef: React.MutableRefObject<VideoTexture | null>;
  videoUrl: string | null;
  exporterRef: React.MutableRefObject<ExporterRef | null>;
  recorderRef: React.MutableRefObject<RecordingRef | null>;
  controlsRef: React.MutableRefObject<OrbitControlsType | null>;
}

function CanvasErrorFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-zinc-900 text-red-400 p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">3D 渲染错误</h2>
        <p className="text-sm text-zinc-400">渲染出错，请刷新页面重试</p>
      </div>
    </div>
  );
}

export const Scene3DContent = memo((props: Scene3DContentProps) => {
  const {
    aspectRatio,
    backgroundUrl,
    config,
    depthUrl,
    exposure,
    imageUrl,
    sceneGroupRef,
    videoTextureRef,
    videoUrl,
    exporterRef,
    recorderRef,
    controlsRef,
  } = props;

  const planeWidth = SCENE_CONFIG.PLANE_BASE_WIDTH;
  const planeHeight = planeWidth / aspectRatio;

  return (
    <CoreControllerProvider autoInit>
      <ErrorBoundaryWithRecovery fallback={CanvasErrorFallback}>
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
            <Suspense fallback={<CanvasLoader />}>
              <SceneContent
                aspectRatio={aspectRatio}
                backgroundUrl={backgroundUrl}
                depthUrl={depthUrl}
                imageUrl={imageUrl}
                sceneGroupRef={sceneGroupRef}
                videoTextureRef={videoTextureRef}
                videoUrl={videoUrl}
              />
            </Suspense>
          </CameraRig>
          <SceneRecorder ref={recorderRef} videoTexture={videoTextureRef.current} />
          <SceneExporter ref={exporterRef} sceneGroupRef={sceneGroupRef} />
          <Preload all />
        </Canvas>
      </ErrorBoundaryWithRecovery>
    </CoreControllerProvider>
  );
});

Scene3DContent.displayName = 'Scene3DContent';
