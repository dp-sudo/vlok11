import { memo } from 'react';
import type { SceneConfig } from '@/shared/types';
import {
  ANIME,
  CEL,
  CRYSTAL,
  HOLOGRAM_V2,
  INK_WASH,
  MATRIX,
  PALETTE_MODES,
  RETRO_PIXEL,
} from '../EffectsTab.constants';
import { Btn, Slider } from './index';

type SetConfig = <K extends keyof SceneConfig>(k: K, v: SceneConfig[K]) => void;

export const AnimeStyleControls = memo<{ config: SceneConfig; set: SetConfig }>(
  ({ config, set }) => (
    <div className="mt-3 p-2 rounded-lg bg-pink-500/5 border border-pink-500/20 space-y-2">
      <div className="text-[10px] text-pink-300 font-medium mb-2">动漫参数</div>
      <Slider
        label="阴影色阶"
        max={ANIME.SHADOW_STEPS_MAX}
        min={ANIME.SHADOW_STEPS_MIN}
        onChange={(v) => set('animeShadowSteps', v)}
        step={ANIME.SHADOW_STEPS_STEP}
        value={config.animeShadowSteps ?? ANIME.DEFAULT_SHADOW_STEPS}
      />
      <Slider
        label="阴影阈值"
        max={ANIME.SHADOW_THRESHOLD_MAX}
        min={ANIME.SHADOW_THRESHOLD_MIN}
        onChange={(v) => set('animeShadowThreshold', v)}
        step={ANIME.SHADOW_THRESHOLD_STEP}
        value={config.animeShadowThreshold ?? ANIME.DEFAULT_SHADOW_THRESHOLD}
      />
      <Slider
        label="高光锐度"
        max={ANIME.HIGHLIGHT_SHARPNESS_MAX}
        min={ANIME.HIGHLIGHT_SHARPNESS_MIN}
        onChange={(v) => set('animeHighlightSharpness', v)}
        step={ANIME.HIGHLIGHT_SHARPNESS_STEP}
        value={config.animeHighlightSharpness ?? ANIME.DEFAULT_HIGHLIGHT_SHARPNESS}
      />
      <Slider
        label="轮廓线宽"
        max={ANIME.OUTLINE_WIDTH_MAX}
        min={ANIME.OUTLINE_WIDTH_MIN}
        onChange={(v) => set('animeOutlineWidth', v)}
        step={ANIME.OUTLINE_WIDTH_STEP}
        value={config.animeOutlineWidth ?? ANIME.DEFAULT_OUTLINE_WIDTH}
      />
      <Slider
        label="肤色增强"
        max={ANIME.SKIN_TONE_BOOST_MAX}
        min={ANIME.SKIN_TONE_BOOST_MIN}
        onChange={(v) => set('animeSkinToneBoost', v)}
        step={ANIME.SKIN_TONE_BOOST_STEP}
        value={config.animeSkinToneBoost ?? ANIME.DEFAULT_SKIN_TONE_BOOST}
      />
    </div>
  )
);

