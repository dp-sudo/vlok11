import { getEventBus } from '@/core/EventBus';
import { TrackingEvents } from '@/core/EventTypes';
import { createLogger } from '@/core/Logger';
import { loadImageDataFromUrl, mapMediaPixelToDisplacedWorldPoint } from '@/shared/utils';
import { useSceneStore } from '@/stores/sharedStore';
import { memo, useEffect, useRef } from 'react';
import type { Group } from 'three';

interface TrackingBridgeProps {
  depthUrl: string;
  planeHeight: number;
  planeWidth: number;
  sceneGroupRef: React.RefObject<Group | null>;
}

export const TrackingBridge = memo(
  ({ sceneGroupRef, planeWidth, planeHeight, depthUrl }: TrackingBridgeProps) => {
    const displacementScale = useSceneStore((s) => s.config.displacementScale);
    const depthInvert = useSceneStore((s) => s.config.depthInvert);
    const depthImageRef = useRef<ImageData | null>(null);

    useEffect(() => {
      let cancelled = false;

      depthImageRef.current = null;

      const load = async () => {
        try {
          const imageData = await loadImageDataFromUrl(depthUrl);

          if (cancelled) return;
          depthImageRef.current = imageData;
        } catch (e) {
          trackingLogger.warn('Depth image load failed', { error: String(e) });
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, [depthUrl]);

    useEffect(() => {
      const bus = getEventBus();

      const off = bus.on(TrackingEvents.POINT_2D, (p) => {
        const planeObject = sceneGroupRef.current;
        const depthImage = depthImageRef.current;

        if (!planeObject || !depthImage) return;

        const scale = depthInvert ? -displacementScale : displacementScale;
        const bias = -scale / 2;
        const { uv, depth01, world } = mapMediaPixelToDisplacedWorldPoint({
          pixel: p.pixel,
          mediaWidth: p.mediaWidth,
          mediaHeight: p.mediaHeight,
          depthImage,
          planeWidth,
          planeHeight,
          planeObject,
          displacementScale: scale,
          displacementBias: bias,
          ...(p.flipX !== undefined ? { flipX: p.flipX } : {}),
          ...(p.flipY !== undefined ? { flipY: p.flipY } : {}),
          sampleMode: 'bilinear',
        });

        bus.emit(TrackingEvents.POINT_3D, {
          uv,
          depth01,
          world,
          timestamp: p.timestamp,
          source: p.source,
        });
      });

      return () => {
        off();
      };
    }, [depthInvert, displacementScale, planeHeight, planeWidth, sceneGroupRef]);

    return null;
  }
);
const trackingLogger = createLogger({ module: 'TrackingBridge' });

TrackingBridge.displayName = 'TrackingBridge';
