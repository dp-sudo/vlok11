import { useThree } from '@react-three/fiber';
import { memo, useEffect } from 'react';

import { getEventBus } from '@/core/EventBus';
import { TrackingEvents } from '@/core/EventTypes';
import { createLogger } from '@/core/Logger';
import { THROTTLE } from '@/shared/constants';
import { MirrorMode } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

export const SimulatedTracker = memo(() => {
  const { gl } = useThree();
  const mirrorMode = useSceneStore((s) => s.config.mirrorMode);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    const bus = getEventBus();
    const lastEmitAtRef = { current: 0 };

    const handle = (payload: unknown) => {
      const p = payload as { position?: { x: number; y: number } } | null;

      if (!p?.position) return;

      const now = performance.now();

      if (now - lastEmitAtRef.current < THROTTLE.TRACKING_EMIT_MS) return;
      lastEmitAtRef.current = now;

      const rect = gl.domElement.getBoundingClientRect();
      const mediaWidth = Math.max(1, Math.round(rect.width));
      const mediaHeight = Math.max(1, Math.round(rect.height));

      const px = Math.max(0, Math.min(mediaWidth - 1, p.position.x));
      const py = Math.max(0, Math.min(mediaHeight - 1, p.position.y));

      const flipX = mirrorMode === MirrorMode.HORIZONTAL || mirrorMode === MirrorMode.QUAD;
      const flipY = mirrorMode === MirrorMode.VERTICAL || mirrorMode === MirrorMode.QUAD;

      try {
        bus.emit(TrackingEvents.POINT_2D, {
          pixel: { x: px, y: py },
          mediaWidth,
          mediaHeight,
          flipX,
          flipY,
          timestamp: now,
          source: 'user',
        });
      } catch (e) {
        simulatedTrackerLogger.warn('Emit tracking point2d failed', { error: String(e) });
      }
    };

    const offStart = bus.on('input:interaction-start', handle);
    const offUpdate = bus.on('input:interaction-update', handle);

    return () => {
      offStart();
      offUpdate();
    };
  }, [gl, mirrorMode]);

  return null;
});
const simulatedTrackerLogger = createLogger({ module: 'SimulatedTracker' });

SimulatedTracker.displayName = 'SimulatedTracker';