export const InkWashStyleControls = memo<{ config: SceneConfig; set: SetConfig }>(
  ({ config, set }) => (
    <div className="mt-3 p-2 rounded-lg bg-stone-500/5 border border-stone-500/20 space-y-2">
      <div className="text-[10px] text-stone-300 font-medium mb-2">水墨参数</div>
      <Slider
        label="墨色浓度"
        max={INK_WASH.INK_DENSITY_MAX}
        min={INK_WASH.INK_DENSITY_MIN}
        onChange={(v) => set('inkWashInkDensity', v)}
        step={INK_WASH.INK_DENSITY_STEP}
        value={config.inkWashInkDensity ?? INK_WASH.DEFAULT_INK_DENSITY}
      />
      <Slider
        label="晕染程度"
        max={INK_WASH.BLEED_AMOUNT_MAX}
        min={INK_WASH.BLEED_AMOUNT_MIN}
        onChange={(v) => set('inkWashBleedAmount', v)}
        step={INK_WASH.BLEED_AMOUNT_STEP}
        value={config.inkWashBleedAmount ?? INK_WASH.DEFAULT_BLEED_AMOUNT}
      />
      <Slider
        label="宣纸纹理"
        max={INK_WASH.PAPER_TEXTURE_MAX}
        min={INK_WASH.PAPER_TEXTURE_MIN}
        onChange={(v) => set('inkWashPaperTexture', v)}
        step={INK_WASH.PAPER_TEXTURE_STEP}
        value={config.inkWashPaperTexture ?? INK_WASH.DEFAULT_PAPER_TEXTURE}
      />
      <Slider
        label="笔触强度"
        max={INK_WASH.BRUSH_TEXTURE_MAX}
        min={INK_WASH.BRUSH_TEXTURE_MIN}
        onChange={(v) => set('inkWashBrushTexture', v)}
        step={INK_WASH.BRUSH_TEXTURE_STEP}
        value={config.inkWashBrushTexture ?? INK_WASH.DEFAULT_BRUSH_TEXTURE}
      />
      <Slider
        label="留白程度"
        max={INK_WASH.WHITE_SPACE_MAX}
        min={INK_WASH.WHITE_SPACE_MIN}
        onChange={(v) => set('inkWashWhiteSpace', v)}
        step={INK_WASH.WHITE_SPACE_STEP}
        value={config.inkWashWhiteSpace ?? INK_WASH.DEFAULT_WHITE_SPACE}
      />
      <Slider
        label="边缘扰动"
        max={INK_WASH.EDGE_WOBBLE_MAX}
        min={INK_WASH.EDGE_WOBBLE_MIN}
        onChange={(v) => set('inkWashEdgeWobble', v)}
        step={INK_WASH.EDGE_WOBBLE_STEP}
        value={config.inkWashEdgeWobble ?? INK_WASH.DEFAULT_EDGE_WOBBLE}
      />
    </div>
  )
);

