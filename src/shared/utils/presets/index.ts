import {
  ANIME_DEFAULTS,
  CEL_DEFAULTS,
  CRYSTAL_DEFAULTS,
  HOLOGRAM_V2_DEFAULTS,
  INK_WASH_DEFAULTS,
  MATRIX_DEFAULTS,
  RETRO_PIXEL_DEFAULTS,
} from '@/features/scene/materials/materials.constants';

export interface AnimePreset {
  description: string;
  highlightSharpness: number;
  icon: string;
  id: string;
  label: string;
  outlineWidth: number;
  shadowSteps: number;
  shadowThreshold: number;
  skinToneBoost: number;
}

export interface CelPreset {
  colorBands: number;
  description: string;
  halftoneSize: number;
  icon: string;
  id: string;
  label: string;
  outlineThickness: number;
  specularSize: number;
}

export interface CrystalPreset {
  caustics: number;
  description: string;
  dispersion: number;
  fresnelPower: number;
  icon: string;
  id: string;
  ior: number;
  label: string;
  transmission: number;
}

export interface HologramV2Preset {
  dataStreamSpeed: number;
  description: string;
  flickerSpeed: number;
  fresnelPower: number;
  glitchIntensity: number;
  icon: string;
  id: string;
  label: string;
  rgbOffset: number;
  scanlineDensity: number;
  scanlineIntensity: number;
}

export interface InkWashPreset {
  bleedAmount: number;
  brushTexture: number;
  description: string;
  edgeWobble: number;
  icon: string;
  id: string;
  inkDensity: number;
  label: string;
  paperTexture: number;
  whiteSpace: number;
}

export interface MatrixPreset {
  charDensity: number;
  charSize: number;
  description: string;
  fallSpeed: number;
  glowIntensity: number;
  icon: string;
  id: string;
  label: string;
  showOriginal: number;
  trailLength: number;
}

export interface RetroPixelPreset {
  colorDepth: number;
  crtEffect: number;
  description: string;
  ditherStrength: number;
  icon: string;
  id: string;
  label: string;
  paletteMode: number;
  pixelSize: number;
}

export const ANIME_PRESETS: AnimePreset[] = [
  {
    id: 'genshin',
    label: '原神风',
    description: '柔和阴影，高光锐利',
    icon: '⚔️',
    shadowSteps: ANIME_DEFAULTS.SHADOW_STEPS,
    shadowThreshold: ANIME_DEFAULTS.SHADOW_THRESHOLD,
    highlightSharpness: ANIME_DEFAULTS.HIGHLIGHT_SHARPNESS,
    outlineWidth: ANIME_DEFAULTS.OUTLINE_WIDTH,
    skinToneBoost: ANIME_DEFAULTS.SKIN_TONE_BOOST,
  },
  {
    id: 'classic',
    label: '经典动漫',
    description: '传统赛璐璐风格',
    icon: '🎌',
    shadowSteps: 2,
    shadowThreshold: 0.6,
    highlightSharpness: 0.9,
    outlineWidth: 2.0,
    skinToneBoost: 0.2,
  },
];

export const CEL_PRESETS: CelPreset[] = [
  {
    id: 'comic',
    label: '美漫',
    description: '美式漫画风格',
    icon: '💥',
    colorBands: CEL_DEFAULTS.COLOR_BANDS,
    outlineThickness: CEL_DEFAULTS.OUTLINE_THICKNESS,
    halftoneSize: 5.0,
    specularSize: CEL_DEFAULTS.SPECULAR_SIZE,
  },
  {
    id: 'flat',
    label: '扁平',
    description: '极简扁平风格',
    icon: '🎨',
    colorBands: 2,
    outlineThickness: 3.0,
    halftoneSize: 0,
    specularSize: 0.1,
  },
];

export const CRYSTAL_PRESETS: CrystalPreset[] = [
  {
    id: 'diamond',
    label: '钻石',
    description: '高折射透明效果',
    icon: '💎',
    ior: 2.4,
    dispersion: CRYSTAL_DEFAULTS.DISPERSION,
    fresnelPower: CRYSTAL_DEFAULTS.FRESNEL_POWER,
    transmission: CRYSTAL_DEFAULTS.TRANSMISSION,
    caustics: CRYSTAL_DEFAULTS.CAUSTICS,
  },
  {
    id: 'ice',
    label: '冰晶',
    description: '冰冷透明效果',
    icon: '❄️',
    ior: 1.31,
    dispersion: 0.01,
    fresnelPower: 2.0,
    transmission: 0.95,
    caustics: 0.3,
  },
];

