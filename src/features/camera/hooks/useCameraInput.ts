import { useCallback, useEffect, useRef } from 'react';
import type { InteractionType } from '@/shared/types';
import { useCameraPoseStore } from '@/stores/cameraStore';
import { useSceneStore } from '@/stores/sharedStore';

interface Point2D {
  x: number;
  y: number;
}

interface UseCameraInputOptions {
  enabled?: boolean;
}

const INPUT_CONSTANTS = {
  ROTATION_Y_FACTOR: 10,
  Y_MIN: -5,
  Y_MAX: 10,
  ZOOM_MIN: 1,
  ZOOM_MAX: 50,
  ZOOM_FACTOR: 100,
  PINCH_ZOOM_FACTOR: 500,
} as const;

export function useCameraInput(
  containerRef: React.RefObject<HTMLElement>,
  options: UseCameraInputOptions = {}
) {
  const { enabled = true } = options;

  // Get sensitivities from config
  const rotateSpeed = useSceneStore((s) => s.config.rotateSpeed);
  const zoomSpeed = useSceneStore((s) => s.config.zoomSpeed);
  const panSpeed = useSceneStore((s) => s.config.panSpeed);

  const isInteracting = useRef(false);
  const interactionType = useRef<InteractionType>('none');
  const lastPosition = useRef<Point2D>({ x: 0, y: 0 });
  const touchStartDistance = useRef(0);

  const store = useCameraPoseStore;

  const startInteraction = useCallback(
    (type: InteractionType, position: Point2D) => {
      isInteracting.current = true;
      interactionType.current = type;
      lastPosition.current = position;

      const { pose } = store.getState();

      store.getState().startInteraction(type, pose);
    },
    [store]
  );

  const endInteraction = useCallback(() => {
    isInteracting.current = false;
    interactionType.current = 'none';
    store.getState().endInteraction();
  }, [store]);

  const updateRotation = useCallback(
    (deltaX: number, deltaY: number) => {
      const { pose, setPose } = store.getState();
      const dx = pose.position.x - pose.target.x;
      const dz = pose.position.z - pose.target.z;
      const radius = Math.sqrt(dx * dx + dz * dz);

      const currentAngle = Math.atan2(dx, dz);
      const newAngle = currentAngle + deltaX * rotateSpeed;
      const newY = pose.position.y - deltaY * rotateSpeed * INPUT_CONSTANTS.ROTATION_Y_FACTOR;

      setPose(
        {
          position: {
            x: pose.target.x + Math.sin(newAngle) * radius,
            y: Math.max(INPUT_CONSTANTS.Y_MIN, Math.min(INPUT_CONSTANTS.Y_MAX, newY)),
            z: pose.target.z + Math.cos(newAngle) * radius,
          },
        },
        'user'
      );
    },
    [store, rotateSpeed]
  );

  const updatePan = useCallback(
    (deltaX: number, deltaY: number) => {
      const { pose, setPose } = store.getState();
      const panX = -deltaX * panSpeed;
      const panY = deltaY * panSpeed;

      setPose(
        {
          position: {
            x: pose.position.x + panX,
            y: pose.position.y + panY,
            z: pose.position.z,
          },
          target: {
            x: pose.target.x + panX,
            y: pose.target.y + panY,
            z: pose.target.z,
          },
        },
        'user'
      );
    },
    [store, panSpeed]
  );

  const updateZoom = useCallback(
    (delta: number) => {
      const { pose, setPose } = store.getState();
      const direction = {
        x: pose.position.x - pose.target.x,
        y: pose.position.y - pose.target.y,
        z: pose.position.z - pose.target.z,
      };
      const distance = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y + direction.z * direction.z
      );

      const zoomChange = delta * zoomSpeed * INPUT_CONSTANTS.ZOOM_FACTOR;
      const newDistance = Math.max(
        INPUT_CONSTANTS.ZOOM_MIN,
        Math.min(INPUT_CONSTANTS.ZOOM_MAX, distance + zoomChange)
      );
      const scale = newDistance / distance;

      setPose(
        {
          position: {
            x: pose.target.x + direction.x * scale,
            y: pose.target.y + direction.y * scale,
            z: pose.target.z + direction.z * scale,
          },
        },
        'user'
      );
    },
    [store, zoomSpeed]
  );

  useInputEventListeners({
    containerRef,
    enabled,
    isInteracting,
    interactionType,
    lastPosition,
    touchStartDistance,
    startInteraction,
    endInteraction,
    updateRotation,
    updatePan,
    updateZoom,
  });

  return {
    isInteracting: isInteracting.current,
    interactionType: interactionType.current,
  };
}