export const HologramStyleControls = memo<{ config: SceneConfig; set: SetConfig }>(
  ({ config, set }) => (
    <div className="mt-3 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 space-y-2">
      <div className="text-[10px] text-cyan-300 font-medium mb-2">全息参数</div>
      <Slider
        label="扫描线强度"
        max={HOLOGRAM_V2.SCANLINE_INTENSITY_MAX}
        min={HOLOGRAM_V2.SCANLINE_INTENSITY_MIN}
        onChange={(v) => set('hologramV2ScanlineIntensity', v)}
        step={HOLOGRAM_V2.SCANLINE_INTENSITY_STEP}
        value={config.hologramV2ScanlineIntensity ?? HOLOGRAM_V2.DEFAULT_SCANLINE_INTENSITY}
      />
      <Slider
        label="扫描线密度"
        max={HOLOGRAM_V2.SCANLINE_DENSITY_MAX}
        min={HOLOGRAM_V2.SCANLINE_DENSITY_MIN}
        onChange={(v) => set('hologramV2ScanlineDensity', v)}
        step={HOLOGRAM_V2.SCANLINE_DENSITY_STEP}
        value={config.hologramV2ScanlineDensity ?? HOLOGRAM_V2.DEFAULT_SCANLINE_DENSITY}
      />
      <Slider
        label="RGB偏移"
        max={HOLOGRAM_V2.RGB_OFFSET_MAX}
        min={HOLOGRAM_V2.RGB_OFFSET_MIN}
        onChange={(v) => set('hologramV2RGBOffset', v)}
        step={HOLOGRAM_V2.RGB_OFFSET_STEP}
        value={config.hologramV2RGBOffset ?? HOLOGRAM_V2.DEFAULT_RGB_OFFSET}
      />
      <Slider
        label="闪烁速度"
        max={HOLOGRAM_V2.FLICKER_SPEED_MAX}
        min={HOLOGRAM_V2.FLICKER_SPEED_MIN}
        onChange={(v) => set('hologramV2FlickerSpeed', v)}
        step={HOLOGRAM_V2.FLICKER_SPEED_STEP}
        value={config.hologramV2FlickerSpeed ?? HOLOGRAM_V2.DEFAULT_FLICKER_SPEED}
      />
      <Slider
        label="故障强度"
        max={HOLOGRAM_V2.GLITCH_INTENSITY_MAX}
        min={HOLOGRAM_V2.GLITCH_INTENSITY_MIN}
        onChange={(v) => set('hologramV2GlitchIntensity', v)}
        step={HOLOGRAM_V2.GLITCH_INTENSITY_STEP}
        value={config.hologramV2GlitchIntensity ?? HOLOGRAM_V2.DEFAULT_GLITCH_INTENSITY}
      />
      <Slider
        label="边缘发光"
        max={HOLOGRAM_V2.FRESNEL_POWER_MAX}
        min={HOLOGRAM_V2.FRESNEL_POWER_MIN}
        onChange={(v) => set('hologramV2FresnelPower', v)}
        step={HOLOGRAM_V2.FRESNEL_POWER_STEP}
        value={config.hologramV2FresnelPower ?? HOLOGRAM_V2.DEFAULT_FRESNEL_POWER}
      />
      <Slider
        label="数据流速度"
        max={HOLOGRAM_V2.DATA_STREAM_SPEED_MAX}
        min={HOLOGRAM_V2.DATA_STREAM_SPEED_MIN}
        onChange={(v) => set('hologramV2DataStreamSpeed', v)}
        step={HOLOGRAM_V2.DATA_STREAM_SPEED_STEP}
        value={config.hologramV2DataStreamSpeed ?? HOLOGRAM_V2.DEFAULT_DATA_STREAM_SPEED}
      />
    </div>
  )
);

export const RetroPixelStyleControls = memo<{ config: SceneConfig; set: SetConfig }>(
  ({ config, set }) => (
    <div className="mt-3 p-2 rounded-lg bg-green-500/5 border border-green-500/20 space-y-2">
      <div className="text-[10px] text-green-300 font-medium mb-2">像素参数</div>
      <Slider
        label="像素大小"
        max={RETRO_PIXEL.PIXEL_SIZE_MAX}
        min={RETRO_PIXEL.PIXEL_SIZE_MIN}
        onChange={(v) => set('retroPixelSize', v)}
        step={RETRO_PIXEL.PIXEL_SIZE_STEP}
        value={config.retroPixelSize ?? RETRO_PIXEL.DEFAULT_PIXEL_SIZE}
      />
      <div className="text-[9px] text-green-500/60 mb-1">调色板模式</div>
      <div className="grid grid-cols-4 gap-1">
        {PALETTE_MODES.map((p) => (
          <Btn
            active={(config.retroPaletteMode ?? RETRO_PIXEL.DEFAULT_PALETTE_MODE) === p.mode}
            key={p.mode}
            onClick={() => set('retroPaletteMode', p.mode)}
            small
          >
            {p.label}
          </Btn>
        ))}
      </div>
      <Slider
        label="抖动强度"
        max={RETRO_PIXEL.DITHER_STRENGTH_MAX}
        min={RETRO_PIXEL.DITHER_STRENGTH_MIN}
        onChange={(v) => set('retroDitherStrength', v)}
        step={RETRO_PIXEL.DITHER_STRENGTH_STEP}
        value={config.retroDitherStrength ?? RETRO_PIXEL.DEFAULT_DITHER_STRENGTH}
      />
      <Slider
        label="CRT效果"
        max={RETRO_PIXEL.CRT_EFFECT_MAX}
        min={RETRO_PIXEL.CRT_EFFECT_MIN}
        onChange={(v) => set('retroCRTEffect', v)}
        step={RETRO_PIXEL.CRT_EFFECT_STEP}
        value={config.retroCRTEffect ?? RETRO_PIXEL.DEFAULT_CRT_EFFECT}
      />
      <Slider
        label="颜色深度"
        max={RETRO_PIXEL.COLOR_DEPTH_MAX}
        min={RETRO_PIXEL.COLOR_DEPTH_MIN}
        onChange={(v) => set('retroColorDepth', v)}
        step={RETRO_PIXEL.COLOR_DEPTH_STEP}
        value={config.retroColorDepth ?? RETRO_PIXEL.DEFAULT_COLOR_DEPTH}
      />
    </div>
  )
);

