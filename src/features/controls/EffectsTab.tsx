import { Layers, Moon, Palette, Sparkles, Sun } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { SceneConfig } from '@/shared/types';
import { RenderStyle } from '@/shared/types';
import {
  AnimeStyleControls,
  Btn,
  CardBtn,
  CelStyleControls,
  CollapsibleSection,
  CrystalStyleControls,
  HologramStyleControls,
  InkWashStyleControls,
  MatrixStyleControls,
  RecordingSettings,
  RetroPixelStyleControls,
  Slider,
  Toggle,
} from './components';
import { COLOR_GRADES, EXPOSURE_PRESETS, PARTICLE_TYPES, RENDER_STYLES } from './constants';
import {
  BRIGHTNESS,
  CONTRAST,
  EXPOSURE,
  LIGHT_INTENSITY,
  MATERIAL,
  SATURATION,
} from './EffectsTab.constants';

interface EffectsTabProps {
  activeStyle: (typeof RENDER_STYLES)[number] | undefined;
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}

const ColorGradeSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.color}
    icon={<Moon className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('color')}
    title="色彩滤镜"
  >
    <div className="grid grid-cols-3 gap-2">
      {COLOR_GRADES.map((c) => {
        const isActive = config.colorGrade === c.grade;

        return (
          <button
            className={`
              py-3 px-2 text-xs rounded-xl border-2 transition-all duration-200
              flex flex-col items-center gap-2 relative overflow-hidden min-h-[4.5rem]
              ${
                isActive
                  ? `
                    bg-emerald-600
                    border-emerald-400
                    text-white
                    shadow-[0_4px_15px_rgba(16,185,129,0.4)]
                    scale-[1.02]
                  `
                  : `
                    bg-zinc-800
                    border-zinc-700
                    text-zinc-300
                    hover:border-zinc-500
                    hover:text-white
                    hover:bg-zinc-700
                  `
              }
            `}
            key={c.grade}
            onClick={() => set('colorGrade', c.grade)}
          >
            {/* 激活状态顶部光条 */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-white/50 to-emerald-400" />
            )}

            {/* 颜色指示器 */}
            <div
              className={`
                w-6 h-6 rounded-full border-2 transition-all duration-200 flex-shrink-0
                ${isActive ? 'border-white shadow-md' : 'border-zinc-600'}
              `}
              style={{ backgroundColor: c.color }}
            />
            <span className="font-medium leading-tight">{c.label}</span>
          </button>
        );
      })}
    </div>
  </CollapsibleSection>
));

export const EffectsTab: React.FC<EffectsTabProps> = memo(
  ({ config, set, expandedSections, toggleSection, activeStyle }) => (
    <>
      <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            {typeof activeStyle?.icon === 'string' ? (
              <span className="text-lg">{activeStyle.icon}</span>
            ) : (
              <span className="text-blue-400">{activeStyle?.icon}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{activeStyle?.label}风格</div>
            <div className="text-[10px] text-zinc-500">{activeStyle?.desc}</div>
          </div>
          <div className="flex gap-1">
            {config.enableParticles ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-400">
                粒子
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <RenderStyleSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
      <ColorGradeSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
      <LightingSection
        config={config}
        expandedSections={expandedSections}
        set={set}
        toggleSection={toggleSection}
      />
      <EffectsToggleSection config={config} set={set} />
      <MaterialSection config={config} set={set} />
      <RecordingSettings config={config} set={set} />
    </>
  )
);

const EffectsToggleSection = memo<{
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}>(({ config, set }) => (
  <CollapsibleSection icon={<Sparkles className="w-3.5 h-3.5" />} title="特效开关">
    <div className="space-y-1">
      <Toggle
        checked={config.enableParticles}
        label="粒子效果"
        onChange={(v) => set('enableParticles', v)}
      />
      {config.enableParticles ? (
        <div className="ml-4 grid grid-cols-5 gap-1 mt-1 mb-2">
          {PARTICLE_TYPES.map((p) => (
            <Btn
              active={config.particleType === p.type}
              key={p.type}
              onClick={() => set('particleType', p.type)}
              small
            >
              {p.label}
            </Btn>
          ))}
        </div>
      ) : null}
      <Toggle
        checked={config.enableNakedEye3D}
        label="裸眼3D"
        onChange={(v) => set('enableNakedEye3D', v)}
      />
    </div>
  </CollapsibleSection>
));

const LightingSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.lighting}
    icon={<Sun className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('lighting')}
    title="光影调节"
  >
    <Slider
      label="曝光"
      max={EXPOSURE.MAX}
      min={EXPOSURE.MIN}
      onChange={(v) => set('exposure', v)}
      presets={[...EXPOSURE_PRESETS]}
      showPresets
      step={EXPOSURE.STEP}
      value={config.exposure}
    />
    <Slider
      label="亮度"
      max={BRIGHTNESS.MAX}
      min={BRIGHTNESS.MIN}
      onChange={(v) => set('brightness', v)}
      step={BRIGHTNESS.STEP}
      value={config.brightness}
    />
    <Slider
      label="饱和度"
      max={SATURATION.MAX}
      min={SATURATION.MIN}
      onChange={(v) => set('saturation', v)}
      step={SATURATION.STEP}
      value={config.saturation}
    />
    <Slider
      label="对比度"
      max={CONTRAST.MAX}
      min={CONTRAST.MIN}
      onChange={(v) => set('contrast', v)}
      step={CONTRAST.STEP}
      value={config.contrast}
    />
    <div className="h-px bg-zinc-800 my-2" />
    <Slider
      label="光照强度"
      max={LIGHT_INTENSITY.MAX}
      min={LIGHT_INTENSITY.MIN}
      onChange={(v) => set('lightIntensity', v)}
      step={LIGHT_INTENSITY.STEP}
      value={config.lightIntensity}
    />
  </CollapsibleSection>
));

