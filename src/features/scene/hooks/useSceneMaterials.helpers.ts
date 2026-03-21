import type { MeshStandardMaterial, ShaderMaterial, Texture } from 'three';

import type { SceneConfig } from '@/shared/types';
import {
  ANIME,
  CEL,
  CRYSTAL,
  HOLOGRAM_V2,
  INK_WASH,
  LIGHT,
  MATERIAL_DEFAULTS,
  MATRIX,
  RETRO_PIXEL,
  TEXTURE as TEXTURE_CONSTANTS,
} from './useSceneMaterials.constants';

// Compute light direction from angle values (in degrees)
export function computeLightDirection(angleX: number, angleY: number): [number, number, number] {
  const radX = (angleX * Math.PI) / 180;
  const radY = (angleY * Math.PI) / 180;

  return [Math.cos(radX) * Math.sin(radY), Math.sin(radX), Math.cos(radX) * Math.cos(radY)];
}

// Build common light uniforms from config
export function buildLightUniforms(config: SceneConfig): Record<string, unknown> {
  const angleX = config.lightAngleX ?? LIGHT.DEFAULT_ANGLE_X;
  const angleY = config.lightAngleY ?? LIGHT.DEFAULT_ANGLE_Y;

  return {
    uLightIntensity: config.lightIntensity ?? LIGHT.DEFAULT_INTENSITY,
    uLightDirection: computeLightDirection(angleX, angleY),
  };
}

export function getTexelSize(texture: Texture | null): [number, number] {
  if (!texture?.image)
    return [1 / TEXTURE_CONSTANTS.DEFAULT_TEXEL_SIZE, 1 / TEXTURE_CONSTANTS.DEFAULT_TEXEL_SIZE];
  const img = texture.image as { height?: number; width?: number };
  const w = img.width ?? TEXTURE_CONSTANTS.DEFAULT_TEXEL_SIZE;
  const h = img.height ?? TEXTURE_CONSTANTS.DEFAULT_TEXEL_SIZE;

  return [1 / w, 1 / h];
}
export function setUniform(mat: ShaderMaterial, name: string, value: unknown): void {
  if (mat.uniforms?.[name]) {
    mat.uniforms[name].value = value;
  }
}

export interface MaterialUpdateContext {
  activeMap: Texture | null;
  bias: number;
  config: SceneConfig;
  displacementMap: Texture;
  scale: number;
  seamCorrectionValue: number;
  texelSize: [number, number];
}

export const buildAnimeUniforms = (ctx: MaterialUpdateContext): Record<string, unknown> => ({
  ...buildLightUniforms(ctx.config),
  uTexelSize: ctx.texelSize,
  uShadowSteps: ctx.config.animeShadowSteps ?? ANIME.DEFAULT_SHADOW_STEPS,
  uShadowThreshold: ctx.config.animeShadowThreshold ?? ANIME.DEFAULT_SHADOW_THRESHOLD,
  uHighlightSharpness: ctx.config.animeHighlightSharpness ?? ANIME.DEFAULT_HIGHLIGHT_SHARPNESS,
  uOutlineWidth: ctx.config.animeOutlineWidth ?? ANIME.DEFAULT_OUTLINE_WIDTH,
  uSkinToneBoost: ctx.config.animeSkinToneBoost ?? ANIME.DEFAULT_SKIN_TONE_BOOST,
  // Enhanced anime style uniforms
  uShadowSoftness: ctx.config.animeShadowSoftness ?? ANIME.DEFAULT_SHADOW_SOFTNESS,
  uColorShift: ctx.config.animeColorShift ?? ANIME.DEFAULT_COLOR_SHIFT,
  uDitherStrength: ctx.config.animeDitherStrength ?? ANIME.DEFAULT_DITHER_STRENGTH,
  uAmbientOcclusion: ctx.config.animeAmbientOcclusion ?? ANIME.DEFAULT_AMBIENT_OCCLUSION,
  uShadowTint: [
    ANIME.DEFAULT_SHADOW_TINT.r,
    ANIME.DEFAULT_SHADOW_TINT.g,
    ANIME.DEFAULT_SHADOW_TINT.b,
  ],
  uHighlightTint: [
    ANIME.DEFAULT_HIGHLIGHT_TINT.r,
    ANIME.DEFAULT_HIGHLIGHT_TINT.g,
    ANIME.DEFAULT_HIGHLIGHT_TINT.b,
  ],
});

