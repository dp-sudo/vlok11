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

export const RecordingSettings: React.FC<RecordingSettingsProps> = memo(({ config, set }) => {
  const currentQuality = RECORDING_QUALITIES.find((q) => q.quality === config.recordingQuality);

  return (
    <div className="p-3 space-y-3">
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
          >
            <span className="text-sm">{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      <div className="text-[9px] text-zinc-500 text-center">
        {RECORDING_QUALITIES.map((q) => (
          <span
            key={q.quality}
            className={config.recordingQuality === q.quality ? 'inline' : 'hidden'}
          >
            预估1分钟: 约{Math.round((getBitrate(q.quality) * 60) / 8 / 1024 / 1024)}MB
          </span>
        ))}
      </div>
    </div>
  );
});

RecordingSettings.displayName = 'RecordingSettings';
