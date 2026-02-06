import { memo, useEffect, useMemo, useRef } from 'react';
import { BackSide, type Group, type VideoTexture } from 'three';

import { MirrorMode, ProjectionMode } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

import { useActiveMaterial, useSceneTextures } from '../hooks/useActiveMaterial';
import type { ParticleType } from './effects';

import { AtmosphereParticles, ParallaxRig, SceneGeometry, VideoManager } from './index';
import {
  AXES_HELPER_SIZE,
  BACKGROUND_SPHERE_SCALE,
  BACKGROUND_SPHERE_SEGMENTS,
  DIRECTIONAL_LIGHT_INTENSITY_MULTIPLIER,
  DIRECTIONAL_LIGHT_POSITION,
  GRID_COLOR_CENTER,
  GRID_COLOR_GRID,
  GRID_DIVISIONS,
  GRID_SIZE,
  SCENE_BASE_WIDTH,
  WRAPPED_PROJECTION_ANGLE_THRESHOLD,
} from './SceneContent.constants';

interface SceneContentProps {
  aspectRatio: number;
  backgroundUrl: string | null;
  depthUrl: string;
  imageUrl: string;
  sceneGroupRef: React.RefObject<Group | null>;
  videoTextureRef: React.RefObject<VideoTexture | null>;
  videoUrl: string | null;
}

const VALID_PARTICLE_TYPES = ['dust', 'snow', 'stars', 'firefly', 'rain', 'leaves'] as const;
const EMPTY_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function getParticleType(type: string): ParticleType | undefined {
  return VALID_PARTICLE_TYPES.includes(type as ParticleType) ? (type as ParticleType) : undefined;
}

function isWrappedProjection(mode: ProjectionMode, angle: number): boolean {
  const isPanoramaOrDome = mode === ProjectionMode.PANORAMA || mode === ProjectionMode.DOME;
  const isSphereOrCylinderWrapped =
    (mode === ProjectionMode.SPHERE || mode === ProjectionMode.CYLINDER) &&
    angle >= WRAPPED_PROJECTION_ANGLE_THRESHOLD;

  return isPanoramaOrDome || isSphereOrCylinderWrapped;
}

function getMirrorScale(mirrorMode: MirrorMode): [number, number, number] {
  const isHorizontalMirror = mirrorMode === MirrorMode.HORIZONTAL || mirrorMode === MirrorMode.QUAD;
  const isVerticalMirror = mirrorMode === MirrorMode.VERTICAL || mirrorMode === MirrorMode.QUAD;

  return [isHorizontalMirror ? -1 : 1, isVerticalMirror ? -1 : 1, 1];
}

export const SceneContent = memo((props: SceneContentProps) => {
  const {
    imageUrl,
    depthUrl,
    backgroundUrl,
    videoUrl,
    aspectRatio,
    videoTextureRef,
    sceneGroupRef,
  } = props;

  const config = useSceneStore((state) => state.config);
  const groupRef = useRef<Group>(null);

  const particleType = useMemo(() => getParticleType(config.particleType), [config.particleType]);
  const isWrapped = useMemo(
    () => isWrappedProjection(config.projectionMode, config.projectionAngle),
    [config.projectionMode, config.projectionAngle]
  );

  useEffect(() => {
    if (sceneGroupRef) {
      sceneGroupRef.current = groupRef.current;
    }
  }, [sceneGroupRef]);

  const { activeMap, displacementMap, backgroundTexture, setVideoTexture } = useSceneTextures({
    imageUrl,
    depthUrl,
    backgroundUrl,
    emptyPixel: EMPTY_PIXEL,
    videoTextureRef,
  });

  const seamCorrectionValue = isWrapped ? 1.0 : 0.0;
  const { activeMaterial } = useActiveMaterial({
    activeMap,
    displacementMap,
    config,
    seamCorrectionValue,
  });

  if (!displacementMap || !activeMaterial) {
    return null;
  }

  const width = SCENE_BASE_WIDTH;
  const height = width / aspectRatio;
  const mirrorScale = getMirrorScale(config.mirrorMode);
  const showBackground = backgroundUrl && config.projectionMode !== ProjectionMode.GAUSSIAN_SPLAT;

  return (
    <>
      <VideoManager onTextureReady={setVideoTexture} videoUrl={videoUrl} />

      <ambientLight intensity={config.lightIntensity} />
      <directionalLight
        intensity={config.lightIntensity * DIRECTIONAL_LIGHT_INTENSITY_MULTIPLIER}
        position={DIRECTIONAL_LIGHT_POSITION}
      />

      <AtmosphereParticles
        density={config.particleDensity ?? 1.0}
        enabled={config.enableParticles}
        {...(particleType ? { particleType } : {})}
      />

      {config.showGrid ? (
        <gridHelper args={[GRID_SIZE, GRID_DIVISIONS, GRID_COLOR_CENTER, GRID_COLOR_GRID]} />
      ) : null}
      {config.showAxes ? <axesHelper args={[AXES_HELPER_SIZE]} /> : null}

      {showBackground ? (
        <mesh rotation={[0, Math.PI, 0]} scale={BACKGROUND_SPHERE_SCALE}>
          <sphereGeometry args={[1, BACKGROUND_SPHERE_SEGMENTS, BACKGROUND_SPHERE_SEGMENTS]} />
          <meshBasicMaterial
            depthWrite={false}
            map={backgroundTexture}
            side={BackSide}
            toneMapped
          />
        </mesh>
      ) : null}

      <ParallaxRig enabled={config.enableNakedEye3D}>
        <group ref={groupRef}>
          <group scale={mirrorScale}>
            <SceneGeometry
              density={config.meshDensity}
              displacementScale={config.displacementScale}
              height={height}
              material={activeMaterial}
              projectionAngle={config.projectionAngle}
              projectionMode={config.projectionMode}
              width={width}
            />
          </group>
        </group>
      </ParallaxRig>
    </>
  );
});

export default SceneContent;

SceneContent.displayName = 'SceneContent';
