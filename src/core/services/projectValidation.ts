import { isValidAnalysisResult, isValidAsset } from '@/core/domain/types';
import type {
  ProjectAssets,
  ProjectData,
  ProjectMeta,
  ProjectProcessingSnapshot,
  ProjectResourceSnapshot,
  SceneState,
} from '@/core/types/project';

const PROJECT_CONFIG_KEYS = [
  'cameraMode',
  'cameraMotionType',
  'renderStyle',
  'projectionMode',
  'isImmersive',
  'fov',
  'displacementScale',
  'lightIntensity',
  'enableParticles',
  'videoMuted',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isVec3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

function hasInlineAssetPayload(assets: Record<string, unknown>): boolean {
  return (
    assets['inlineDataUrl'] !== undefined ||
    assets['inlineFileName'] !== undefined ||
    assets['inlineMimeType'] !== undefined
  );
}

function isValidProjectMeta(meta: unknown): meta is ProjectMeta {
  if (!isRecord(meta)) {
    return false;
  }

  return (
    typeof meta['name'] === 'string' &&
    isFiniteNumber(meta['createdAt']) &&
    isFiniteNumber(meta['lastModified']) &&
    isNonEmptyString(meta['version'])
  );
}

function isValidProjectAssets(assets: unknown): assets is ProjectAssets {
  if (!isRecord(assets)) {
    return false;
  }

  const { sourcePath, sourceType } = assets;

  if ((sourceType !== 'image' && sourceType !== 'video') || !isNonEmptyString(sourcePath)) {
    return false;
  }

  const optionalStringKeys = ['assetId', 'backgroundPath', 'depthMapPath', 'imagePath'] as const;

  if (
    optionalStringKeys.some((key) => assets[key] !== undefined && typeof assets[key] !== 'string')
  ) {
    return false;
  }

  if (assets['sourceAsset'] !== undefined && !isValidAsset(assets['sourceAsset'])) {
    return false;
  }

  if (!hasInlineAssetPayload(assets)) {
    return true;
  }

  return (
    isNonEmptyString(assets['inlineDataUrl']) &&
    String(assets['inlineDataUrl']).startsWith('data:') &&
    isNonEmptyString(assets['inlineFileName']) &&
    isNonEmptyString(assets['inlineMimeType'])
  );
}

function isValidProjectResourceSnapshot(value: unknown): value is ProjectResourceSnapshot {
  if (!isRecord(value) || !isNonEmptyString(value['path'])) {
    return false;
  }

  return (
    (value['dataUrl'] === undefined ||
      (isNonEmptyString(value['dataUrl']) && String(value['dataUrl']).startsWith('data:'))) &&
    (value['mimeType'] === undefined || isNonEmptyString(value['mimeType']))
  );
}

function isValidProcessingSnapshot(value: unknown): value is ProjectProcessingSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isValidAnalysisResult(value['analysis']) &&
    isFiniteNumber(value['processingTime']) &&
    isValidProjectResourceSnapshot(value['image']) &&
    isValidProjectResourceSnapshot(value['depthMap']) &&
    (value['background'] === undefined || isValidProjectResourceSnapshot(value['background']))
  );
}

function isValidSceneConfig(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const hasKnownConfigKey = PROJECT_CONFIG_KEYS.some((key) => key in value);

  if (!hasKnownConfigKey) {
    return false;
  }

  const typedChecks: Array<[keyof typeof value, (item: unknown) => boolean]> = [
    ['cameraMode', (item) => typeof item === 'string'],
    ['cameraMotionType', (item) => typeof item === 'string'],
    ['renderStyle', (item) => typeof item === 'string'],
    ['projectionMode', (item) => typeof item === 'string'],
    ['isImmersive', (item) => typeof item === 'boolean'],
    ['fov', isFiniteNumber],
    ['displacementScale', isFiniteNumber],
    ['lightIntensity', isFiniteNumber],
    ['enableParticles', (item) => typeof item === 'boolean'],
    ['videoMuted', (item) => typeof item === 'boolean'],
  ];

  return typedChecks.every(([key, validator]) => value[key] === undefined || validator(value[key]));
}

function isValidPrecisionConfig(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value['fovRange'])) {
    return false;
  }

  return (
    isFiniteNumber(value['moveSensitivity']) &&
    isFiniteNumber(value['rotateSensitivity']) &&
    isFiniteNumber(value['zoomSensitivity']) &&
    isFiniteNumber(value['dampingFactor']) &&
    isFiniteNumber(value['fovStep']) &&
    isFiniteNumber(value['minMoveThreshold']) &&
    isFiniteNumber(value['fovRange']['min']) &&
    isFiniteNumber(value['fovRange']['max']) &&
    value['fovRange']['min'] <= value['fovRange']['max']
  );
}

function isValidVideoState(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value['currentTime']) &&
    isFiniteNumber(value['duration']) &&
    typeof value['isLooping'] === 'boolean' &&
    typeof value['isMuted'] === 'boolean' &&
    typeof value['isPlaying'] === 'boolean' &&
    isFiniteNumber(value['playbackRate'])
  );
}

function isValidSceneState(scene: unknown): scene is SceneState {
  if (!isRecord(scene) || !isRecord(scene['camera'])) {
    return false;
  }

  const { camera } = scene;

  return (
    isVec3(camera['position']) &&
    isVec3(camera['target']) &&
    isFiniteNumber(camera['fov']) &&
    isValidSceneConfig(scene['config']) &&
    isValidPrecisionConfig(scene['precision']) &&
    (scene['video'] === undefined || isValidVideoState(scene['video']))
  );
}

export function isValidProjectData(value: unknown): value is ProjectData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isValidProjectMeta(value['meta']) &&
    isValidProjectAssets(value['assets']) &&
    isValidSceneState(value['scene']) &&
    (value['processing'] === undefined || isValidProcessingSnapshot(value['processing']))
  );
}
