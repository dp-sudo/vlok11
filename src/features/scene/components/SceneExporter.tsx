import { useThree } from '@react-three/fiber';
import { forwardRef, memo, useImperativeHandle } from 'react';
import { GLTFExporter } from 'three-stdlib';

import { createLogger } from '@/core/Logger';
import { useAppViewModel } from '@/features/app/viewmodels/useAppViewModel';
import { downloadBlob, downloadDataUrl, downloadText } from '@/shared/utils';

import type { RefObject } from 'react';
import type { Group } from 'three';

export interface ExporterRef {
  downloadSnapshot: () => void;
  exportScene: () => void;
}
interface SceneExporterProps {
  sceneGroupRef: RefObject<Group | null>;
}

const logger = createLogger({ module: 'SceneExporter' });

export const SceneExporter = memo(
  forwardRef<ExporterRef, SceneExporterProps>(({ sceneGroupRef }, ref) => {
    const { startExport, finishExport } = useAppViewModel();
    const { gl } = useThree();

    const exportScene = () => {
      if (!sceneGroupRef.current) return;

      startExport('glb');

      const EXPORT_DELAY_MS = 100;

      setTimeout(() => {
        const sceneGroup = sceneGroupRef.current;

        if (!sceneGroup) {
          finishExport();

          return;
        }
        const exporter = new GLTFExporter();

        exporter.parse(
          sceneGroup,
          (result) => {
            try {
              if (result instanceof ArrayBuffer) {
                const blob = new Blob([result], { type: 'model/gltf-binary' });

                downloadBlob(blob, `immersa_scene_${Date.now()}.glb`);
              } else {
                const output = JSON.stringify(result, null, 2);

                downloadText(output, `immersa_scene_${Date.now()}.gltf`, 'application/json');
              }
            } catch (e) {
              logger.error('Export download failed', { error: String(e) });
            } finally {
              finishExport();
            }
          },
          (error) => {
            logger.error('Export error', { error: String(error) });
            finishExport();
          },
          { binary: true }
        );
      }, EXPORT_DELAY_MS);
    };

    const downloadSnapshot = () => {
      const canvas = gl.domElement;

      if (!canvas) return;

      startExport('png');

      requestAnimationFrame(() => {
        const url = canvas.toDataURL('image/png', 1.0);

        downloadDataUrl(url, `snapshot_${Date.now()}.png`);
        finishExport();
      });
    };

    useImperativeHandle(ref, () => ({
      exportScene,
      downloadSnapshot,
    }));

    return null;
  })
);

SceneExporter.displayName = 'SceneExporter';
