import { Brain, CloudSun } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { SceneConfig } from '@/shared/types';
import { Btn, CardBtn, CollapsibleSection, Slider, Toggle } from './components';
import { AI_MOTION_STYLES, WEATHER_EFFECTS } from './constants';

interface ImmersiveTabProps {
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}

// AI智能运镜部分
const AIMotionSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.aiMotion}
    icon={<Brain className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('aiMotion')}
    title="AI智能运镜"
  >
    <div className="space-y-2 mb-3">
      <Toggle
        checked={config.aiMotionEnabled}
        label="启用智能运镜"
        onChange={(v) => set('aiMotionEnabled', v)}
      />
    </div>
    {config.aiMotionEnabled ? (
      <>
        <div className="space-y-2 mb-2">
          <Toggle
            checked={config.autoResumeMotion !== false}
            label="交互后自动恢复"
            onChange={(v) => set('autoResumeMotion', v)}
            description="用户操作后自动恢复AI运镜"
          />
        </div>
        <Slider
          label="恢复延迟"
          max={3000}
          min={0}
          onChange={(v) => set('motionResumeDelayMs', v)}
          step={100}
          value={config.motionResumeDelayMs}
        />
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          {AI_MOTION_STYLES.map((m) => (
            <CardBtn
              active={config.aiMotionStyle === m.style}
              key={m.style}
              onClick={() => set('aiMotionStyle', m.style)}
            >
              <span className="text-sm mb-0.5">{m.icon}</span>
              <span>{m.label}</span>
            </CardBtn>
          ))}
        </div>
      </>
    ) : null}
  </CollapsibleSection>
));

// 天气氛围部分
const WeatherSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.weather}
    icon={<CloudSun className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('weather')}
    title="天气氛围"
  >
    <div className="space-y-2 mb-3">
      <Toggle
        checked={config.weatherEnabled}
        label="启用天气效果"
        onChange={(v) => set('weatherEnabled', v)}
      />
    </div>
    {config.weatherEnabled ? (
      <>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {WEATHER_EFFECTS.map((w) => (
            <Btn
              active={config.weatherEffect === w.effect}
              key={w.effect}
              onClick={() => set('weatherEffect', w.effect)}
              small
            >
              <span className="mr-1">{w.icon}</span>
              {w.label}
            </Btn>
          ))}
        </div>
        <Slider
          label="强度"
          max={1}
          min={0.1}
          onChange={(v) => set('weatherIntensity', v)}
          step={0.05}
          value={config.weatherIntensity}
        />
      </>
    ) : null}
  </CollapsibleSection>
));

export const ImmersiveTab: React.FC<ImmersiveTabProps> = memo(
  ({ config, set, expandedSections, toggleSection }) => (
    <>
      <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-200 tracking-wide">AI智能沉浸体验</div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">智能运镜 + 天气氛围</div>
          </div>
        </div>
      </div>

      <AIMotionSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
      <WeatherSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
    </>
  )
);

export type { ImmersiveTabProps };

AIMotionSection.displayName = 'AIMotionSection';
WeatherSection.displayName = 'WeatherSection';
ImmersiveTab.displayName = 'ImmersiveTab';
