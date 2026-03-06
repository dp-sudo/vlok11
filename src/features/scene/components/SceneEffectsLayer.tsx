import { memo } from 'react';
import { VIGNETTE } from '@/shared/constants/image';
import type { RenderStyle } from '@/shared/types';

interface SceneEffectsLayerProps {
  enableVignette: boolean;
  renderStyle: RenderStyle;
  vignetteStrength: number;
  config?: {
    enableVignette?: boolean;
    renderStyle?: RenderStyle;
    vignetteStrength?: number;
  };
}

export const SceneEffectsLayer = memo((props: SceneEffectsLayerProps) => {
  const { enableVignette, renderStyle, vignetteStrength, config } = props;
  const effectiveVignette = config?.enableVignette ?? enableVignette;
  const effectiveStyle = config?.renderStyle ?? renderStyle;
  const effectiveStrength = config?.vignetteStrength ?? vignetteStrength;

  return (
    <>
      {effectiveVignette && (
        <div
          className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: `radial-gradient(circle closest-side at center, transparent 55%, rgba(0,0,0,${Math.max(0, Math.min(1, VIGNETTE.BASE_OPACITY + effectiveStrength * VIGNETTE.STRENGTH_MULTIPLIER))}) 100%)`,
          }}
        />
      )}

      {effectiveStyle === 'HOLOGRAM_V2' && (
        <div className="absolute top-4 right-4 z-10 text-cyan-400 text-xs font-mono animate-pulse border border-cyan-500/50 px-2 py-1 rounded bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
          HOLOGRAM V2 ACTIVE
        </div>
      )}
    </>
  );
});

SceneEffectsLayer.displayName = 'SceneEffectsLayer';
