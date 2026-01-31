export type AssetType = 'image' | 'video';

export interface Asset {
  aspectRatio: number;
  dimensions: { height: number; width: number };
  duration?: number;
  file?: File;
  id: string;
  sourceUrl: string;
  type: AssetType;
}

export type ProcessingStatus =
  | 'analyzing'
  | 'error'
  | 'idle'
  | 'processing_depth'
  | 'ready'
  | 'uploading';

export interface ProcessingResult {
  asset: Asset;
  backgroundUrl?: string;
  depthMapUrl: string;
  imageUrl: string;
}

export interface ExportStateInfo {
  format: 'gltf' | 'glb' | 'png' | 'video' | null;
  isExporting: boolean;
  progress: number;
}

export interface SessionState {
  currentAsset?: Asset;
  error?: Error;
  exportState: ExportStateInfo;
  id: string;
  progress: number;
  result?: ProcessingResult;
  status: ProcessingStatus;
  statusMessage?: string;
}