export const CelStyleControls = memo<{ config: SceneConfig; set: SetConfig }>(({ config, set }) => (
  <div className="mt-3 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20 space-y-2">
    <div className="text-[10px] text-orange-300 font-medium mb-2">卡通参数</div>
    <Slider
      label="色阶层数"
      max={CEL.COLOR_BANDS_MAX}
      min={CEL.COLOR_BANDS_MIN}
      onChange={(v) => set('celColorBands', v)}
      step={CEL.COLOR_BANDS_STEP}
      value={config.celColorBands ?? CEL.DEFAULT_COLOR_BANDS}
    />
    <Slider
      label="描边粗细"
      max={CEL.OUTLINE_THICKNESS_MAX}
      min={CEL.OUTLINE_THICKNESS_MIN}
      onChange={(v) => set('celOutlineThickness', v)}
      step={CEL.OUTLINE_THICKNESS_STEP}
      value={config.celOutlineThickness ?? CEL.DEFAULT_OUTLINE_THICKNESS}
    />
    <Slider
      label="网点大小"
      max={CEL.HALFTONE_SIZE_MAX}
      min={CEL.HALFTONE_SIZE_MIN}
      onChange={(v) => set('celHalftoneSize', v)}
      step={CEL.HALFTONE_SIZE_STEP}
      value={config.celHalftoneSize ?? CEL.DEFAULT_HALFTONE_SIZE}
    />
    <Slider
      label="高光范围"
      max={CEL.SPECULAR_SIZE_MAX}
      min={CEL.SPECULAR_SIZE_MIN}
      onChange={(v) => set('celSpecularSize', v)}
      step={CEL.SPECULAR_SIZE_STEP}
      value={config.celSpecularSize ?? CEL.DEFAULT_SPECULAR_SIZE}
    />
  </div>
));

export const CrystalStyleControls = memo<{ config: SceneConfig; set: SetConfig }>(
  ({ config, set }) => (
    <div className="mt-3 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
      <div className="text-[10px] text-blue-300 font-medium mb-2">水晶参数</div>
      <Slider
        label="折射率"
        max={CRYSTAL.IOR_MAX}
        min={CRYSTAL.IOR_MIN}
        onChange={(v) => set('crystalIOR', v)}
        step={CRYSTAL.IOR_STEP}
        value={config.crystalIOR ?? CRYSTAL.DEFAULT_IOR}
      />
      <Slider
        label="色散强度"
        max={CRYSTAL.DISPERSION_MAX}
        min={CRYSTAL.DISPERSION_MIN}
        onChange={(v) => set('crystalDispersion', v)}
        step={CRYSTAL.DISPERSION_STEP}
        value={config.crystalDispersion ?? CRYSTAL.DEFAULT_DISPERSION}
      />
      <Slider
        label="菲涅尔强度"
        max={CRYSTAL.FRESNEL_POWER_MAX}
        min={CRYSTAL.FRESNEL_POWER_MIN}
        onChange={(v) => set('crystalFresnelPower', v)}
        step={CRYSTAL.FRESNEL_POWER_STEP}
        value={config.crystalFresnelPower ?? CRYSTAL.DEFAULT_FRESNEL_POWER}
      />
      <Slider
        label="透明度"
        max={CRYSTAL.TRANSMISSION_MAX}
        min={CRYSTAL.TRANSMISSION_MIN}
        onChange={(v) => set('crystalTransmission', v)}
        step={CRYSTAL.TRANSMISSION_STEP}
        value={config.crystalTransmission ?? CRYSTAL.DEFAULT_TRANSMISSION}
      />
      <Slider
        label="焦散强度"
        max={CRYSTAL.CAUSTICS_MAX}
        min={CRYSTAL.CAUSTICS_MIN}
        onChange={(v) => set('crystalCaustics', v)}
        step={CRYSTAL.CAUSTICS_STEP}
        value={config.crystalCaustics ?? CRYSTAL.DEFAULT_CAUSTICS}
      />
    </div>
  )
);

