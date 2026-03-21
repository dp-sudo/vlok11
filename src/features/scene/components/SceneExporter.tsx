import { useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { forwardRef, memo, useImperativeHandle } from 'react';
import type { Group } from 'three';
import { GLTFExporter } from 'three-stdlib';
import { createLogger } from '@/core/Logger';
import { useAppViewModel } from '@/features/app/viewmodels/useAppViewModel';
import { downloadBlob, downloadDataUrl, downloadText, isRuntimeTestMode } from '@/shared/utils';

export interface ExporterRef {
  downloadSnapshot: () => boolean;
  exportScene: () => boolean;
  isReady: () => boolean;
}
interface SceneExporterProps {
  sceneGroupRef: RefObject<Group | null>;
}

const logger = createLogger({ module: 'SceneExporter' });

export const SceneExporter = memo(
  forwardRef<ExporterRef, SceneExporterProps>(({ sceneGroupRef }, ref) => {
    const { startExport, finishExport } = useAppViewModel((vm) => ({
      startExport: vm.startExport,
      finishExport: vm.finishExport,
    }));
    const { gl } = useThree();

    const exportScene = (): boolean => {
      if (!sceneGroupRef.current) {
        return false;
      }

      startExport('glb');

      if (isRuntimeTestMode()) {
        try {
          const sceneGroup = sceneGroupRef.current;
          const exportPayload = JSON.stringify(
            {
              childCount: sceneGroup?.children.length ?? 0,
              exportedAt: Date.now(),
              mode: 'test',
            },
            null,
            2
          );

          downloadText(exportPayload, `immersa_scene_${Date.now()}.gltf`, 'application/json');
        } catch (error) {
          logger.error('测试导出失败', { error: String(error) });
        } finally {
          finishExport();
        }

        return true;
      }

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

      return true;
    };

    const downloadSnapshot = (): boolean => {
      const canvas = gl.domElement;

      if (!canvas) {
        return false;
      }

      startExport('png');

      requestAnimationFrame(() => {
        const url = canvas.toDataURL('image/png', 1.0);

        downloadDataUrl(url, `snapshot_${Date.now()}.png`);
        finishExport();
      });

      return true;
    };

    useImperativeHandle(ref, () => ({
      exportScene,
      downloadSnapshot,
      isReady: () => sceneGroupRef.current !== null,
    }));

    return null;
  })
);

SceneExporter.displayName = 'SceneExporter';
