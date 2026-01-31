import { useCallback, useRef, useState } from 'react';

import { DepthEditorEngine } from '../DepthEditorEngine';
import { DEFAULT_TOOL_SETTINGS } from '../types';

import type { ToolSettings, ToolType } from '../types';

const DEFAULT_DEPTH_VALUE = 128;

interface UseDepthEditorReturn {
  applyTool: (x: number, y: number, pressure?: number) => void;
  canRedo: boolean;
  canUndo: boolean;
  currentTool: ToolType;
  dispose: () => void;
  getDepthData: () => ImageData | null;
  getDepthValue: (x: number, y: number) => number;
  initEngine: (canvas: HTMLCanvasElement, depthData: ImageData) => void;
  isInitialized: boolean;
  redo: () => void;
  reset: () => void;
  setCurrentTool: (tool: ToolType) => void;
  setToolSetting: <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => void;
  toolSettings: ToolSettings;
  undo: () => void;
}

export function useDepthEditor(): UseDepthEditorReturn {
  const engineRef = useRef<DepthEditorEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolType>('brush');
  const [toolSettings, setToolSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const initEngine = useCallback((canvas: HTMLCanvasElement, depthData: ImageData) => {
    if (engineRef.current) {
      engineRef.current.dispose();
    }

    engineRef.current = new DepthEditorEngine(canvas, depthData);
    setIsInitialized(true);
    setHistoryState({ canUndo: false, canRedo: false });
  }, []);

  const dispose = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    setIsInitialized(false);
  }, []);

  const applyTool = useCallback(
    (x: number, y: number, pressure = 1.0) => {
      if (!engineRef.current) return;

      engineRef.current.applyTool(currentTool, x, y, toolSettings, pressure);
    },
    [currentTool, toolSettings]
  );

  const undo = useCallback(() => {
    if (!engineRef.current) return;

    const success = engineRef.current.undo();

    if (success) {
      setHistoryState((prev) => ({ ...prev, canRedo: true }));
    }
  }, []);

  const redo = useCallback(() => {
    if (!engineRef.current) return;

    const success = engineRef.current.redo();

    if (success) {
      setHistoryState((prev) => ({ ...prev, canUndo: true }));
    }
  }, []);

  const reset = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.reset();
    setHistoryState({ canUndo: false, canRedo: false });
  }, []);

  const getDepthData = useCallback(() => {
    if (!engineRef.current) return null;

    return engineRef.current.getDepthData();
  }, []);

  const getDepthValue = useCallback((x: number, y: number) => {
    if (!engineRef.current) return DEFAULT_DEPTH_VALUE;

    return engineRef.current.getDepthValue(x, y);
  }, []);

  const setToolSetting = useCallback(<K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => {
    setToolSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    applyTool,
    canRedo: historyState.canRedo,
    canUndo: historyState.canUndo,
    currentTool,
    dispose,
    getDepthData,
    getDepthValue,
    initEngine,
    isInitialized,
    redo,
    reset,
    setCurrentTool,
    setToolSetting,
    toolSettings,
    undo,
  };
}
