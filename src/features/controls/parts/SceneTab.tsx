import { Info, Layers, Maximize2, Sliders, Sun } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { SceneConfig } from '@/shared/types';
import { Btn, CardBtn, CollapsibleSection, Slider, Toggle } from '../components';
import { DEPTH_PRESETS, MIRROR_MODES, PROJECTIONS } from '../constants';

interface SceneTabProps {
  activeProjection: (typeof PROJECTIONS)[number] | undefined;
  config: SceneConfig;
  expandedSections: Record<string, boolean>;
  hoveredItem: string | null;
  set: <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;
  setHoveredItem: (item: string | null) => void;
  toggleSection: (key: string) => void;
}

export const SceneTab: React.FC<SceneTabProps> = memo(
  ({
    config,
    set,
    expandedSections,
    toggleSection,
    hoveredItem,
    setHoveredItem,
    activeProjection,
  }) => (
    <>
      <div className="mb-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 text-xl shadow-sm">
            {activeProjection?.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-bold text-slate-800 tracking-wide">
              {activeProjection?.label}投影
            </div>
            <div className="text-[13px] text-slate-500 mt-1">{activeProjection?.desc}</div>
          </div>
          <div className="text-right flex-shrink-0 bg-slate-50 px-3 py-2 rounded-lg">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
              深度
            </div>
            <div className="text-xl font-mono font-bold text-violet-600">
              {config.displacementScale.toFixed(1)}x
            </div>
          </div>
        </div>
      </div>

      <CollapsibleSection
        expanded={expandedSections.projection}
        icon={<Layers className="w-3.5 h-3.5" />}
        onToggle={() => toggleSection('projection')}
        title="投影模式"
      >
        <div className="grid grid-cols-3 gap-1.5">
          {PROJECTIONS.map((p) => (
            <CardBtn
              active={config.projectionMode === p.mode}
              key={p.mode}
              onClick={() => set('projectionMode', p.mode)}
              onMouseEnter={() => setHoveredItem(p.mode)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span className="text-base mb-0.5">{p.icon}</span>
              <span>{p.label}</span>
            </CardBtn>
          ))}
        </div>
        {hoveredItem && PROJECTIONS.find((p) => p.mode === hoveredItem) ? (
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-slate-100 text-[10px] text-slate-600 flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            {PROJECTIONS.find((p) => p.mode === hoveredItem)?.desc}
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        expanded={expandedSections.depth}
        icon={<Sliders className="w-3.5 h-3.5" />}
        onToggle={() => toggleSection('depth')}
        title="深度控制"
      >
        <Slider
          label="深度强度"
          max={8}
          min={0}
          onChange={(v) => set('displacementScale', v)}
          presets={DEPTH_PRESETS as unknown as number[]}
          showPresets
          step={0.1}
          value={config.displacementScale}
        />
        <Slider
          label="网格密度"
          max={512}
          min={64}
          onChange={(v) => set('meshDensity', v)}
          step={32}
          value={config.meshDensity}
        />
        <Toggle
          checked={config.depthInvert}
          label="深度反转"
          onChange={(v) => set('depthInvert', v)}
        />
        <Slider
          label="边缘淡化"
          max={1}
          min={0}
          onChange={(v) => set('edgeFade', v)}
          step={0.05}
          value={config.edgeFade}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={<Maximize2 className="w-3.5 h-3.5" />} title="镜像模式">
        <div className="grid grid-cols-4 gap-1.5">
          {MIRROR_MODES.map((m) => (
            <Btn
              active={config.mirrorMode === m.mode}
              key={m.mode}
              onClick={() => set('mirrorMode', m.mode)}
            >
              {m.label}
            </Btn>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<Sun className="w-3.5 h-3.5" />} title="环境设置">
        <div className="space-y-1">
          <Toggle checked={config.showGrid} label="显示网格" onChange={(v) => set('showGrid', v)} />
          <Toggle
            checked={config.showAxes}
            label="显示坐标轴"
            onChange={(v) => set('showAxes', v)}
          />
          <Toggle
            checked={config.enableFaceTracking}
            label="人脸追踪"
            onChange={(v) => set('enableFaceTracking', v)}
          />
        </div>
      </CollapsibleSection>
    </>
  )
);

SceneTab.displayName = 'SceneTab';

export type { SceneTabProps };
