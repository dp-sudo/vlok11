import { createLogger } from '@/core/Logger';
import { isValidProjectData } from '@/core/services/projectValidation';
import type {
  ProjectData,
  ProjectProcessingSnapshot,
  ProjectResourceSnapshot,
  SceneState,
} from '@/core/types/project';
import { getPrecisionConfigService } from '@/features/scene/services/camera/PrecisionConfigService';
import { sanitizeConfig } from '@/shared/config/presets';
import type { Asset, ProcessingResult } from '@/shared/domain/types';
import type { Disposable } from '@/shared/types';
import { useCameraStore, useSessionStore } from '@/stores';

const logger = createLogger({ module: 'ProjectService' });
const RESTORE_TIMEOUT_MS = 30_000;

class ProjectService implements Disposable {
  private currentProjectName = '未命名项目';
  private downloadAnchor: HTMLAnchorElement | null = null;

  async saveProject(_saveAs = false): Promise<boolean> {
    let projectData: ProjectData;

    try {
      projectData = await this.exportProjectData();
    } catch (error) {
      logger.warn('当前没有可保存的项目', { error });

      return false;
    }

    logger.info('开始保存项目');

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

    logger.info('项目保存成功');

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
          logger.error('文件格式无效，请选择 .immersa 项目文件');
          resolve(false);

          return;
        }

        logger.info(`开始打开项目文件：${file.name}`);

