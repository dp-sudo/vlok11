import { useThree } from '@react-three/fiber';
import { memo, useEffect, useRef } from 'react';

import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import { THROTTLE } from '@/shared/constants';
import {
  pickFirstIntersectionFromElementPoint,
  planeLocalToWorld,
  sampleImageDataGray01,
  uvAndDepthToWorldPointOnPlane,
  uvToPlaneLocal,
} from '@/shared/utils';
import { useSceneStore } from '@/stores/sharedStore';

import type { Group } from 'three';

interface CoordinateDebugProps {
  depthUrl: string;
  planeHeight: number;
  planeWidth: number;
  sceneGroupRef: React.RefObject<Group | null>;
}

export const CoordinateDebug = memo(
  ({ sceneGroupRef, planeWidth, planeHeight, depthUrl }: CoordinateDebugProps) => {
    const { camera, gl, scene } = useThree();
    const displacementScale = useSceneStore((s) => s.config.displacementScale);
    const depthInvert = useSceneStore((s) => s.config.depthInvert);
    const depthImageRef = useRef<ImageData | null>(null);

    useEffect(() => {
      if (!import.meta.env.DEV) return undefined;

      let cancelled = false;

      depthImageRef.current = null;

      const load = async () => {
        try {
          const img = new Image();

          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load depth image'));
            img.src = depthUrl;
          });
          if (cancelled) return;

          const canvas = document.createElement('canvas');

          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) throw new Error('Cannot get depth canvas context');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          canvas.width = 0;
          canvas.height = 0;
          if (cancelled) return;
          depthImageRef.current = imageData;
        } catch (e) {
          coordLogger.warn('Depth image load failed', { error: String(e) });
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, [depthUrl]);

    useEffect(() => {
      if (!import.meta.env.DEV) return undefined;

      const bus = getEventBus();
      const lastLogAtRef = { current: 0 };

      const handle = (payload: unknown) => {
        const p = payload as { position?: { x: number; y: number } } | null;

        if (!p?.position) return;

        const now = performance.now();

        if (now - lastLogAtRef.current < THROTTLE.COORD_DEBUG_MS) return;
        lastLogAtRef.current = now;

        const root = sceneGroupRef.current ?? scene;
        const mesh = root.getObjectByName('SceneMesh') ?? root.getObjectByName('ScenePoints');

        if (!mesh) return;

        const hit = pickFirstIntersectionFromElementPoint({
          point: p.position,
          element: gl.domElement,
          camera,
          objects: mesh,
          recursive: true,
        });

        if (!hit?.screenUv) return;

        const planeLocal = uvToPlaneLocal(hit.screenUv, planeWidth, planeHeight);
        const planeWorld = planeLocalToWorld(planeLocal, mesh);

        const depthImage = depthImageRef.current;
        const depth01 = depthImage
          ? sampleImageDataGray01({ image: depthImage, uv: hit.screenUv, mode: 'bilinear' })
          : null;

        const scale = depthInvert ? -displacementScale : displacementScale;
        const bias = -scale / 2;
        const displacedWorld =
          depth01 === null
            ? null
            : uvAndDepthToWorldPointOnPlane({
                uv: hit.screenUv,
                depth01,
                planeWidth,
                planeHeight,
                planeObject: mesh,
                displacementScale: scale,
                displacementBias: bias,
              });

        coordLogger.info('coord', {
          elementPoint: p.position,
          screenUv: hit.screenUv,
          planeLocal,
          planeWorld,
          hitWorld: hit.worldPoint,
          depth01,
          displacedWorld,
        });
      };

      const offStart = bus.on('input:interaction-start', handle);
      const offUpdate = bus.on('input:interaction-update', handle);

      return () => {
        offStart();
        offUpdate();
      };
    }, [camera, depthInvert, displacementScale, gl, planeHeight, planeWidth, scene, sceneGroupRef]);

    return null;
  }
);
const coordLogger = createLogger({ module: 'CoordinateDebug' });

CoordinateDebug.displayName = 'CoordinateDebug';