export const MatrixStyleControls = memo<{ config: SceneConfig; set: SetConfig }>(
  ({ config, set }) => (
    <div className="mt-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
      <div className="text-[10px] text-emerald-300 font-medium mb-2">赛博参数</div>
      <Slider
        label="下落速度"
        max={MATRIX.FALL_SPEED_MAX}
        min={MATRIX.FALL_SPEED_MIN}
        onChange={(v) => set('matrixFallSpeed', v)}
        step={MATRIX.FALL_SPEED_STEP}
        value={config.matrixFallSpeed ?? MATRIX.DEFAULT_FALL_SPEED}
      />
      <Slider
        label="字符密度"
        max={MATRIX.CHAR_DENSITY_MAX}
        min={MATRIX.CHAR_DENSITY_MIN}
        onChange={(v) => set('matrixCharDensity', v)}
        step={MATRIX.CHAR_DENSITY_STEP}
        value={config.matrixCharDensity ?? MATRIX.DEFAULT_CHAR_DENSITY}
      />
      <Slider
        label="发光强度"
        max={MATRIX.GLOW_INTENSITY_MAX}
        min={MATRIX.GLOW_INTENSITY_MIN}
        onChange={(v) => set('matrixGlowIntensity', v)}
        step={MATRIX.GLOW_INTENSITY_STEP}
        value={config.matrixGlowIntensity ?? MATRIX.DEFAULT_GLOW_INTENSITY}
      />
      <Slider
        label="拖尾长度"
        max={MATRIX.TRAIL_LENGTH_MAX}
        min={MATRIX.TRAIL_LENGTH_MIN}
        onChange={(v) => set('matrixTrailLength', v)}
        step={MATRIX.TRAIL_LENGTH_STEP}
        value={config.matrixTrailLength ?? MATRIX.DEFAULT_TRAIL_LENGTH}
      />
      <Slider
        label="字符大小"
        max={MATRIX.CHAR_SIZE_MAX}
        min={MATRIX.CHAR_SIZE_MIN}
        onChange={(v) => set('matrixCharSize', v)}
        step={MATRIX.CHAR_SIZE_STEP}
        value={config.matrixCharSize ?? MATRIX.DEFAULT_CHAR_SIZE}
      />
      <Slider
        label="原图显示"
        max={MATRIX.SHOW_ORIGINAL_MAX}
        min={MATRIX.SHOW_ORIGINAL_MIN}
        onChange={(v) => set('matrixShowOriginal', v)}
        step={MATRIX.SHOW_ORIGINAL_STEP}
        value={config.matrixShowOriginal ?? MATRIX.DEFAULT_SHOW_ORIGINAL}
      />
    </div>
  )
);

AnimeStyleControls.displayName = 'AnimeStyleControls';
InkWashStyleControls.displayName = 'InkWashStyleControls';
HologramStyleControls.displayName = 'HologramStyleControls';
RetroPixelStyleControls.displayName = 'RetroPixelStyleControls';
CelStyleControls.displayName = 'CelStyleControls';
CrystalStyleControls.displayName = 'CrystalStyleControls';
MatrixStyleControls.displayName = 'MatrixStyleControls';