export const buildCelUniforms = (ctx: MaterialUpdateContext): Record<string, unknown> => ({
  ...buildLightUniforms(ctx.config),
  uTexelSize: ctx.texelSize,
  uColorBands: ctx.config.celColorBands ?? CEL.DEFAULT_COLOR_BANDS,
  uOutlineThickness: ctx.config.celOutlineThickness ?? CEL.DEFAULT_OUTLINE_THICKNESS,
  uHalftoneSize: ctx.config.celHalftoneSize ?? CEL.DEFAULT_HALFTONE_SIZE,
  uSpecularSize: ctx.config.celSpecularSize ?? CEL.DEFAULT_SPECULAR_SIZE,
  // Enhanced cel shading uniforms
  uSpecularThreshold: ctx.config.celSpecularThreshold ?? CEL.DEFAULT_SPECULAR_THRESHOLD,
  uSpecularIntensity: ctx.config.celSpecularIntensity ?? CEL.DEFAULT_SPECULAR_INTENSITY,
  uShadowIntensity: ctx.config.celShadowIntensity ?? CEL.DEFAULT_SHADOW_INTENSITY,
  uEdgeSoftness: ctx.config.celEdgeSoftness ?? CEL.DEFAULT_EDGE_SOFTNESS,
  uRimLightIntensity: ctx.config.celRimLightIntensity ?? CEL.DEFAULT_RIM_LIGHT_INTENSITY,
  uToonContrast: ctx.config.celToonContrast ?? CEL.DEFAULT_TOON_CONTRAST,
});

export const buildCrystalUniforms = (ctx: MaterialUpdateContext): Record<string, unknown> => ({
  ...buildLightUniforms(ctx.config),
  uTexelSize: ctx.texelSize,
  uIOR: ctx.config.crystalIOR ?? CRYSTAL.DEFAULT_IOR,
  uDispersion: ctx.config.crystalDispersion ?? CRYSTAL.DEFAULT_DISPERSION,
  uFresnelPower: ctx.config.crystalFresnelPower ?? CRYSTAL.DEFAULT_FRESNEL_POWER,
  uTransmission: ctx.config.crystalTransmission ?? CRYSTAL.DEFAULT_TRANSMISSION,
  uCaustics: ctx.config.crystalCaustics ?? CRYSTAL.DEFAULT_CAUSTICS,
});

export const buildHologramV2Uniforms = (ctx: MaterialUpdateContext): Record<string, unknown> => ({
  ...buildLightUniforms(ctx.config),
  uTexelSize: ctx.texelSize,
  uScanlineIntensity:
    ctx.config.hologramV2ScanlineIntensity ?? HOLOGRAM_V2.DEFAULT_SCANLINE_INTENSITY,
  uScanlineDensity: ctx.config.hologramV2ScanlineDensity ?? HOLOGRAM_V2.DEFAULT_SCANLINE_DENSITY,
  uRGBOffset: ctx.config.hologramV2RGBOffset ?? HOLOGRAM_V2.DEFAULT_RGB_OFFSET,
  uFlickerSpeed: ctx.config.hologramV2FlickerSpeed ?? HOLOGRAM_V2.DEFAULT_FLICKER_SPEED,
  uGlitchIntensity: ctx.config.hologramV2GlitchIntensity ?? HOLOGRAM_V2.DEFAULT_GLITCH_INTENSITY,
  uFresnelPower: ctx.config.hologramV2FresnelPower ?? HOLOGRAM_V2.DEFAULT_FRESNEL_POWER,
  uDataStreamSpeed: ctx.config.hologramV2DataStreamSpeed ?? HOLOGRAM_V2.DEFAULT_DATA_STREAM_SPEED,
});

export const buildInkWashUniforms = (ctx: MaterialUpdateContext): Record<string, unknown> => ({
  ...buildLightUniforms(ctx.config),
  uTexelSize: ctx.texelSize,
  uInkDensity: ctx.config.inkWashInkDensity ?? INK_WASH.DEFAULT_INK_DENSITY,
  uBleedAmount: ctx.config.inkWashBleedAmount ?? INK_WASH.DEFAULT_BLEED_AMOUNT,
  uPaperTexture: ctx.config.inkWashPaperTexture ?? INK_WASH.DEFAULT_PAPER_TEXTURE,
  uBrushTexture: ctx.config.inkWashBrushTexture ?? INK_WASH.DEFAULT_BRUSH_TEXTURE,
  uWhiteSpace: ctx.config.inkWashWhiteSpace ?? INK_WASH.DEFAULT_WHITE_SPACE,
  uEdgeWobble: ctx.config.inkWashEdgeWobble ?? INK_WASH.DEFAULT_EDGE_WOBBLE,
});

