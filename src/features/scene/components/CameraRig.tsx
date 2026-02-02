import {
  OrthographicCamera as DreiOrthographicCamera,
  PerspectiveCamera as DreiPerspectiveCamera,
  OrbitControls,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { memo, useCallback, useEffect, useRef } from 'react';
import type {
  OrthographicCamera as ThreeOrthographicCamera,
  PerspectiveCamera as ThreePerspectiveCamera,
} from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { calculateCameraSync, getCameraTransitionService } from '@/features/scene/services/camera';

import type { SceneConfig } from '@/shared/types';
import { CameraMode, CameraMotionType, ProjectionMode } from '@/shared/types';
import { CameraMotionLogic } from './CameraMotionLogic';

interface CameraRigProps {
  children?: React.ReactNode;
  config: SceneConfig;
  controlsRef: React.RefObject<OrbitControlsType | null>;
}

const AUTO_MOTION_DAMPING_MULTIPLIER = 1.5;
const CameraRig = memo(({ config, controlsRef, children }: CameraRigProps) => {
  const { invalidate } = useThree();
  const perspectiveRef = useRef<ThreePerspectiveCamera | null>(null);
  const orthographicRef = useRef<ThreeOrthographicCamera | null>(null);
  const lastCameraModeRef = useRef<CameraMode>(config.cameraMode);

  const immersiveLimits = getImmersiveDistanceLimits(config.projectionMode, config.maxDistance);
  const activeMinDist = config.isImmersive ? immersiveLimits.min : config.minDistance;
  const activeMaxDist = config.isImmersive ? immersiveLimits.max : config.maxDistance;

  const isAutoMotion = [
    CameraMotionType.ORBIT,
    CameraMotionType.FLY_BY,
    CameraMotionType.SPIRAL,
    CameraMotionType.DOLLY_ZOOM,
    CameraMotionType.ARC,
    CameraMotionType.TRACKING,
  ].includes(config.cameraMotionType);

  const dampingFactor = config.enableFrameInterpolation
    ? Math.max(MIN_DAMPING_FACTOR, config.dampingFactor * FRAME_INTERPOLATION_DAMPING_MULTIPLIER)
    : config.dampingFactor;

  const allowZoom =
    config.cameraMotionBlend === 'manual-priority'
      ? true
      : config.cameraMotionType !== CameraMotionType.DOLLY_ZOOM;

  const handleChange = useCallback(() => {
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    const previousMode = lastCameraModeRef.current;

    if (previousMode === config.cameraMode) return;

    const from =
      previousMode === CameraMode.PERSPECTIVE ? perspectiveRef.current : orthographicRef.current;
    const to =
      config.cameraMode === CameraMode.PERSPECTIVE
        ? perspectiveRef.current
        : orthographicRef.current;
    const controls = controlsRef.current;

    if (from && to && controls) {
      // 使用CameraTransitionService执行平滑切换动画
      const transitionService = getCameraTransitionService();

      transitionService.transitionProjectionMode(
        previousMode,
        config.cameraMode,
        from,
        to,
        controls,
        {
          onComplete: () => {
            lastCameraModeRef.current = config.cameraMode;
            invalidate();
          },
        }
      );
    } else {
      // 降级处理：直接切换（无动画）
      if (from && to) {
        to.position.copy(from.position);
        to.up.copy(from.up);

        const distance = from.position.length();
        const currentValue =
          previousMode === CameraMode.PERSPECTIVE
            ? (from as ThreePerspectiveCamera).fov
            : (from as ThreeOrthographicCamera).zoom;
        const syncResult = calculateCameraSync(
          previousMode === CameraMode.PERSPECTIVE ? 'perspective' : 'orthographic',
          currentValue,
          distance
        );

        if (config.cameraMode === CameraMode.ORTHOGRAPHIC && to === orthographicRef.current) {
          to.zoom = syncResult.orthoZoom;
        } else if (config.cameraMode === CameraMode.PERSPECTIVE && to === perspectiveRef.current) {
          to.fov = syncResult.perspectiveFov;
        }

        to.updateProjectionMatrix();
        if (controls) controls.update();
        invalidate();
      }

      lastCameraModeRef.current = config.cameraMode;
    }
  }, [config.cameraMode, controlsRef, invalidate]);

  useFrame(() => {
    if (config.cameraMode === CameraMode.PERSPECTIVE && perspectiveRef.current) {
      if (perspectiveRef.current.fov !== config.fov) {
        perspectiveRef.current.fov = config.fov;
        perspectiveRef.current.updateProjectionMatrix();
      }
    }

    if (config.cameraMode === CameraMode.ORTHOGRAPHIC && orthographicRef.current) {
      if (orthographicRef.current.zoom !== config.orthoZoom) {
        orthographicRef.current.zoom = config.orthoZoom;
        orthographicRef.current.updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      <DreiPerspectiveCamera
        fov={config.fov}
        makeDefault={config.cameraMode === CameraMode.PERSPECTIVE}
        position={[0, 0, PERSPECTIVE_CAMERA_Z]}
        ref={perspectiveRef}
      />
      <DreiOrthographicCamera
        makeDefault={config.cameraMode === CameraMode.ORTHOGRAPHIC}
        position={[0, 0, ORTHOGRAPHIC_CAMERA_Z]}
        ref={orthographicRef}
        zoom={config.orthoZoom}
      />
      <CameraMotionLogic config={config} controlsRef={controlsRef} />
      <OrbitControls
        autoRotate={false}
        autoRotateSpeed={0}
        dampingFactor={
          isAutoMotion ? dampingFactor * AUTO_MOTION_DAMPING_MULTIPLIER : dampingFactor
        }
        enableDamping
        enablePan={config.enablePan}
        enableRotate
        enableZoom={allowZoom}
        makeDefault
        maxDistance={activeMaxDist}
        maxPolarAngle={config.maxPolarAngle}
        maxZoom={config.orthoZoomMax ?? ORTHO_ZOOM_MAX_DEFAULT}
        minDistance={activeMinDist}
        minPolarAngle={config.minPolarAngle}
        minZoom={config.orthoZoomMin ?? ORTHO_ZOOM_MIN_DEFAULT}
        onChange={handleChange}
        panSpeed={config.panSpeed}
        ref={controlsRef}
        rotateSpeed={config.rotateSpeed}
        zoomSpeed={config.zoomSpeed}
      />
      {children}
    </>
  );
});
const DEFAULT_IMMERSIVE_MAX_DISTANCE = 12;
const FRAME_INTERPOLATION_DAMPING_MULTIPLIER = 0.5;
const getImmersiveDistanceLimits = (
  projectionMode: ProjectionMode,
  configuredMaxDistance: number
) => {
  const maxDist = IMMERSIVE_DISTANCE_LIMITS[projectionMode] ?? DEFAULT_IMMERSIVE_MAX_DISTANCE;

  return {
    min: IMMERSIVE_MIN_DISTANCE,
    max: Math.max(IMMERSIVE_MIN_DISTANCE, Math.min(maxDist, configuredMaxDistance)),
  };
};
const IMMERSIVE_DISTANCE_LIMITS: Partial<Record<ProjectionMode, number>> = {
  [ProjectionMode.CYLINDER]: 6,
  [ProjectionMode.PANORAMA]: 8,
  [ProjectionMode.SPHERE]: 10,
  [ProjectionMode.DOME]: 10,
  [ProjectionMode.INFINITE_BOX]: 14,
  [ProjectionMode.CORNER]: 12,
  [ProjectionMode.CUBE]: 12,
};
const IMMERSIVE_MIN_DISTANCE = 0.01;
const MIN_DAMPING_FACTOR = 0.01;
const ORTHOGRAPHIC_CAMERA_Z = 8;
const ORTHO_ZOOM_MAX_DEFAULT = 100;
const ORTHO_ZOOM_MIN_DEFAULT = 1;
const PERSPECTIVE_CAMERA_Z = 8;

export default CameraRig;
export type { CameraRigProps };

CameraRig.displayName = 'CameraRig';
