import { memo } from 'react';

import type { ToolSettings, ToolType } from '../types';

interface DepthEditorSettingsProps {
  currentTool: ToolType;
  onSettingChange: <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => void;
  settings: ToolSettings;
}

interface SliderRowProps {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  unit?: string;
  value: number;
}

const SliderRow = memo<SliderRowProps>(({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-xs">
      <span className="text-zinc-400">{label}</span>
      <span className="text-zinc-300 font-mono">
        {step < 1 ? value.toFixed(2) : value}
        {unit}
      </span>
    </div>
    <input
      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-3
        [&::-webkit-slider-thumb]:h-3
        [&::-webkit-slider-thumb]:bg-indigo-500
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:shadow-lg
        [&::-webkit-slider-thumb]:transition-transform
        [&::-webkit-slider-thumb]:hover:scale-125"
      max={max}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      step={step}
      type="range"
      value={value}
    />
  </div>
));

SliderRow.displayName = 'SliderRow';

export const DepthEditorSettings = memo<DepthEditorSettingsProps>(
  ({ settings, onSettingChange, currentTool }) => {
    const showHardness = currentTool === 'brush';
    const showDepthValue = currentTool === 'brush' || currentTool === 'fill';

    return (
      <div className="p-3 bg-zinc-800/50 rounded-lg space-y-3">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">参数设置</h3>

        <SliderRow
          label="大小"
          max={100}
          min={1}
          onChange={(v) => onSettingChange('size', v)}
          unit="px"
          value={settings.size}
        />

        <SliderRow
          label="透明度"
          max={1}
          min={0}
          onChange={(v) => onSettingChange('opacity', v)}
          step={0.01}
          value={settings.opacity}
        />

        {showHardness ? (
          <SliderRow
            label="硬度"
            max={1}
            min={0}
            onChange={(v) => onSettingChange('hardness', v)}
            step={0.01}
            value={settings.hardness}
          />
        ) : null}

        {showDepthValue ? (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">深度值</span>
              <span className="text-zinc-300 font-mono">{settings.depthValue}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
                max={255}
                min={0}
                onChange={(e) => onSettingChange('depthValue', Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #000 0%, #fff 100%)`,
                }}
                type="range"
                value={settings.depthValue}
              />
              <div
                className="w-6 h-6 rounded border border-zinc-600"
                style={{ backgroundColor: `rgb(${settings.depthValue}, ${settings.depthValue}, ${settings.depthValue})` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

DepthEditorSettings.displayName = 'DepthEditorSettings';
