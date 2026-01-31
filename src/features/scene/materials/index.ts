import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color } from 'three';

import {
  animeFragmentShader,
  animeVertexShader,
  celFragmentShader,
  celVertexShader,
  crystalFragmentShader,
  crystalVertexShader,
  hologramV2FragmentShader,
  hologramV2VertexShader,
  inkWashFragmentShader,
  inkWashVertexShader,
  matrixFragmentShader,
  matrixVertexShader,
  retroPixelFragmentShader,
  retroPixelVertexShader,
} from '@/shared/shaders';

import {
  ANIME_DEFAULTS,
  CEL_DEFAULTS,
  CRYSTAL_DEFAULTS,
  HOLOGRAM_V2_DEFAULTS,
  INK_WASH_DEFAULTS,
  MATRIX_DEFAULTS,
  RETRO_PIXEL_DEFAULTS,
  TEXTURE,
  UNIFORM_DEFAULTS,
} from './materials.constants';

const DEFAULT_TEXEL_SIZE: [number, number] = [
  1 / TEXTURE.DEFAULT_TEXEL_SIZE,
  1 / TEXTURE.DEFAULT_TEXEL_SIZE,
];

export const AnimeMaterialClass = shaderMaterial(
  {
    uTime: 0,
    uMap: null,
    uTexelSize: DEFAULT_TEXEL_SIZE,
    uDisplacementMap: null,
    uDisplacementScale: UNIFORM_DEFAULTS.DISPLACEMENT_SCALE_DEFAULT,
    uDisplacementBias: UNIFORM_DEFAULTS.DISPLACEMENT_BIAS_DEFAULT,
    uShadowSteps: ANIME_DEFAULTS.SHADOW_STEPS,
    uShadowThreshold: ANIME_DEFAULTS.SHADOW_THRESHOLD,
    uHighlightSharpness: ANIME_DEFAULTS.HIGHLIGHT_SHARPNESS,
    uOutlineWidth: ANIME_DEFAULTS.OUTLINE_WIDTH,
    uOutlineColor: new Color(
      ANIME_DEFAULTS.OUTLINE_COLOR_R,
      ANIME_DEFAULTS.OUTLINE_COLOR_G,
      ANIME_DEFAULTS.OUTLINE_COLOR_B
    ),
    uSkinToneBoost: ANIME_DEFAULTS.SKIN_TONE_BOOST,
  },
  animeVertexShader,
  animeFragmentShader
);

export const CelMaterialClass = shaderMaterial(
  {
    uTime: 0,
    uMap: null,
    uTexelSize: DEFAULT_TEXEL_SIZE,
    uDisplacementMap: null,
    uDisplacementScale: UNIFORM_DEFAULTS.DISPLACEMENT_SCALE_DEFAULT,
    uDisplacementBias: UNIFORM_DEFAULTS.DISPLACEMENT_BIAS_DEFAULT,
    uColorBands: CEL_DEFAULTS.COLOR_BANDS,
    uOutlineThickness: CEL_DEFAULTS.OUTLINE_THICKNESS,
    uOutlineColor: new Color(
      CEL_DEFAULTS.OUTLINE_COLOR_R,
      CEL_DEFAULTS.OUTLINE_COLOR_G,
      CEL_DEFAULTS.OUTLINE_COLOR_B
    ),
    uShadowColor: new Color(
      CEL_DEFAULTS.SHADOW_COLOR_R,
      CEL_DEFAULTS.SHADOW_COLOR_G,
      CEL_DEFAULTS.SHADOW_COLOR_B
    ),
    uHalftoneSize: CEL_DEFAULTS.HALFTONE_SIZE,
    uSpecularSize: CEL_DEFAULTS.SPECULAR_SIZE,
  },
  celVertexShader,
  celFragmentShader
);

export const CrystalMaterialClass = shaderMaterial(
  {
    uTime: 0,
    uMap: null,
    uTexelSize: DEFAULT_TEXEL_SIZE,
    uDisplacementMap: null,
    uDisplacementScale: UNIFORM_DEFAULTS.DISPLACEMENT_SCALE_DEFAULT,
    uDisplacementBias: UNIFORM_DEFAULTS.DISPLACEMENT_BIAS_DEFAULT,
    uIOR: CRYSTAL_DEFAULTS.IOR,
    uDispersion: CRYSTAL_DEFAULTS.DISPERSION,
    uFresnelPower: CRYSTAL_DEFAULTS.FRESNEL_POWER,
    uTransmission: CRYSTAL_DEFAULTS.TRANSMISSION,
    uCaustics: CRYSTAL_DEFAULTS.CAUSTICS,
    uCrystalColor: new Color(
      CRYSTAL_DEFAULTS.CRYSTAL_COLOR_R,
      CRYSTAL_DEFAULTS.CRYSTAL_COLOR_G,
      CRYSTAL_DEFAULTS.CRYSTAL_COLOR_B
    ),
  },
  crystalVertexShader,
  crystalFragmentShader
);

