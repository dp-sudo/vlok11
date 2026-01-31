export type ToolType = 'brush' | 'eraser' | 'blur' | 'sharpen' | 'fill' | 'eyedropper';

export interface ToolSettings {
  depthValue: number;
  hardness: number;
  opacity: number;
  size: number;
}

export interface BrushStroke {
  id: string;
  points: Array<{ pressure: number; x: number; y: number }>;
  settings: ToolSettings;
  timestamp: number;
  tool: ToolType;
}

export interface DepthEditorState {
  currentTool: ToolType;
  history: BrushStroke[];
  historyIndex: number;
  isDrawing: boolean;
  panOffset: { x: number; y: number };
  previewEnabled: boolean;
  toolSettings: ToolSettings;
  zoomLevel: number;
}

export interface CanvasContext {
  depthImageData: ImageData | null;
  mainCanvas: HTMLCanvasElement | null;
  originalImageData: ImageData | null;
  previewCanvas: HTMLCanvasElement | null;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  size: 20,
  opacity: 1.0,
  hardness: 0.8,
  depthValue: 128,
};

export const TOOL_ICONS: Record<ToolType, string> = {
  brush: '🖌️',
  eraser: '🧹',
  blur: '💨',
  sharpen: '🔍',
  fill: '🪣',
  eyedropper: '💉',
};

export const TOOL_LABELS: Record<ToolType, string> = {
  brush: '画笔',
  eraser: '橡皮擦',
  blur: '模糊',
  sharpen: '锐化',
  fill: '填充',
  eyedropper: '吸管',
};
