import { Brain, CloudSun, Headphones, Palette as PaletteIcon, Video } from 'lucide-react';
import React, { memo } from 'react';

import {
  Btn,
  CardBtn,
  CollapsibleSection,
  Slider,
  Toggle,
} from './components';
import {
  AI_MOTION_STYLES,
  AUDIO_MOODS,
  EMOTIONAL_TONES,
  WEATHER_EFFECTS,
} from './constants';

import type { SceneConfig } from '@/shared/types';

interface ImmersiveTabProps {
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}

// 自动场景分析部分
const AutoAnalysisSection = memo<{
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}>(({ config, set }) => (
  <CollapsibleSection icon={<Video className="w-3.5 h-3.5" />} title="智能场景分析">
    <div className="space-y-2">
      <Toggle
        checked={config.autoSceneAnalysis}
        label="自动场景分析"
        onChange={(v) => set('autoSceneAnalysis', v)}
      />
      <p className="text-[10px] text-zinc-500">
        开启后自动分析图片内容并推荐最佳沉浸体验配置
      </p>
    </div>
  </CollapsibleSection>
));

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

// 沉浸音效部分
const AudioSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.immersiveAudio}
    icon={<Headphones className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('immersiveAudio')}
    title="沉浸音效"
  >
    <div className="space-y-2 mb-3">
      <Toggle
        checked={config.immersiveAudioEnabled}
        label="启用沉浸音效"
        onChange={(v) => set('immersiveAudioEnabled', v)}
      />
    </div>
    {config.immersiveAudioEnabled ? (
      <>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {AUDIO_MOODS.map((a) => (
            <Btn
              active={config.audioMood === a.mood}
              key={a.mood}
              onClick={() => set('audioMood', a.mood)}
              small
            >
              <span className="mr-1">{a.icon}</span>
              {a.label}
            </Btn>
          ))}
        </div>
        <Slider
          label="音量"
          max={1}
          min={0}
          onChange={(v) => set('audioVolume', v)}
          step={0.01}
          value={config.audioVolume}
        />
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

// 情感色调部分
const ToneSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.emotionalTone}
    icon={<PaletteIcon className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('emotionalTone')}
    title="情感色调"
  >
    <div className="space-y-2 mb-3">
      <Toggle
        checked={config.emotionalToneEnabled}
        label="启用情感色调"
        onChange={(v) => set('emotionalToneEnabled', v)}
      />
    </div>
    {config.emotionalToneEnabled ? (
      <>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {EMOTIONAL_TONES.map((t) => (
            <button
              className={`py-2 px-2 text-[11px] rounded-lg border transition-all flex flex-col items-center gap-1 ${
                config.emotionalTone === t.tone
                  ? 'bg-zinc-800 border-zinc-600 text-white ring-1 ring-zinc-500'
                  : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
              key={t.tone}
              onClick={() => set('emotionalTone', t.tone)}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <Slider
          label="强度"
          max={1}
          min={0.1}
          onChange={(v) => set('toneIntensity', v)}
          step={0.05}
          value={config.toneIntensity}
        />
      </>
    ) : null}
  </CollapsibleSection>
));

export const ImmersiveTab: React.FC<ImmersiveTabProps> = memo(
  ({ config, set, expandedSections, toggleSection }) => (
    <>
      <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-blue-900/40 to-purple-900/30 border border-blue-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">AI智能沉浸体验</div>
            <div className="text-[10px] text-zinc-500">
              智能运镜 + 沉浸音效 + 天气氛围 + 情感色调
            </div>
          </div>
        </div>
      </div>

      <AutoAnalysisSection config={config} set={set} />
      <AIMotionSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
      <AudioSection
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
      <ToneSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
    </>
  )
);

export type { ImmersiveTabProps };

AutoAnalysisSection.displayName = 'AutoAnalysisSection';
AIMotionSection.displayName = 'AIMotionSection';
AudioSection.displayName = 'AudioSection';
WeatherSection.displayName = 'WeatherSection';
ToneSection.displayName = 'ToneSection';
ImmersiveTab.displayName = 'ImmersiveTab';