export const HologramV2MaterialClass = shaderMaterial(
  {
    uTime: 0,
    uMap: null,
    uTexelSize: DEFAULT_TEXEL_SIZE,
    uDisplacementMap: null,
    uDisplacementScale: UNIFORM_DEFAULTS.DISPLACEMENT_SCALE_DEFAULT,
    uDisplacementBias: UNIFORM_DEFAULTS.DISPLACEMENT_BIAS_DEFAULT,
    uScanlineIntensity: HOLOGRAM_V2_DEFAULTS.SCANLINE_INTENSITY,
    uScanlineDensity: HOLOGRAM_V2_DEFAULTS.SCANLINE_DENSITY,
    uRGBOffset: HOLOGRAM_V2_DEFAULTS.RGB_OFFSET,
    uFlickerSpeed: HOLOGRAM_V2_DEFAULTS.FLICKER_SPEED,
    uGlitchIntensity: HOLOGRAM_V2_DEFAULTS.GLITCH_INTENSITY,
    uFresnelPower: HOLOGRAM_V2_DEFAULTS.FRESNEL_POWER,
    uHoloColor: new Color(
      HOLOGRAM_V2_DEFAULTS.HOLO_COLOR_R,
      HOLOGRAM_V2_DEFAULTS.HOLO_COLOR_G,
      HOLOGRAM_V2_DEFAULTS.HOLO_COLOR_B
    ),
    uDataStreamSpeed: HOLOGRAM_V2_DEFAULTS.DATA_STREAM_SPEED,
  },
  hologramV2VertexShader,
  hologramV2FragmentShader
);

export const InkWashMaterialClass = shaderMaterial(
  {
    uTime: 0,
    uMap: null,
    uTexelSize: DEFAULT_TEXEL_SIZE,
    uDisplacementMap: null,
    uDisplacementScale: UNIFORM_DEFAULTS.DISPLACEMENT_SCALE_DEFAULT,
    uDisplacementBias: UNIFORM_DEFAULTS.DISPLACEMENT_BIAS_DEFAULT,
    uInkDensity: INK_WASH_DEFAULTS.INK_DENSITY,
    uBleedAmount: INK_WASH_DEFAULTS.BLEED_AMOUNT,
    uPaperTexture: INK_WASH_DEFAULTS.PAPER_TEXTURE,
    uBrushTexture: INK_WASH_DEFAULTS.BRUSH_TEXTURE,
    uWhiteSpace: INK_WASH_DEFAULTS.WHITE_SPACE,
    uEdgeWobble: INK_WASH_DEFAULTS.EDGE_WOBBLE,
  },
  inkWashVertexShader,
  inkWashFragmentShader
);

export const MatrixMaterialClass = shaderMaterial(
  {
    uTime: 0,
    uMap: null,
    uTexelSize: DEFAULT_TEXEL_SIZE,
    uDisplacementMap: null,
    uDisplacementScale: UNIFORM_DEFAULTS.DISPLACEMENT_SCALE_DEFAULT,
    uDisplacementBias: UNIFORM_DEFAULTS.DISPLACEMENT_BIAS_DEFAULT,
    uFallSpeed: MATRIX_DEFAULTS.FALL_SPEED,
    uCharDensity: MATRIX_DEFAULTS.CHAR_DENSITY,
    uGlowIntensity: MATRIX_DEFAULTS.GLOW_INTENSITY,
    uTrailLength: MATRIX_DEFAULTS.TRAIL_LENGTH,
    uMatrixColor: new Color(
      MATRIX_DEFAULTS.MATRIX_COLOR_R,
      MATRIX_DEFAULTS.MATRIX_COLOR_G,
      MATRIX_DEFAULTS.MATRIX_COLOR_B
    ),
    uCharSize: MATRIX_DEFAULTS.CHAR_SIZE,
    uShowOriginal: MATRIX_DEFAULTS.SHOW_ORIGINAL,
  },
  matrixVertexShader,
  matrixFragmentShader
);

export const RetroPixelMaterialClass = shaderMaterial(
  {
    uTime: 0,
    uMap: null,
    uTexelSize: DEFAULT_TEXEL_SIZE,
    uDisplacementMap: null,
    uDisplacementScale: UNIFORM_DEFAULTS.DISPLACEMENT_SCALE_DEFAULT,
    uDisplacementBias: UNIFORM_DEFAULTS.DISPLACEMENT_BIAS_DEFAULT,
    uPixelSize: RETRO_PIXEL_DEFAULTS.PIXEL_SIZE,
    uPaletteMode: RETRO_PIXEL_DEFAULTS.PALETTE_MODE,
    uDitherStrength: RETRO_PIXEL_DEFAULTS.DITHER_STRENGTH,
    uCRTEffect: RETRO_PIXEL_DEFAULTS.CRT_EFFECT,
    uColorDepth: RETRO_PIXEL_DEFAULTS.COLOR_DEPTH,
    uScanlineBrightness: RETRO_PIXEL_DEFAULTS.SCANLINE_BRIGHTNESS,
  },
  retroPixelVertexShader,
  retroPixelFragmentShader
);

extend({
  AnimeMaterial: AnimeMaterialClass,
  CelMaterial: CelMaterialClass,
  CrystalMaterial: CrystalMaterialClass,
  HologramV2Material: HologramV2MaterialClass,
  InkWashMaterial: InkWashMaterialClass,
  MatrixMaterial: MatrixMaterialClass,
  RetroPixelMaterial: RetroPixelMaterialClass,
});
