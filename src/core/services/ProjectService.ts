import { getPrecisionConfigService } from '@/features/scene/services/camera/PrecisionConfigService';
import { useCameraStore, useSessionStore } from '@/stores';
import { createLogger } from '@/core/Logger';
import type { Disposable } from '@/shared/types';

import type { ProjectData, SceneState } from '@/core/types/project';

const logger = createLogger({ module: 'ProjectService' });

class ProjectService implements Disposable {
  private currentProjectName = 'Untitled Project';
  private downloadAnchor: HTMLAnchorElement | null = null;

  async saveProject(_saveAs = false): Promise<boolean> {
    const session = useSessionStore.getState();

    if (!session.result || !session.currentAsset) {
      logger.warn('No active project to save');

      return false;
    }

    const projectData = this.collectProjectData();

    logger.info('Saving project...');

    // Create downloadable file
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create download link if not exists
    if (!this.downloadAnchor) {
      this.downloadAnchor = document.createElement('a');
      document.body.appendChild(this.downloadAnchor);
    }

    this.downloadAnchor.href = url;
    this.downloadAnchor.download = `${this.currentProjectName}.immersa`;
    this.downloadAnchor.click();

    URL.revokeObjectURL(url);

    logger.info('Project saved successfully');

    return true;
  }

  async openProject(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input');

      input.type = 'file';
      input.accept = '.immersa';
      input.style.display = 'none';

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
          resolve(false);

          return;
        }

        if (!file.name.endsWith('.immersa')) {
          logger.error('Invalid file format. Please select an .immersa file.');
          resolve(false);

          return;
        }

        logger.info(`Opening project from ${file.name}...`);

        try {
          const text = await file.text();
          const data = JSON.parse(text) as ProjectData;

          await this.restoreProject(data);
          this.currentProjectName = data.meta.name || 'Untitled Project';
          logger.info('Project loaded successfully');
          resolve(true);
        } catch (error) {
          logger.error(`Failed to load project: ${error}`);
          resolve(false);
        }
      };

      input.click();
    });
  }

  private collectProjectData(): ProjectData {
    const session = useSessionStore.getState();
    const camera = useCameraStore.getState();
    const precisionService = getPrecisionConfigService();

    const sceneState: SceneState = {
      camera: {
        position: [camera.pose.position.x, camera.pose.position.y, camera.pose.position.z],
        target: [camera.pose.target.x, camera.pose.target.y, camera.pose.target.z],
        fov: camera.pose.fov,
      },
      precision: precisionService.getConfig(),
      video: {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      },
    };

    return {
      meta: {
        name: this.currentProjectName,
        createdAt: Date.now(),
        lastModified: Date.now(),
        version: '1.0.0',
      },
      assets: {
        sourceType: session.currentAsset!.type,
        sourcePath: session.currentAsset!.sourceUrl,
        depthMapPath: session.result?.depthMapUrl,
      },
      scene: sceneState,
    };
  }

  private async restoreProject(data: ProjectData): Promise<void> {
    const { assets, scene } = data;
    const sessionStore = useSessionStore.getState();

    if (assets.sourcePath) {
      sessionStore.uploadStart(assets.sourcePath);
    }

    const { position, target, fov } = scene.camera;
    const cameraStore = useCameraStore.getState();

    cameraStore.setPose({
      position: { x: position[0], y: position[1], z: position[2] },
      target: { x: target[0], y: target[1], z: target[2] },
      fov,
    });

    getPrecisionConfigService().setConfig(scene.precision);
  }

  getProjectName(): string {
    return this.currentProjectName;
  }

  setProjectName(name: string): void {
    this.currentProjectName = name;
  }

  async dispose(): Promise<void> {
    logger.info('ProjectService disposed');
    this.downloadAnchor?.parentNode?.removeChild(this.downloadAnchor);
    this.downloadAnchor = null;
  }
}

export const projectService = new ProjectService();
