export interface ExportStateInfo {
  format: 'gltf' | 'glb' | 'png' | 'video' | null;
  isExporting: boolean;
  progress: number;
}