const MaterialSection = memo<{
  config: SceneConfig;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
}>(({ config, set }) => (
  <CollapsibleSection icon={<Layers className="w-3.5 h-3.5" />} title="材质属性">
    <Slider
      label="粗糙度"
      max={MATERIAL.ROUGHNESS_MAX}
      min={MATERIAL.ROUGHNESS_MIN}
      onChange={(v) => set('roughness', v)}
      step={MATERIAL.ROUGHNESS_STEP}
      value={config.roughness}
    />
    <Slider
      label="金属度"
      max={MATERIAL.METALNESS_MAX}
      min={MATERIAL.METALNESS_MIN}
      onChange={(v) => set('metalness', v)}
      step={MATERIAL.METALNESS_STEP}
      value={config.metalness}
    />
    <Toggle checked={config.wireframe} label="线框模式" onChange={(v) => set('wireframe', v)} />
  </CollapsibleSection>
));

const RenderStyleSection = memo<{
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  toggleSection: (key: string) => void;
}>(({ config, set, expandedSections, toggleSection }) => (
  <CollapsibleSection
    expanded={expandedSections.style}
    icon={<Palette className="w-3.5 h-3.5" />}
    onToggle={() => toggleSection('style')}
    title="渲染风格"
  >
    <div className="grid grid-cols-3 gap-2">
      {RENDER_STYLES.map((r) => (
        <CardBtn
          active={config.renderStyle === r.style}
          key={r.style}
          onClick={() => set('renderStyle', r.style)}
        >
          {typeof r.icon === 'string' ? (
            <span className="text-base">{r.icon}</span>
          ) : (
            <span className="text-zinc-400">{r.icon}</span>
          )}
          <span className="font-medium">{r.label}</span>
        </CardBtn>
      ))}
    </div>

    {config.renderStyle === RenderStyle.ANIME ? (
      <AnimeStyleControls config={config} set={set} />
    ) : null}

    {config.renderStyle === RenderStyle.INK_WASH ? (
      <InkWashStyleControls config={config} set={set} />
    ) : null}

    {config.renderStyle === RenderStyle.HOLOGRAM_V2 ? (
      <HologramStyleControls config={config} set={set} />
    ) : null}

    {config.renderStyle === RenderStyle.RETRO_PIXEL ? (
      <RetroPixelStyleControls config={config} set={set} />
    ) : null}

    {config.renderStyle === RenderStyle.CEL_SHADING ? (
      <CelStyleControls config={config} set={set} />
    ) : null}

    {config.renderStyle === RenderStyle.CRYSTAL ? (
      <CrystalStyleControls config={config} set={set} />
    ) : null}

    {config.renderStyle === RenderStyle.MATRIX ? (
      <MatrixStyleControls config={config} set={set} />
    ) : null}
  </CollapsibleSection>
));

export type { EffectsTabProps };

RenderStyleSection.displayName = 'RenderStyleSection';
ColorGradeSection.displayName = 'ColorGradeSection';
LightingSection.displayName = 'LightingSection';
EffectsToggleSection.displayName = 'EffectsToggleSection';
MaterialSection.displayName = 'MaterialSection';
EffectsTab.displayName = 'EffectsTab';