        try {
          const text = await file.text();
          const parsedData = JSON.parse(text) as unknown;

          if (!isValidProjectData(parsedData)) {
            throw new Error('项目文件结构无效或已损坏');
          }

          const data = parsedData;

          await this.importProjectData(data);
          resolve(true);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          logger.error(`项目加载失败：${errorMessage}`);
          resolve(false);
        }
      };

      input.click();
    });
  }

  async exportProjectData(): Promise<ProjectData> {
    const session = useSessionStore.getState();

    if (!session.result || !session.currentAsset) {
      throw new Error('当前没有可保存的项目');
    }

    return this.collectProjectData();
  }

  async importProjectData(data: ProjectData): Promise<void> {
    if (!isValidProjectData(data)) {
      throw new Error('项目文件结构无效或已损坏');
    }

    await this.restoreProject(data);
    this.currentProjectName = data.meta.name || '未命名项目';
    logger.info('项目加载成功');
  }

  private async collectProjectData(): Promise<ProjectData> {
    const session = useSessionStore.getState();
    const camera = useCameraStore.getState();
    const precisionService = getPrecisionConfigService();
    const assets = await this.serializeProjectAssets();
    const processing = await this.serializeProcessingSnapshot(session.result);

    const sceneState: SceneState = {
      camera: {
        position: [camera.pose.position.x, camera.pose.position.y, camera.pose.position.z],
        target: [camera.pose.target.x, camera.pose.target.y, camera.pose.target.z],
        fov: camera.pose.fov,
      },
      config: structuredClone(session.config),
      precision: precisionService.getConfig(),
      video: {
        currentTime: session.currentTime,
        duration: session.duration,
        isLooping: session.isLooping,
        isMuted: session.isMuted,
        isPlaying: session.isPlaying,
        playbackRate: session.playbackRate,
      },
    };

    return {
      meta: {
        name: this.currentProjectName,
        createdAt: Date.now(),
        lastModified: Date.now(),
        version: '1.0.0',
      },
      assets,
      ...(processing ? { processing } : {}),
      scene: sceneState,
    };
  }

  private async restoreProject(data: ProjectData): Promise<void> {
    const { assets, scene } = data;
    const sessionStore = useSessionStore.getState();

    sessionStore.resetSession();

    if (this.restoreProcessingSnapshot(data)) {
      this.applySceneState(scene);

      return;
    }

    if (!assets.sourcePath) {
      throw new Error('项目文件缺少源资源路径，无法恢复');
    }

    const restoreInput =
      assets.inlineDataUrl && assets.inlineMimeType
        ? this.createInlineRestoreFile(assets)
        : assets.sourcePath;

    sessionStore.uploadStart(restoreInput);
    await this.waitForSessionReady();

    this.applySceneState(scene);
  }

  private waitForSessionReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let unsubscribe: (() => void) | null = null;
      let timeoutId = 0;

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        unsubscribe?.();
        unsubscribe = null;
      };

      const settleFromState = (status: ReturnType<typeof useSessionStore.getState>): boolean => {
        if (status.status === 'ready') {
          settled = true;
          cleanup();
          resolve();

          return true;
        }

        if (status.status === 'error') {
          settled = true;
          cleanup();
          reject(status.error ?? new Error(status.statusMessage ?? '项目恢复失败'));

          return true;
        }

        return false;
      };

      timeoutId = window.setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        reject(new Error('项目恢复超时：资源未在预期时间内完成加载'));
      }, RESTORE_TIMEOUT_MS);

      if (settleFromState(useSessionStore.getState())) {
        return;
      }

      unsubscribe = useSessionStore.subscribe((state) => {
        if (!settled) {
          settleFromState(state);
        }
      });
    });
  }

  private async serializeProjectAssets(): Promise<ProjectData['assets']> {
    const session = useSessionStore.getState();
    const { currentAsset, result } = session;

    if (!currentAsset) {
      throw new Error('当前没有可保存的资源');
    }

    const assets: ProjectData['assets'] = {
      assetId: currentAsset.id,
      sourceType: currentAsset.type,
      sourcePath: currentAsset.sourceUrl,
      sourceAsset: structuredClone(currentAsset),
      ...(result?.backgroundUrl ? { backgroundPath: result.backgroundUrl } : {}),
      ...(result?.depthMapUrl ? { depthMapPath: result.depthMapUrl } : {}),
      ...(result?.imageUrl ? { imagePath: result.imageUrl } : {}),
    };

    const inlineSource = await this.serializeInlineResource(currentAsset.sourceUrl);
    const extension = currentAsset.type === 'video' ? 'mp4' : 'png';

    if (inlineSource.dataUrl) {
      return {
        ...assets,
        inlineDataUrl: inlineSource.dataUrl,
        inlineMimeType:
          inlineSource.mimeType ??
          this.extractMimeType(inlineSource.dataUrl) ??
          this.getFallbackMimeType(currentAsset),
        inlineFileName: `${this.currentProjectName || '未命名项目'}.${extension}`,
      };
    }

    return assets;
  }

  private applySceneState(scene: SceneState): void {
    const restoredState = useSessionStore.getState();
    const cameraStore = useCameraStore.getState();
    const { position, target, fov } = scene.camera;

    restoredState.setConfig(sanitizeConfig(scene.config));

    cameraStore.setPose({
      position: { x: position[0], y: position[1], z: position[2] },
      target: { x: target[0], y: target[1], z: target[2] },
      fov,
    });

    if (scene.video) {
      restoredState.setVideoDuration(scene.video.duration);
      restoredState.setVideoTime(scene.video.currentTime);
      restoredState.setLooping(scene.video.isLooping);
      restoredState.setMuted(scene.video.isMuted);
      restoredState.setPlaybackRate(scene.video.playbackRate);
      restoredState.setPlaying(scene.video.isPlaying);
    }

    getPrecisionConfigService().setConfig(scene.precision);
  }

  private async readBlobUrlAsDataUrl(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);

    if (!response.ok) {
      throw new Error(`读取本地资源失败: HTTP ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('读取本地资源为 Data URL 失败'));
      reader.readAsDataURL(blob);
    });
  }

  private createInlineRestoreFile(assets: ProjectData['assets']): File {
    const { inlineDataUrl, inlineFileName, inlineMimeType, sourceType } = assets;

    if (!inlineDataUrl || !inlineMimeType) {
      throw new Error('项目内嵌资源信息不完整，无法恢复');
    }

    const [header, base64Payload] = inlineDataUrl.split(',');

    if (!header || !base64Payload) {
      throw new Error('项目内嵌资源格式无效');
    }

    const binaryString = atob(base64Payload);
    const bytes = new Uint8Array(binaryString.length);

    for (let index = 0; index < binaryString.length; index++) {
      bytes[index] = binaryString.charCodeAt(index);
    }

    const fileName = inlineFileName ?? `恢复项目.${sourceType === 'video' ? 'mp4' : 'png'}`;

    return new File([bytes], fileName, { type: inlineMimeType });
  }

  private extractMimeType(dataUrl: string): string | null {
    const match = /^data:([^;]+);base64,/.exec(dataUrl);

    return match?.[1] ?? null;
  }

  private getFallbackMimeType(currentAsset: { type: 'image' | 'video' }): string {
    return currentAsset.type === 'video' ? 'video/mp4' : 'image/png';
  }

  private async serializeInlineResource(
    resourcePath: string
  ): Promise<{ dataUrl?: string; mimeType?: string }> {
    if (resourcePath.startsWith('data:')) {
      const mimeType = this.extractMimeType(resourcePath);

      return {
        dataUrl: resourcePath,
        ...(mimeType ? { mimeType } : {}),
      };
    }

    try {
      const dataUrl = await this.readBlobUrlAsDataUrl(resourcePath);
      const mimeType = this.extractMimeType(dataUrl);

      return {
        dataUrl,
        ...(mimeType ? { mimeType } : {}),
      };
    } catch (error) {
      logger.warn('资源内联失败，将保留原始路径', {
        error,
        resourcePath,
      });

      return {};
    }
  }

  private async serializeProcessingSnapshot(
    result?: ProcessingResult
  ): Promise<ProjectProcessingSnapshot | undefined> {
    if (!result) {
      return undefined;
    }

    return {
      analysis: structuredClone(result.analysis),
      processingTime: result.processingTime,
      image: await this.serializeResourceSnapshot(result.imageUrl),
      depthMap: await this.serializeResourceSnapshot(result.depthMapUrl),
      ...(result.backgroundUrl
        ? { background: await this.serializeResourceSnapshot(result.backgroundUrl) }
        : {}),
    };
  }

  private async serializeResourceSnapshot(resourcePath: string): Promise<ProjectResourceSnapshot> {
    const inlineResource = await this.serializeInlineResource(resourcePath);

    return {
      path: resourcePath,
      ...(inlineResource.dataUrl ? { dataUrl: inlineResource.dataUrl } : {}),
      ...(inlineResource.mimeType ? { mimeType: inlineResource.mimeType } : {}),
    };
  }

  private resolveResourceSnapshot(resource: ProjectResourceSnapshot | undefined): string | null {
    if (!resource) {
      return null;
    }

    return resource.dataUrl ?? resource.path;
  }

  private restoreProcessingSnapshot(data: ProjectData): boolean {
    const { assets, processing } = data;

    if (!processing || !assets.sourceAsset) {
      return false;
    }

    const imageUrl = this.resolveResourceSnapshot(processing.image);
    const depthMapUrl = this.resolveResourceSnapshot(processing.depthMap);

    if (!imageUrl || !depthMapUrl) {
      return false;
    }

    const sourceUrl = assets.inlineDataUrl ?? assets.sourcePath;
    const sourceAsset = this.restoreSourceAsset(assets.sourceAsset, sourceUrl, imageUrl);
    const backgroundUrl = this.resolveResourceSnapshot(processing.background);
    const restoredResult: ProcessingResult = {
      asset: sourceAsset,
      analysis: structuredClone(processing.analysis),
      imageUrl,
      depthMapUrl,
      processingTime: processing.processingTime,
      ...(backgroundUrl ? { backgroundUrl } : {}),
    };

    useSessionStore.getState().restoreSnapshot({
      currentAsset: sourceAsset,
      result: restoredResult,
    });

    return true;
  }

  private restoreSourceAsset(asset: Asset, sourceUrl: string, imageUrl: string): Asset {
    if (asset.type === 'video') {
      return {
        ...asset,
        sourceUrl,
        thumbnailUrl: imageUrl,
      };
    }

    return {
      ...asset,
      sourceUrl,
    };
  }

  getProjectName(): string {
    return this.currentProjectName;
  }

  setProjectName(name: string): void {
    this.currentProjectName = name.trim() || '未命名项目';
  }

  async dispose(): Promise<void> {
    logger.info('项目服务已释放');
    this.downloadAnchor?.parentNode?.removeChild(this.downloadAnchor);
    this.downloadAnchor = null;
  }
}

export const projectService = new ProjectService();
