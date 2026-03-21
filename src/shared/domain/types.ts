import type { Asset, ProcessedAsset, SessionStatus } from '@/core/domain/types';
import type { ExportStateInfo } from './types.export';

export type {
  Asset,
  AssetType,
  BaseAsset,
  ImageAsset,
  ProcessedAsset as ProcessingResult,
  SessionStatus as ProcessingStatus,
  VideoAsset,
} from '@/core/domain/types';

export type { ExportStateInfo } from '@/shared/domain/types.export';

export interface SessionState {
  currentAsset?: Asset;
  error?: Error;
  exportState: ExportStateInfo;
  id: string;
  progress: number;
  result?: ProcessedAsset;
  status: SessionStatus;
  statusMessage?: string;
}
