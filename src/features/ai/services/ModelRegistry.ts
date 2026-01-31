import { createLogger } from '@/core/Logger';

export interface ModelInfo {
  description: string;
  error?: string;
  id: string;
  loadedAt?: number;
  name: string;
  performance: {
    avgInferenceTime?: number;
    maxInputSize?: { height: number; width: number };
    minInputSize?: { height: number; width: number };
  };
  provider: 'tensorflow' | 'gemini' | 'mediapipe';
  size: number;
  status: 'available' | 'loading' | 'loaded' | 'error';
  type: 'depth-estimation' | 'segmentation' | 'face-detection' | 'custom';
  version: string;
}

export interface ModelBenchmarkResult {
  avgInferenceTime: number;
  deviceInfo: {
    gpu?: string;
    memory?: number;
    platform: string;
  };
  maxInferenceTime: number;
  minInferenceTime: number;
  modelId: string;
  samples: number;
  timestamp: number;
}

class ModelRegistryImpl {
  private static instance: ModelRegistryImpl | null = null;
  private benchmarks = new Map<string, ModelBenchmarkResult>();
  private logger = createLogger({ module: 'ModelRegistry' });
  private models = new Map<string, ModelInfo>();

  private constructor() {
    this.registerDefaultModels();
  }

  static getInstance(): ModelRegistryImpl {
    ModelRegistryImpl.instance ??= new ModelRegistryImpl();

    return ModelRegistryImpl.instance;
  }

  static resetInstance(): void {
    ModelRegistryImpl.instance = null;
  }

  clear(): void {
    this.models.clear();
    this.benchmarks.clear();
    this.registerDefaultModels();
    this.logger.info('Registry cleared and reset');
  }

  clearBenchmarks(): void {
    this.benchmarks.clear();
    this.logger.info('All benchmarks cleared');
  }

  private detectGPU(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');

      if (!gl) return undefined;

      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');

      if (!debugInfo) return undefined;

      return (gl as WebGLRenderingContext).getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      ) as string;
    } catch {
      return undefined;
    }
  }

  get(modelId: string): ModelInfo | undefined {
    return this.models.get(modelId);
  }

  getAll(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  getAllBenchmarks(): ModelBenchmarkResult[] {
    return Array.from(this.benchmarks.values());
  }

  getBenchmark(modelId: string): ModelBenchmarkResult | undefined {
    return this.benchmarks.get(modelId);
  }

  getByProvider(provider: ModelInfo['provider']): ModelInfo[] {
    return this.getAll().filter((model) => model.provider === provider);
  }

  getByType(type: ModelInfo['type']): ModelInfo[] {
    return this.getAll().filter((model) => model.type === type);
  }

  getLoadedModels(): ModelInfo[] {
    return this.getAll().filter((model) => model.status === 'loaded');
  }

  getTotalSize(): number {
    return this.getAll().reduce((sum, model) => sum + model.size, 0);
  }

  register(model: ModelInfo): void {
    this.models.set(model.id, model);
    this.logger.info(`Model registered: ${model.id}`, { model });
  }

  private registerDefaultModels(): void {
    const defaultModels: ModelInfo[] = [
      {
        id: 'depth-estimation-v1',
        name: 'MiDaS Depth Estimation',
        version: '1.0.0',
        type: 'depth-estimation',
        provider: 'tensorflow',
        size: 5242880,
        description: '基于 MiDaS 的单目深度估计模型',
        performance: {
          minInputSize: { width: 256, height: 256 },
          maxInputSize: { width: 1024, height: 1024 },
        },
        status: 'available',
      },
      {
        id: 'selfie-segmentation-v1',
        name: 'Selfie Segmentation',
        version: '0.1.0',
        type: 'segmentation',
        provider: 'mediapipe',
        size: 2097152,
        description: 'MediaPipe 人物分割模型',
        performance: {
          minInputSize: { width: 256, height: 256 },
          maxInputSize: { width: 1920, height: 1080 },
        },
        status: 'available',
      },
      {
        id: 'body-segmentation-v1',
        name: 'Body Segmentation',
        version: '1.0.2',
        type: 'segmentation',
        provider: 'tensorflow',
        size: 3145728,
        description: 'TensorFlow.js 身体分割模型',
        performance: {
          minInputSize: { width: 256, height: 256 },
          maxInputSize: { width: 1280, height: 720 },
        },
        status: 'available',
      },
      {
        id: 'face-detection-v1',
        name: 'BlazeFace Detection',
        version: '1.0.3',
        type: 'face-detection',
        provider: 'tensorflow',
        size: 1048576,
        description: 'BlazeFace 人脸检测模型',
        performance: {
          minInputSize: { width: 128, height: 128 },
          maxInputSize: { width: 1920, height: 1080 },
        },
        status: 'available',
      },
    ];

    for (const model of defaultModels) {
      this.models.set(model.id, model);
    }

    this.logger.info(`Registered ${defaultModels.length} default models`);
  }

  async runBenchmark(
    modelId: string,
    inferenceFunc: () => Promise<void>,
    samples = 10
  ): Promise<ModelBenchmarkResult> {
    const model = this.get(modelId);

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    this.logger.info(`Starting benchmark for model: ${modelId}`, { samples });

    const times: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = performance.now();

      await inferenceFunc();
      const end = performance.now();

      times.push(end - start);
    }

    const avgInferenceTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minInferenceTime = Math.min(...times);
    const maxInferenceTime = Math.max(...times);

    const result: ModelBenchmarkResult = {
      modelId,
      avgInferenceTime,
      minInferenceTime,
      maxInferenceTime,
      samples,
      timestamp: Date.now(),
      deviceInfo: {
        platform: navigator.platform,
        memory: (performance as unknown as { memory?: { jsHeapSizeLimit: number } }).memory
          ?.jsHeapSizeLimit,
        gpu: this.detectGPU(),
      },
    };

    this.saveBenchmark(result);

    return result;
  }

  saveBenchmark(result: ModelBenchmarkResult): void {
    this.benchmarks.set(result.modelId, result);
    const model = this.models.get(result.modelId);

    if (model) {
      model.performance.avgInferenceTime = result.avgInferenceTime;
    }
    this.logger.info(`Benchmark saved for model: ${result.modelId}`, { result });
  }

  unregister(modelId: string): boolean {
    const deleted = this.models.delete(modelId);

    if (deleted) {
      this.logger.info(`Model unregistered: ${modelId}`);
    }

    return deleted;
  }

  updateStatus(modelId: string, status: ModelInfo['status'], error?: string): void {
    const model = this.models.get(modelId);

    if (model) {
      model.status = status;
      if (status === 'loaded') {
        model.loadedAt = Date.now();
      }
      if (error) {
        model.error = error;
      }
      this.logger.info(`Model status updated: ${modelId}`, { status, error });
    }
  }
}

export const getModelRegistry = (): ModelRegistryImpl => ModelRegistryImpl.getInstance();
export const resetModelRegistry = (): void => ModelRegistryImpl.resetInstance();