interface InputEventListenersConfig {
  containerRef: React.RefObject<HTMLElement>;
  enabled: boolean;
  endInteraction: () => void;
  interactionType: React.RefObject<InteractionType>;
  isInteracting: React.RefObject<boolean>;
  lastPosition: React.RefObject<Point2D>;
  startInteraction: (type: InteractionType, position: Point2D) => void;
  touchStartDistance: React.RefObject<number>;
  updatePan: (deltaX: number, deltaY: number) => void;
  updateRotation: (deltaX: number, deltaY: number) => void;
  updateZoom: (delta: number) => void;
}

function useInputEventListeners(config: InputEventListenersConfig) {
  const {
    containerRef,
    enabled,
    isInteracting,
    interactionType,
    lastPosition,
    touchStartDistance,
    startInteraction,
    endInteraction,
    updateRotation,
    updatePan,
    updateZoom,
  } = config;

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !enabled) return;

    const handleMouseDown = (e: MouseEvent) => {
      const position = { x: e.clientX, y: e.clientY };
      const type: InteractionType = e.button === 2 || e.button === 1 ? 'pan' : 'rotate';

      startInteraction(type, position);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isInteracting.current) return;

      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;

      lastPosition.current = { x: e.clientX, y: e.clientY };

      if (interactionType.current === 'rotate') {
        updateRotation(deltaX, deltaY);
      } else if (interactionType.current === 'pan') {
        updatePan(deltaX, deltaY);
      }
    };

    const handleMouseUp = () => {
      if (isInteracting.current) {
        endInteraction();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;

      e.preventDefault();
      updateZoom(e.deltaY);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const getTouchDistance = (t1: Touch, t2: Touch): number => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;

      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const { touches } = e;

      if (touches.length === 1 && touches[0]) {
        startInteraction('touch', { x: touches[0].clientX, y: touches[0].clientY });
      } else if (touches.length === 2 && touches[0] && touches[1]) {
        touchStartDistance.current = getTouchDistance(touches[0], touches[1]);
        startInteraction('pinch', { x: touches[0].clientX, y: touches[0].clientY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isInteracting.current) return;

      e.preventDefault();
      const { touches } = e;

      if (touches.length === 1 && touches[0]) {
        const deltaX = touches[0].clientX - lastPosition.current.x;
        const deltaY = touches[0].clientY - lastPosition.current.y;

        lastPosition.current = { x: touches[0].clientX, y: touches[0].clientY };
        updateRotation(deltaX, deltaY);
      } else if (touches.length === 2 && touches[0] && touches[1]) {
        const currentDistance = getTouchDistance(touches[0], touches[1]);
        const scale = currentDistance / touchStartDistance.current;
        const zoomDelta = (1 - scale) * INPUT_CONSTANTS.PINCH_ZOOM_FACTOR;

        touchStartDistance.current = currentDistance;
        updateZoom(zoomDelta);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        endInteraction();
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    containerRef,
    enabled,
    isInteracting,
    interactionType,
    lastPosition,
    touchStartDistance,
    startInteraction,
    endInteraction,
    updateRotation,
    updatePan,
    updateZoom,
  ]);
}
