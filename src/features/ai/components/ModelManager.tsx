import { memo, useCallback, useEffect, useState } from 'react';

import {
  getModelRegistry,
  type ModelBenchmarkResult,
  type ModelInfo,
} from '../services/ModelRegistry';

import { ModelCard } from './ModelCard';
import { ModelDetails } from './ModelDetails';

const BYTES_PER_KB = 1024;
const BYTES_DISPLAY_PRECISION = 100;
const MS_PER_SECOND = 1000;
const TIME_DISPLAY_PRECISION = 10;
const MS_IN_MICROSECOND = 1;
const MICROSECONDS_PER_MS = 1000;

interface ModelManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelManager = memo(({ isOpen, onClose }: ModelManagerProps) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [benchmark, setBenchmark] = useState<ModelBenchmarkResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'loaded' | 'available'>('all');

  useEffect(() => {
    loadModels();
  }, [filter]);

  const loadModels = () => {
    const registry = getModelRegistry();
    let loadedModels = registry.getAll();

    if (filter === 'loaded') {
      loadedModels = registry.getLoadedModels();
    } else if (filter === 'available') {
      loadedModels = loadedModels.filter((m) => m.status === 'available');
    }

    setModels(loadedModels);
  };

  const handleSelectModel = useCallback((model: ModelInfo) => {
    setSelectedModel(model);
    const registry = getModelRegistry();
    const benchmarkData = registry.getBenchmark(model.id);

    setBenchmark(benchmarkData ?? null);
  }, []);

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB));

    return `${Math.round((bytes / BYTES_PER_KB ** i) * BYTES_DISPLAY_PRECISION) / BYTES_DISPLAY_PRECISION} ${sizes[i]}`;
  }, []);

  const formatTime = useCallback((ms: number): string => {
    if (ms < MS_IN_MICROSECOND) return `${Math.round(ms * MICROSECONDS_PER_MS)} μs`;
    if (ms < MS_PER_SECOND) return `${Math.round(ms)} ms`;

    return `${Math.round(ms / BYTES_DISPLAY_PRECISION) / TIME_DISPLAY_PRECISION} s`;
  }, []);

  const getTotalSize = useCallback((): string => {
    const registry = getModelRegistry();

    return formatBytes(registry.getTotalSize());
  }, [formatBytes]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-300 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-300 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">AI 模型管理</h2>
            <p className="text-sm text-slate-400 mt-1">
              共 {models.length} 个模型 · 总大小 {getTotalSize()}
            </p>
          </div>
          <button
            className="text-slate-400 hover:text-slate-800 transition-colors"
            onClick={onClose}
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>
        </div>

        <div className="p-6 border-b border-slate-300">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 text-sm rounded transition-colors ${filter === 'all' ? 'bg-blue-600 text-slate-800' : 'bg-slate-800 text-slate-400 hover:bg-slate-300'}`}
              onClick={() => setFilter('all')}
              type="button"
            >
              全部
            </button>
            <button
              className={`px-3 py-1 text-sm rounded transition-colors ${filter === 'loaded' ? 'bg-blue-600 text-slate-800' : 'bg-slate-800 text-slate-400 hover:bg-slate-300'}`}
              onClick={() => setFilter('loaded')}
              type="button"
            >
              已加载
            </button>
            <button
              className={`px-3 py-1 text-sm rounded transition-colors ${filter === 'available' ? 'bg-blue-600 text-slate-800' : 'bg-slate-800 text-slate-400 hover:bg-slate-300'}`}
              onClick={() => setFilter('available')}
              type="button"
            >
              可用
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-2/5 overflow-y-auto border-r border-slate-300 p-4 space-y-2">
            {models.length === 0 ? (
              <p className="text-slate-500 text-center py-8">暂无模型</p>
            ) : (
              models.map((model) => (
                <ModelCard
                  isSelected={selectedModel?.id === model.id}
                  key={model.id}
                  model={model}
                  onFormatBytes={formatBytes}
                  onSelect={handleSelectModel}
                />
              ))
            )}
          </div>

          <div className="w-3/5 overflow-y-auto p-6">
            {selectedModel ? (
              <ModelDetails
                benchmark={benchmark}
                model={selectedModel}
                onFormatBytes={formatBytes}
                onFormatTime={formatTime}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                请选择一个模型查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ModelManager.displayName = 'ModelManager';
