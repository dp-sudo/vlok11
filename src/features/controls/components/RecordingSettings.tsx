import type React from 'react';
import { memo } from 'react';
import type { SceneConfig } from '@/shared/types';
import { RECORDING_QUALITIES } from '../constants';

interface RecordingSettingsProps {
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}

type RecordingQuality = 'high' | 'medium' | 'low';

const getBitrate = (quality: RecordingQuality): number => {
  const bitrates: Record<RecordingQuality, number> = {
    high: 8000000,
    medium: 4000000,
    low: 2000000,
  };

  return bitrates[quality];
};

const RESOLUTIONS = [
  { value: '1920x1080', label: '1080p', width: 1920, height: 1080 },
  { value: '2560x1440', label: '1440p', width: 2560, height: 1440 },
  { value: '3840x2160', label: '4K', width: 3840, height: 2160 },
  { value: '1280x720', label: '720p', width: 1280, height: 720 },
] as const;

const FPS_OPTIONS = [
  { value: 60, label: '60fps' },
  { value: 30, label: '30fps' },
  { value: 24, label: '24fps' },
  { value: 15, label: '15fps' },
] as const;

const CODEC_OPTIONS = [
  { value: 'vp9', label: 'VP9', desc: '高质量, WebM' },
  { value: 'h264', label: 'H.264', desc: '兼容性最好' },
  { value: 'av1', label: 'AV1', desc: '最新压缩标准' },
] as const;

export const RecordingSettings: React.FC<RecordingSettingsProps> = memo(({ config, set }) => {
  const currentQuality = RECORDING_QUALITIES.find((q) => q.quality === config.recordingQuality);

  // 从配置中获取值
  const currentFps = config.recordingFps ?? 60;
  const currentResolution = config.recordingResolution ?? '1920x1080';
  const currentCodec = config.recordingCodec ?? 'vp9';

  return (
    <div className="p-3 space-y-4">
      {/* 录制质量 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">录制质量</span>
          <span className="text-[10px] text-blue-400">
            {currentQuality?.icon} {currentQuality?.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {RECORDING_QUALITIES.map((q) => (
            <button
              className={`
                py-2 px-1.5 text-[10px] rounded-lg border transition-all flex flex-col items-center gap-0.5
                ${
                  config.recordingQuality === q.quality
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }
              `}
              key={q.quality}
              onClick={() => set('recordingQuality', q.quality as RecordingQuality)}
              type="button"
            >
              <span className="text-sm">{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 分辨率设置 */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-400">分辨率</span>
        <div className="grid grid-cols-4 gap-1">
          {RESOLUTIONS.map((res) => (
            <button
              className={`
                py-1.5 px-1 text-[10px] rounded-lg border transition-all
                ${
                  currentResolution === res.value
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }
              `}
              key={res.value}
              onClick={() =>
                (set as (key: string, value: string) => void)('recordingResolution', res.value)
              }
              type="button"
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>

      {/* 帧率设置 */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-400">帧率</span>
        <div className="grid grid-cols-4 gap-1">
          {FPS_OPTIONS.map((fps) => (
            <button
              className={`
                py-1.5 px-1 text-[10px] rounded-lg border transition-all
                ${
                  currentFps === fps.value
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }
              `}
              key={fps.value}
              onClick={() =>
                (set as (key: string, value: number) => void)('recordingFps', fps.value)
              }
              type="button"
            >
              {fps.label}
            </button>
          ))}
        </div>
      </div>

      {/* 编码格式 */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-400">编码格式</span>
        <div className="grid grid-cols-3 gap-1">
          {CODEC_OPTIONS.map((codec) => (
            <button
              className={`
                py-1.5 px-1 text-[10px] rounded-lg border transition-all flex flex-col items-center
                ${
                  currentCodec === codec.value
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }
              `}
              key={codec.value}
              onClick={() =>
                (set as (key: string, value: string) => void)('recordingCodec', codec.value)
              }
              type="button"
            >
              <span className="font-medium">{codec.label}</span>
              <span className="text-[8px] opacity-60">{codec.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 文件大小预估 */}
      <div className="text-[9px] text-zinc-500 text-center p-2 bg-zinc-800/30 rounded-lg">
        预估1分钟: 约{Math.round((getBitrate(config.recordingQuality) * 60) / 8 / 1024 / 1024)}MB
        {currentResolution !== '1920x1080' && (
          <span className="ml-1 text-zinc-600">
            ({RESOLUTIONS.find((r) => r.value === currentResolution)?.label})
          </span>
        )}
      </div>
    </div>
  );
});

RecordingSettings.displayName = 'RecordingSettings';
