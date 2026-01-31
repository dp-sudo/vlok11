export function isImageAsset(asset: Asset): asset is ImageAsset {
  return asset.type === 'image';
}
export function isValidAnalysisResult(obj: unknown): obj is AnalysisResult {
  if (!obj || typeof obj !== 'object') return false;
  const a = obj as Record<string, unknown>;

  return (
    typeof a.sceneType === 'string' &&
    Object.values(SceneType).includes(a.sceneType as SceneType) &&
    typeof a.description === 'string' &&
    typeof a.estimatedDepthScale === 'number' &&
    typeof a.recommendedFov === 'number' &&
    typeof a.recommendedPipeline === 'string' &&
    typeof a.reasoning === 'string'
  );
}
export function isValidAsset(obj: unknown): obj is Asset {
  if (!obj || typeof obj !== 'object') return false;
  const a = obj as Record<string, unknown>;

  return (
    typeof a.id === 'string' &&
    typeof a.sourceUrl === 'string' &&
    (a.type === 'image' || a.type === 'video') &&
    typeof a.width === 'number' &&
    typeof a.height === 'number' &&
    typeof a.aspectRatio === 'number' &&
    typeof a.createdAt === 'number'
  );
}
export function isValidProcessedAsset(obj: unknown): obj is ProcessedAsset {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;

  return (
    isValidAsset(p.asset) &&
    typeof p.depthMapUrl === 'string' &&
    typeof p.imageUrl === 'string' &&
    isValidAnalysisResult(p.analysis) &&
    typeof p.processingTime === 'number'
  );
}
export function isValidStatusTransition(from: SessionStatus, to: SessionStatus): boolean {
  return SESSION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export function isVideoAsset(asset: Asset): asset is VideoAsset {
  return asset.type === 'video';
}

export type Asset = ImageAsset | VideoAsset;
export type AssetType = 'image' | 'video';
export type SessionStatus =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'processing_depth'
  | 'ready'
  | 'error';

export interface AnalysisResult {
  depthVariance?: number;
  description: string;

  estimatedDepthScale: number;

  keywords?: string[];
  mainSubject?: string;

  reasoning: string;
  recommendedFov: number;
  recommendedPipeline: TechPipeline;
  sceneType: SceneType;

  suggestedModel?: string;
}
export interface BaseAsset {
  aspectRatio: number;
  createdAt: number;
  height: number;
  id: string;
  sourceUrl: string;
  type: AssetType;
  width: number;
}
export interface ImageAsset extends BaseAsset {
  type: 'image';
}
export interface ProcessedAsset {
  analysis: AnalysisResult;

  asset: Asset;

  backgroundUrl?: string;

  depthMapUrl: string;
  imageUrl: string;
  processingTime: number;
}
export interface ProcessingState {
  message: string;
  progress: number;
  status: SessionStatus;
}
export interface RecommendedConfig {
  cameraMotion: CameraMotionType;
  colorGrade: ColorGradePreset;
  displacementScale: number;
  enableFog: boolean;
  enableVignette: boolean;
  fov: number;
  videoLoop?: boolean;
}
export interface VideoAsset extends BaseAsset {
  duration: number;
  thumbnailUrl?: string;
  type: 'video';
}

export enum CameraMode {
  ORTHOGRAPHIC = 'ORTHOGRAPHIC',
  PERSPECTIVE = 'PERSPECTIVE',
}
export enum CameraMotionType {
  ARC = 'ARC',
  DOLLY_ZOOM = 'DOLLY_ZOOM',
  FLY_BY = 'FLY_BY',
  ORBIT = 'ORBIT',
  SPIRAL = 'SPIRAL',
  STATIC = 'STATIC',
  TRACKING = 'TRACKING',
}
export enum ColorGradePreset {
  CINEMATIC = 'CINEMATIC',
  COLD = 'COLD',
  CYBERPUNK = 'CYBERPUNK',
  DREAMY = 'DREAMY',
  FILM = 'FILM',
  JAPANESE = 'JAPANESE',
  NOIR = 'NOIR',
  NONE = 'NONE',
  SEPIA = 'SEPIA',
  VHS = 'VHS',
  VINTAGE = 'VINTAGE',
  WARM = 'WARM',
}
export enum MirrorMode {
  HORIZONTAL = 'HORIZONTAL',
  NONE = 'NONE',
  QUAD = 'QUAD',
  VERTICAL = 'VERTICAL',
}
export enum ProjectionMode {
  CORNER = 'CORNER',
  CUBE = 'CUBE',
  CYLINDER = 'CYLINDER',
  DOME = 'DOME',
  GAUSSIAN_SPLAT = 'GAUSSIAN_SPLAT',
  INFINITE_BOX = 'INFINITE_BOX',
  PANORAMA = 'PANORAMA',
  PLANE = 'PLANE',
  SPHERE = 'SPHERE',
}
export enum RenderStyle {
  ANIME = 'ANIME',
  CEL_SHADING = 'CEL_SHADING',
  CRYSTAL = 'CRYSTAL',
  HOLOGRAM_V2 = 'HOLOGRAM_V2',
  INK_WASH = 'INK_WASH',
  MATRIX = 'MATRIX',
  NORMAL = 'NORMAL',
  RETRO_PIXEL = 'RETRO_PIXEL',
}
export enum SceneType {
  INDOOR = 'INDOOR',
  OBJECT = 'OBJECT',
  OUTDOOR = 'OUTDOOR',
  UNKNOWN = 'UNKNOWN',
}
export enum TechPipeline {
  DEPTH_MESH = 'DEPTH_MESH',
  GAUSSIAN_SPLAT = 'GAUSSIAN_SPLAT',
  GENERATIVE_MESH = 'GENERATIVE_MESH',
}

export const SESSION_STATUS_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  idle: ['uploading'],
  uploading: ['analyzing', 'error'],
  analyzing: ['processing_depth', 'ready', 'error'],
  processing_depth: ['ready', 'error'],
  ready: ['idle'],
  error: ['idle'],
};
