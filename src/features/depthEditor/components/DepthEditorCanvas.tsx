import { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { ToolSettings, ToolType } from '../types';

const DEFAULT_DEPTH_VALUE = 128;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.1;
const PERCENT_MULTIPLIER = 100;

interface DepthEditorCanvasProps {
  currentTool: ToolType;
  depthImageUrl: string;
  onApplyTool: (x: number, y: number, pressure?: number) => void;
  onDepthPick?: (value: number) => void;
  onInit: (canvas: HTMLCanvasElement, depthData: ImageData) => void;
  toolSettings: ToolSettings;
}

export const DepthEditorCanvas = memo<DepthEditorCanvasProps>(
  ({ depthImageUrl, onInit, onApplyTool, currentTool, toolSettings, onDepthPick }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const lastPanRef = useRef({ x: 0, y: 0 });
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
      if (!depthImageUrl || !canvasRef.current) return;

      const img = new Image();

      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) return;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        onInit(canvas, imageData);
      };
      img.src = depthImageUrl;
    }, [depthImageUrl, onInit]);

    const getCanvasCoords = useCallback(
      (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;

        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
        const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

        const x = (clientX - rect.left - pan.x) / zoom;
        const y = (clientY - rect.top - pan.y) / zoom;

        return { x, y };
      },
      [zoom, pan]
    );

    const handlePointerDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
          setIsPanning(true);
          lastPanRef.current = { x: e.clientX, y: e.clientY };

          return;
        }

        const coords = getCanvasCoords(e);

        if (!coords) return;

        if (currentTool === 'eyedropper') {
          const canvas = canvasRef.current;

          if (canvas) {
            const ctx = canvas.getContext('2d');

            if (ctx) {
              const pixel = ctx.getImageData(Math.floor(coords.x), Math.floor(coords.y), 1, 1);

              onDepthPick?.(pixel.data[0] ?? DEFAULT_DEPTH_VALUE);
            }
          }

          return;
        }

        setIsDrawing(true);
        onApplyTool(coords.x, coords.y);
      },
      [currentTool, getCanvasCoords, onApplyTool, onDepthPick]
    );

    const handlePointerMove = useCallback(
      (e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);

        if (coords) setCursorPos(coords);

        if (isPanning) {
          const dx = e.clientX - lastPanRef.current.x;
          const dy = e.clientY - lastPanRef.current.y;

          setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
          lastPanRef.current = { x: e.clientX, y: e.clientY };

          return;
        }

        if (!isDrawing || !coords) return;

        onApplyTool(coords.x, coords.y);
      },
      [getCanvasCoords, isDrawing, isPanning, onApplyTool]
    );

    const handlePointerUp = useCallback(() => {
      setIsDrawing(false);
      setIsPanning(false);
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;

      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta)));
    }, []);

    return (
      <div
        className="relative flex-1 bg-zinc-950 overflow-hidden rounded-lg border border-zinc-700"
        onMouseDown={handlePointerDown}
        onMouseLeave={handlePointerUp}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onWheel={handleWheel}
        ref={containerRef}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <canvas className="block" ref={canvasRef} style={{ imageRendering: 'pixelated' }} />
        </div>

        {cursorPos && currentTool !== 'eyedropper' && currentTool !== 'fill' ? (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-white/50"
            style={{
              width: toolSettings.size * zoom,
              height: toolSettings.size * zoom,
              left: cursorPos.x * zoom + pan.x - (toolSettings.size * zoom) / 2,
              top: cursorPos.y * zoom + pan.y - (toolSettings.size * zoom) / 2,
            }}
          />
        ) : null}

        <div className="absolute bottom-2 right-2 bg-zinc-900/80 px-2 py-1 rounded text-xs text-zinc-400">
          {Math.round(zoom * PERCENT_MULTIPLIER)}%
        </div>
      </div>
    );
  }
);

DepthEditorCanvas.displayName = 'DepthEditorCanvas';
