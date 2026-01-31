import { createLogger } from '@/core/Logger';

import type { BrushStroke, ToolSettings, ToolType } from './types';

export class DepthEditorEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private depthData: ImageData;
  private history: BrushStroke[] = [];
  private historyIndex = -1;
  private logger = createLogger({ module: 'DepthEditorEngine' });
  private maxHistory = 50;

  constructor(canvas: HTMLCanvasElement, initialDepthData: ImageData) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) throw new Error('Cannot get 2D context');
    this.ctx = context;
    this.depthData = initialDepthData;
    this.canvas.width = initialDepthData.width;
    this.canvas.height = initialDepthData.height;
    this.ctx.putImageData(initialDepthData, 0, 0);
    this.logger.info('DepthEditorEngine initialized', {
      width: initialDepthData.width,
      height: initialDepthData.height,
    });
  }

  addToHistory(stroke: BrushStroke): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(stroke);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  private applyBlur(x: number, y: number, settings: ToolSettings): void {
    const { size } = settings;
    const radius = Math.floor(size / 2);
    const imageData = this.ctx.getImageData(
      Math.max(0, x - radius),
      Math.max(0, y - radius),
      Math.min(size, this.canvas.width - (x - radius)),
      Math.min(size, this.canvas.height - (y - radius))
    );
    const { data } = imageData;
    const kernel = 3;
    const output = new Uint8ClampedArray(data);

    for (let py = kernel; py < imageData.height - kernel; py++) {
      for (let px = kernel; px < imageData.width - kernel; px++) {
        let sum = 0;
        let count = 0;

        for (let ky = -kernel; ky <= kernel; ky++) {
          for (let kx = -kernel; kx <= kernel; kx++) {
            const idx = ((py + ky) * imageData.width + (px + kx)) * 4;

            sum += data[idx] ?? 0;
            count++;
          }
        }
        const idx = (py * imageData.width + px) * 4;
        const avg = sum / count;

        output[idx] = avg;
        output[idx + 1] = avg;
        output[idx + 2] = avg;
      }
    }

    for (let i = 0; i < output.length; i++) {
      data[i] = output[i] ?? 0;
    }

    this.ctx.putImageData(imageData, Math.max(0, x - radius), Math.max(0, y - radius));
  }

  private applyFill(x: number, y: number, settings: ToolSettings): void {
    const { depthValue } = settings;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const { data } = imageData;
    const px = Math.floor(x);
    const py = Math.floor(y);

    if (!this.isValidPixel(px, py)) return;

    const idx = (py * this.canvas.width + px) * 4;
    const targetDepth = data[idx] ?? 0;

    if (Math.abs(targetDepth - depthValue) < 1) return;

    this.floodFill(data, px, py, targetDepth, depthValue);
    this.ctx.putImageData(imageData, 0, 0);
  }

  private applySharpen(x: number, y: number, settings: ToolSettings): void {
    const { size } = settings;
    const radius = Math.floor(size / 2);
    const imageData = this.ctx.getImageData(
      Math.max(0, x - radius),
      Math.max(0, y - radius),
      Math.min(size, this.canvas.width - (x - radius)),
      Math.min(size, this.canvas.height - (y - radius))
    );
    const { data } = imageData;
    const output = new Uint8ClampedArray(data);

    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ];

    for (let py = 1; py < imageData.height - 1; py++) {
      for (let px = 1; px < imageData.width - 1; px++) {
        let sum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((py + ky) * imageData.width + (px + kx)) * 4;

            sum += (data[idx] ?? 0) * (kernel[ky + 1]?.[kx + 1] ?? 0);
          }
        }
        const idx = (py * imageData.width + px) * 4;

        output[idx] = Math.min(255, Math.max(0, sum));
        output[idx + 1] = output[idx];
        output[idx + 2] = output[idx];
      }
    }

    for (let i = 0; i < output.length; i++) {
      data[i] = output[i] ?? 0;
    }

    this.ctx.putImageData(imageData, Math.max(0, x - radius), Math.max(0, y - radius));
  }

  applyTool(tool: ToolType, x: number, y: number, settings: ToolSettings, pressure = 1.0): void {
    switch (tool) {
      case 'brush':
        this.drawBrush(x, y, settings, pressure);
        break;
      case 'eraser':
        this.drawEraser(x, y, settings, pressure);
        break;
      case 'blur':
        this.applyBlur(x, y, settings);
        break;
      case 'sharpen':
        this.applySharpen(x, y, settings);
        break;
      case 'fill':
        this.applyFill(x, y, settings);
        break;
      case 'eyedropper':
        break;
    }
  }

  dispose(): void {
    this.history = [];
    this.logger.info('DepthEditorEngine disposed');
  }

  private drawBrush(x: number, y: number, settings: ToolSettings, pressure: number): void {
    const { size, opacity, hardness, depthValue } = settings;
    const radius = Math.floor(size / 2) * pressure;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const { data } = imageData;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) continue;

        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);

        if (px < 0 || px >= this.canvas.width || py < 0 || py >= this.canvas.height) continue;

        const idx = (py * this.canvas.width + px) * 4;
        const falloff = Math.pow(1 - distance / radius, hardness * 2);
        const alpha = opacity * falloff * pressure;

        const currentDepth = data[idx] ?? 0;
        const newDepth = currentDepth * (1 - alpha) + depthValue * alpha;

        data[idx] = newDepth;
        data[idx + 1] = newDepth;
        data[idx + 2] = newDepth;
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private drawEraser(x: number, y: number, settings: ToolSettings, pressure: number): void {
    const { size, opacity } = settings;
    const radius = Math.floor(size / 2) * pressure;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const { data } = imageData;
    const originalData = this.depthData.data;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) continue;

        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);

        if (px < 0 || px >= this.canvas.width || py < 0 || py >= this.canvas.height) continue;

        const idx = (py * this.canvas.width + px) * 4;
        const alpha = opacity * pressure * (1 - distance / radius);

        const currentDepth = data[idx] ?? 0;
        const originalDepth = originalData[idx] ?? 0;
        const newDepth = currentDepth * (1 - alpha) + originalDepth * alpha;

        data[idx] = newDepth;
        data[idx + 1] = newDepth;
        data[idx + 2] = newDepth;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private floodFill(
    data: Uint8ClampedArray,
    startX: number,
    startY: number,
    targetDepth: number,
    depthValue: number
  ): void {
    const stack: Array<[number, number]> = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (!this.isValidPixel(cx, cy)) continue;

      const cidx = (cy * this.canvas.width + cx) * 4;
      const currentDepth = data[cidx] ?? 0;

      if (Math.abs(currentDepth - targetDepth) <= 10) {
        this.setPixelDepth(data, cidx, depthValue);
        this.pushNeighbors(stack, cx, cy);
      }
    }
  }

  getDepthData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  getDepthValue(x: number, y: number): number {
    const px = Math.floor(x);
    const py = Math.floor(y);

    if (px < 0 || px >= this.canvas.width || py < 0 || py >= this.canvas.height) return 128;

    const imageData = this.ctx.getImageData(px, py, 1, 1);

    return imageData.data[0] ?? 128;
  }

  private isValidPixel(x: number, y: number): boolean {
    return x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height;
  }

  private pushNeighbors(stack: Array<[number, number]>, cx: number, cy: number): void {
    if (stack.length < 10000) {
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;
    this.historyIndex++;
    this.replayHistory();

    return true;
  }

  private replayHistory(): void {
    this.ctx.putImageData(this.depthData, 0, 0);
    for (let i = 0; i <= this.historyIndex; i++) {
      const stroke = this.history[i];

      if (stroke) {
        for (const point of stroke.points) {
          this.applyTool(stroke.tool, point.x, point.y, stroke.settings, point.pressure);
        }
      }
    }
  }

  reset(): void {
    this.ctx.putImageData(this.depthData, 0, 0);
    this.history = [];
    this.historyIndex = -1;
  }

  private setPixelDepth(data: Uint8ClampedArray, idx: number, depthValue: number): void {
    data[idx] = depthValue;
    data[idx + 1] = depthValue;
    data[idx + 2] = depthValue;
    data[idx + 3] = 255;
  }

  undo(): boolean {
    if (this.historyIndex < 0) return false;
    this.historyIndex--;
    this.replayHistory();

    return true;
  }
}
