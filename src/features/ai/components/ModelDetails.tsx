import type { ModelBenchmarkResult, ModelInfo } from '../services/ModelRegistry';

interface ModelDetailsProps {
  benchmark: ModelBenchmarkResult | null;
  model: ModelInfo;
  onFormatBytes: (bytes: number) => string;
  onFormatTime: (ms: number) => string;
}

export const ModelDetails = ({
  benchmark,
  model,
  onFormatBytes,
  onFormatTime,
}: ModelDetailsProps) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{model.name}</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">模型 ID</span>
          <span className="text-slate-800 font-mono">{model.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">版本</span>
          <span className="text-slate-800">{model.version}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">类型</span>
          <span className="text-slate-800">{model.type}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">提供商</span>
          <span className="text-slate-800">{model.provider}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">大小</span>
          <span className="text-slate-800">{onFormatBytes(model.size)}</span>
        </div>
        {model.loadedAt ? (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">加载时间</span>
            <span className="text-slate-800">{new Date(model.loadedAt).toLocaleString()}</span>
          </div>
        ) : null}
      </div>
    </div>

    {model.performance ? (
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-3">性能参数</h4>
        <div className="space-y-2 text-sm">
          {model.performance.avgInferenceTime ? (
            <div className="flex justify-between">
              <span className="text-slate-400">平均推理时间</span>
              <span className="text-slate-800">
                {onFormatTime(model.performance.avgInferenceTime)}
              </span>
            </div>
          ) : null}
          {model.performance.minInputSize ? (
            <div className="flex justify-between">
              <span className="text-slate-400">最小输入尺寸</span>
              <span className="text-slate-800">
                {model.performance.minInputSize.width} × {model.performance.minInputSize.height}
              </span>
            </div>
          ) : null}
          {model.performance.maxInputSize ? (
            <div className="flex justify-between">
              <span className="text-slate-400">最大输入尺寸</span>
              <span className="text-slate-800">
                {model.performance.maxInputSize.width} × {model.performance.maxInputSize.height}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    ) : null}

    {benchmark ? (
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-3">基准测试结果</h4>
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">平均时间</span>
            <span className="text-green-400 font-semibold">
              {onFormatTime(benchmark.avgInferenceTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">最快时间</span>
            <span className="text-slate-800">{onFormatTime(benchmark.minInferenceTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">最慢时间</span>
            <span className="text-slate-800">{onFormatTime(benchmark.maxInferenceTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">样本数量</span>
            <span className="text-slate-800">{benchmark.samples}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">测试时间</span>
            <span className="text-slate-800">{new Date(benchmark.timestamp).toLocaleString()}</span>
          </div>
          {benchmark.deviceInfo.gpu ? (
            <div className="flex justify-between">
              <span className="text-slate-400">GPU</span>
              <span className="text-slate-800 text-xs">{benchmark.deviceInfo.gpu}</span>
            </div>
          ) : null}
        </div>
      </div>
    ) : null}

    {model.error ? (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm">{model.error}</p>
      </div>
    ) : null}
  </div>
);