export const buildMatrixUniforms = (ctx: MaterialUpdateContext): Record<string, unknown> => ({
  ...buildLightUniforms(ctx.config),
  uTexelSize: ctx.texelSize,
  uFallSpeed: ctx.config.matrixFallSpeed ?? MATRIX.DEFAULT_FALL_SPEED,
  uCharDensity: ctx.config.matrixCharDensity ?? MATRIX.DEFAULT_CHAR_DENSITY,
  uGlowIntensity: ctx.config.matrixGlowIntensity ?? MATRIX.DEFAULT_GLOW_INTENSITY,
  uTrailLength: ctx.config.matrixTrailLength ?? MATRIX.DEFAULT_TRAIL_LENGTH,
  uCharSize: ctx.config.matrixCharSize ?? MATRIX.DEFAULT_CHAR_SIZE,
  uShowOriginal: ctx.config.matrixShowOriginal ?? MATRIX.DEFAULT_SHOW_ORIGINAL,
});

export const buildRetroPixelUniforms = (ctx: MaterialUpdateContext): Record<string, unknown> => ({
  ...buildLightUniforms(ctx.config),
  uTexelSize: ctx.texelSize,
  uPixelSize: ctx.config.retroPixelSize ?? RETRO_PIXEL.DEFAULT_PIXEL_SIZE,
  uPaletteMode: ctx.config.retroPaletteMode ?? RETRO_PIXEL.DEFAULT_PALETTE_MODE,
  uDitherStrength: ctx.config.retroDitherStrength ?? RETRO_PIXEL.DEFAULT_DITHER_STRENGTH,
  uCRTEffect: ctx.config.retroCRTEffect ?? RETRO_PIXEL.DEFAULT_CRT_EFFECT,
  uColorDepth: ctx.config.retroColorDepth ?? RETRO_PIXEL.DEFAULT_COLOR_DEPTH,
  uScanlineBrightness:
    ctx.config.retroScanlineBrightness ?? RETRO_PIXEL.DEFAULT_SCANLINE_BRIGHTNESS,
});

export const updateShaderMaterial = (
  mat: ShaderMaterial,
  ctx: MaterialUpdateContext,
  extraUniforms: Record<string, unknown>
): void => {
  const { activeMap, displacementMap, scale, bias, config } = ctx;

  setUniform(mat, 'uMap', activeMap);
  setUniform(mat, 'map', activeMap);
  setUniform(mat, 'uDisplacementMap', displacementMap);
  setUniform(mat, 'displacementMap', displacementMap);
  setUniform(mat, 'uDisplacementScale', scale);
  setUniform(mat, 'displacementScale', scale);
  setUniform(mat, 'uDisplacementBias', bias);
  setUniform(mat, 'displacementBias', bias);

  for (const [key, value] of Object.entries(extraUniforms)) {
    setUniform(mat, key, value);
  }
  mat.wireframe = config.wireframe;
};

export const updateStandardMaterial = (
  mat: MeshStandardMaterial,
  ctx: MaterialUpdateContext
): void => {
  const { activeMap, displacementMap, config, seamCorrectionValue, scale, bias } = ctx;

  mat.displacementScale = scale;
  mat.displacementBias = bias;
  mat.wireframe = config.wireframe;
  mat.roughness = config.roughness;
  mat.metalness = config.metalness;
  mat.envMapIntensity = config.lightIntensity * MATERIAL_DEFAULTS.ENV_MAP_INTENSITY;
  if (mat.userData['shader']) {
    mat.userData['shader'].uniforms['uSeamCorrection'].value = seamCorrectionValue;
    mat.userData['shader'].uniforms['uEdgeFade'].value = config.edgeFade;
  }
  if (mat.map !== activeMap || mat.displacementMap !== displacementMap) {
    mat.map = activeMap;
    mat.displacementMap = displacementMap;
    mat.needsUpdate = true;
  }
};