export const HOLOGRAM_V2_PRESETS: HologramV2Preset[] = [
  {
    id: 'scifi',
    label: '科幻',
    description: '标准科幻全息效果',
    icon: '�',
    scanlineIntensity: HOLOGRAM_V2_DEFAULTS.SCANLINE_INTENSITY,
    scanlineDensity: HOLOGRAM_V2_DEFAULTS.SCANLINE_DENSITY,
    rgbOffset: HOLOGRAM_V2_DEFAULTS.RGB_OFFSET,
    flickerSpeed: HOLOGRAM_V2_DEFAULTS.FLICKER_SPEED,
    glitchIntensity: HOLOGRAM_V2_DEFAULTS.GLITCH_INTENSITY,
    fresnelPower: HOLOGRAM_V2_DEFAULTS.FRESNEL_POWER,
    dataStreamSpeed: HOLOGRAM_V2_DEFAULTS.DATA_STREAM_SPEED,
  },
  {
    id: 'glitch',
    label: '故障',
    description: '强烈故障效果',
    icon: '📡',
    scanlineIntensity: 0.8,
    scanlineDensity: 80,
    rgbOffset: 0.015,
    flickerSpeed: 4.0,
    glitchIntensity: 0.7,
    fresnelPower: 3.0,
    dataStreamSpeed: 2.5,
  },
];

export const INK_WASH_PRESETS: InkWashPreset[] = [
  {
    id: 'sumi-e',
    label: '墨绘',
    description: '日式水墨画风格',
    icon: '�️',
    inkDensity: INK_WASH_DEFAULTS.INK_DENSITY,
    bleedAmount: INK_WASH_DEFAULTS.BLEED_AMOUNT,
    paperTexture: INK_WASH_DEFAULTS.PAPER_TEXTURE,
    brushTexture: INK_WASH_DEFAULTS.BRUSH_TEXTURE,
    whiteSpace: INK_WASH_DEFAULTS.WHITE_SPACE,
    edgeWobble: INK_WASH_DEFAULTS.EDGE_WOBBLE,
  },
  {
    id: 'chinese',
    label: '国画',
    description: '中国水墨画风格',
    icon: '🏔️',
    inkDensity: 0.8,
    bleedAmount: 0.6,
    paperTexture: 0.5,
    brushTexture: 0.7,
    whiteSpace: 0.4,
    edgeWobble: 0.5,
  },
];

export const MATRIX_PRESETS: MatrixPreset[] = [
  {
    id: 'classic',
    label: '经典',
    description: '经典黑客帝国效果',
    icon: '🔢',
    fallSpeed: MATRIX_DEFAULTS.FALL_SPEED,
    charDensity: MATRIX_DEFAULTS.CHAR_DENSITY,
    glowIntensity: MATRIX_DEFAULTS.GLOW_INTENSITY,
    trailLength: MATRIX_DEFAULTS.TRAIL_LENGTH,
    charSize: MATRIX_DEFAULTS.CHAR_SIZE,
    showOriginal: MATRIX_DEFAULTS.SHOW_ORIGINAL,
  },
  {
    id: 'hacker',
    label: '黑客',
    description: '快速密集代码雨',
    icon: '�',
    fallSpeed: 4.0,
    charDensity: 0.9,
    glowIntensity: 1.5,
    trailLength: 0.7,
    charSize: 6,
    showOriginal: 0.1,
  },
];

export const RETRO_PIXEL_PRESETS: RetroPixelPreset[] = [
  {
    id: 'nes',
    label: 'NES',
    description: '经典红白机风格',
    icon: '🎮',
    pixelSize: RETRO_PIXEL_DEFAULTS.PIXEL_SIZE,
    paletteMode: 0,
    ditherStrength: RETRO_PIXEL_DEFAULTS.DITHER_STRENGTH,
    crtEffect: RETRO_PIXEL_DEFAULTS.CRT_EFFECT,
    colorDepth: RETRO_PIXEL_DEFAULTS.COLOR_DEPTH,
  },
  {
    id: 'gameboy',
    label: 'GameBoy',
    description: '绿色4色液晶风格',
    icon: '�',
    pixelSize: 3,
    paletteMode: 2,
    ditherStrength: 0.7,
    crtEffect: 0.1,
    colorDepth: 4,
  },
];

const DEFAULT_PRESET_INDEX = 0;

export const getDefaultAnimePreset = (): AnimePreset => {
  const preset = ANIME_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('ANIME_PRESETS is empty');

  return preset;
};

export const getDefaultCelPreset = (): CelPreset => {
  const preset = CEL_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('CEL_PRESETS is empty');

  return preset;
};

export const getDefaultCrystalPreset = (): CrystalPreset => {
  const preset = CRYSTAL_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('CRYSTAL_PRESETS is empty');

  return preset;
};

export const getDefaultHologramV2Preset = (): HologramV2Preset => {
  const preset = HOLOGRAM_V2_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('HOLOGRAM_V2_PRESETS is empty');

  return preset;
};

export const getDefaultInkWashPreset = (): InkWashPreset => {
  const preset = INK_WASH_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('INK_WASH_PRESETS is empty');

  return preset;
};

export const getDefaultMatrixPreset = (): MatrixPreset => {
  const preset = MATRIX_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('MATRIX_PRESETS is empty');

  return preset;
};

export const getDefaultRetroPixelPreset = (): RetroPixelPreset => {
  const preset = RETRO_PIXEL_PRESETS[DEFAULT_PRESET_INDEX];

  if (!preset) throw new Error('RETRO_PIXEL_PRESETS is empty');

  return preset;
};
