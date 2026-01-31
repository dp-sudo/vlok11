import { useFrame, useThree } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef } from 'react';
import { PerspectiveCamera } from 'three';

import { getCameraAnimator, getCameraTransitionService } from '@/features/scene/services/camera';
import { CameraMotionType, type ProjectionMode, type SceneConfig, type Vec3 } from '@/shared/types';
import { useCameraPoseStore } from '@/stores/cameraStore';

import { CAMERA_DEFAULTS, MOTION_SCALE_BY_PROJECTION, toMotionType } from './constants';
import { useUserInteraction } from './useUserInteraction';

import type { RefObject } from 'react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

interface CameraMotionLogicProps {
  config: SceneConfig;
  controlsRef: RefObject<OrbitControlsType | null>;
}

export const CameraMotionLogic = memo(({ config, controlsRef }: CameraMotionLogicProps) => {
  const { camera, invalidate } = useThree();
  const isUserInteracting = useUserInteraction();
  const cameraAnimator = getCameraAnimator();
  const transitionService = getCameraTransitionService();

  const cameraStore = useCameraPoseStore;
  const lastMotionType = useRef<CameraMotionType>(CameraMotionType.STATIC);
  const lastProjectionMode = useRef<ProjectionMode>(config.projectionMode);
  const lastIsImmersive = useRef<boolean>(config.isImmersive);

  useEffect(() => {
    if (controlsRef.current) {
      cameraAnimator.bindThree(camera, controlsRef.current);
    }

    return () => {
      cameraAnimator.unbindThree();
    };
  }, [camera, controlsRef, cameraAnimator]);

  useEffect(() => {
    const motionType = toMotionType(config.cameraMotionType);

    if (config.cameraMotionType !== lastMotionType.current) {
      lastMotionType.current = config.cameraMotionType;

      if (motionType === 'STATIC') {
        cameraStore.getState().stopMotion();
      } else {
        cameraStore.getState().startMotion(motionType);
      }
    }

    cameraAnimator.setBlendMode(config.cameraMotionBlend);
  }, [config.cameraMotionType, config.cameraMotionBlend, cameraAnimator, cameraStore]);

  useEffect(() => {
    cameraAnimator.setUserInteracting(isUserInteracting);
  }, [isUserInteracting, cameraAnimator]);

  const motionScale = useMemo(() => {
    return MOTION_SCALE_BY_PROJECTION[config.projectionMode] ?? 1.0;
  }, [config.projectionMode]);

  useEffect(() => {
    if (isUserInteracting) return undefined;
    if (config.cameraMotionType !== CameraMotionType.STATIC) return undefined;

    const controls = controlsRef.current;

    if (!controls) return undefined;

    const projectionChanged = lastProjectionMode.current !== config.projectionMode;
    const immersiveChanged = lastIsImmersive.current !== config.isImmersive;

    if (!projectionChanged && !immersiveChanged) return undefined;

    const previousMode = lastProjectionMode.current;

    lastProjectionMode.current = config.projectionMode;
    lastIsImmersive.current = config.isImmersive;

    if (transitionService.isTransitioning()) {
      transitionService.cancelTransition();
    }

    transitionService.setLastProjectionMode(previousMode);
    transitionService.transitionToProjection(
      config.projectionMode,
      fromCamera(camera),
      fromTarget(controls),
      camera instanceof PerspectiveCamera ? camera.fov : CAMERA_DEFAULTS.FOV,
      {
        onComplete: () => {
          invalidate();
        },
      }
    );

    return undefined;
  }, [
    camera,
    config.cameraMotionType,
    config.isImmersive,
    config.maxDistance,
    config.minDistance,
    config.projectionMode,
    controlsRef,
    isUserInteracting,
    transitionService,
    invalidate,
  ]);

  useFrame((_, delta) => {
    cameraAnimator.updateFrame(delta, performance.now());
    invalidate();
  });

  void motionScale;

  return null;
});
const fromCamera = (camera: { position: { x: number; y: number; z: number } }): Vec3 => ({
  x: camera.position.x,
  y: camera.position.y,
  z: camera.position.z,
});
const fromTarget = (controls: OrbitControlsType): Vec3 => ({
  x: controls.target.x,
  y: controls.target.y,
  z: controls.target.z,
});

export default CameraMotionLogic;

CameraMotionLogic.displayName = 'CameraMotionLogic';
