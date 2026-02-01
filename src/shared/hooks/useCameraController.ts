import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { getEventBus } from '@/core/EventBus';
import {
  type CameraPresetType,
  calculateDistance,
  calculatePresetPose,
  getCameraAnimator,
} from '@/features/scene/services/camera';
import type { CameraPose, Vec3 } from '@/shared/types';
import { fromVector3 } from '@/shared/utils';
import { useCameraPoseStore } from '@/stores/cameraStore';

export function useCameraController(options: CameraControllerOptions): CameraControllerReturn {
  const { controlsRef, enableSync = true, syncInterval = CAMERA_DEFAULTS.SYNC_INTERVAL } = options;
  const { camera, invalidate } = useThree();

  const cameraAnimator = getCameraAnimator();
  const cameraStore = useCameraPoseStore;

  const frameCountRef = useRef(0);
  const reusableVec = useMemo(() => new Vector3(), []);

  useEffect(() => {
    if (controlsRef.current) {
      cameraAnimator.bindThree(camera, controlsRef.current);
    }

    return () => {
      cameraAnimator.unbindThree();
    };
  }, [camera, controlsRef, cameraAnimator]);

  const syncToStore = useCallback(() => {
    if (!controlsRef.current) return;

    const fov = camera instanceof PerspectiveCamera ? camera.fov : CAMERA_DEFAULTS.FOV;

    cameraStore.getState().setPose(
      {
        position: fromVector3(camera.position),
        target: fromVector3(controlsRef.current.target),
        fov,
      },
      'user'
    );
  }, [camera, controlsRef, cameraStore]);

  useFrame(() => {
    if (enableSync) {
      frameCountRef.current++;

      if (frameCountRef.current >= syncInterval) {
        frameCountRef.current = 0;
        syncToStore();
      }
    }
  });

  useEffect(() => {
    const controls = controlsRef.current;

    if (!controls) return;

    const handleChange = () => {
      invalidate();
    };

    controls.addEventListener('change', handleChange);

    return () => {
      controls.removeEventListener('change', handleChange);
    };
  }, [controlsRef, invalidate]);

  useEffect(() => {
    const eventBus = getEventBus();
    const unsubscribe = eventBus.on('camera:pose-changed', (payload: unknown) => {
      const p = payload as { pose: CameraPose; source?: string } | null;

      if (!p?.pose) return;

      if (p.source !== 'user' && p.source !== 'sync') {
        const { pose } = p;

        camera.position.set(pose.position.x, pose.position.y, pose.position.z);

        if (controlsRef.current) {
          controlsRef.current.target.set(pose.target.x, pose.target.y, pose.target.z);
          controlsRef.current.update();
        }

        if (camera instanceof PerspectiveCamera && pose.fov) {
          camera.fov = pose.fov;
          camera.updateProjectionMatrix();
        }

        invalidate();
      }
    });

    return unsubscribe;
  }, [camera, controlsRef, invalidate]);

  const moveTo = useCallback(
    (position: Vec3, duration = CAMERA_DEFAULTS.MOVE_DURATION) => {
      cameraAnimator.moveTo(position, { duration });
      invalidate();
    },
    [cameraAnimator, invalidate]
  );

  const lookAt = useCallback(
    (target: Vec3, duration = CAMERA_DEFAULTS.LOOK_DURATION) => {
      cameraAnimator.lookAt(target, { duration });
      invalidate();
    },
    [cameraAnimator, invalidate]
  );

  const setFov = useCallback(
    (fov: number, duration = CAMERA_DEFAULTS.FOV_DURATION) => {
      cameraAnimator.setFov(fov, { duration });
      invalidate();
    },
    [cameraAnimator, invalidate]
  );

  const reset = useCallback(() => {
    cameraAnimator.transitionTo(
      {
        position: { x: 0, y: 0, z: CAMERA_DEFAULTS.POSITION_Z },
        target: { x: 0, y: 0, z: 0 },
        fov: CAMERA_DEFAULTS.FOV,
      },
      { duration: CAMERA_DEFAULTS.MOVE_DURATION }
    );
    cameraStore.getState().applyPreset('FRONT');
  }, [cameraAnimator, cameraStore]);

  const applyPreset = useCallback(
    (preset: 'FRONT' | 'TOP' | 'SIDE' | 'ISO' | 'FOCUS') => {
      const currentPose = cameraStore.getState().pose;
      const currentDist = calculateDistance(currentPose.position, currentPose.target);
      const presetPose = calculatePresetPose(preset as CameraPresetType, currentDist);

      cameraAnimator.transitionTo(
        { position: presetPose.position, target: presetPose.target },
        { duration: CAMERA_DEFAULTS.PRESET_DURATION }
      );
      cameraStore.getState().applyPreset(preset as CameraPresetType);
    },
    [cameraAnimator, cameraStore]
  );

  const getCurrentPose = useCallback((): CameraPose => {
    return {
      position: fromVector3(camera.position),
      target: fromVector3(controlsRef.current?.target ?? reusableVec.set(0, 0, 0)),
      up: { x: 0, y: 1, z: 0 },
      fov: camera instanceof PerspectiveCamera ? camera.fov : CAMERA_DEFAULTS.FOV,
    };
  }, [camera, controlsRef, reusableVec]);

  const startInteraction = useCallback(
    (type: 'rotate' | 'pan' | 'zoom' | 'touch') => {
      const currentPose = getCurrentPose();

      cameraStore.getState().startInteraction(type, currentPose);
      cameraAnimator.setUserInteracting(true);
    },
    [cameraStore, cameraAnimator, getCurrentPose]
  );

  const endInteraction = useCallback(() => {
    cameraAnimator.setUserInteracting(false);
    cameraStore.getState().endInteraction();
    syncToStore();
  }, [cameraAnimator, cameraStore, syncToStore]);

  return {
    moveTo,
    lookAt,
    setFov,
    reset,
    applyPreset,
    getCurrentPose,
    startInteraction,
    endInteraction,
    invalidate,
  };
}

export interface CameraControllerOptions {
  controlsRef: React.RefObject<OrbitControlsType | null>;
  enableSync?: boolean;
  syncInterval?: number;
}
export interface CameraControllerReturn {
  applyPreset: (preset: 'FRONT' | 'TOP' | 'SIDE' | 'ISO' | 'FOCUS') => void;
  endInteraction: () => void;
  getCurrentPose: () => CameraPose;
  invalidate: () => void;
  lookAt: (target: Vec3, duration?: number) => void;
  moveTo: (position: Vec3, duration?: number) => void;
  reset: () => void;
  setFov: (fov: number, duration?: number) => void;
  startInteraction: (type: 'rotate' | 'pan' | 'zoom' | 'touch') => void;
}

const CAMERA_DEFAULTS = {
  FOV: 55,
  POSITION_Z: 9,
  MOVE_DURATION: 500,
  LOOK_DURATION: 500,
  FOV_DURATION: 300,
  PRESET_DURATION: 600,
  SYNC_INTERVAL: 10,
};
