import { useCallback, useEffect, useMemo, useRef } from 'react';

import { RenderStyle, type SceneConfig } from '@/shared/types';

import { getMaterialFactory } from '../services/material/MaterialFactory';

import {
  buildAnimeUniforms,
  buildCelUniforms,
  buildCrystalUniforms,
  buildHologramV2Uniforms,
  buildInkWashUniforms,
  buildMatrixUniforms,
  buildRetroPixelUniforms,
  getTexelSize,
  type MaterialUpdateContext,
  updateShaderMaterial,
  updateStandardMaterial,
} from './useSceneMaterials.helpers';

import type { Material, ShaderMaterial, Texture } from 'three';

type ShaderMaterialCache = Map<RenderStyle, ShaderMaterial>;

const SHADER_RENDER_STYLES = [
  RenderStyle.ANIME,
  RenderStyle.CEL_SHADING,
  RenderStyle.CRYSTAL,
  RenderStyle.HOLOGRAM_V2,
  RenderStyle.INK_WASH,
  RenderStyle.MATRIX,
  RenderStyle.RETRO_PIXEL,
] as const;

type ShaderRenderStyle = (typeof SHADER_RENDER_STYLES)[number];

const isShaderStyle = (style: RenderStyle): style is ShaderRenderStyle =>
  SHADER_RENDER_STYLES.includes(style as ShaderRenderStyle);

export function useSceneMaterials(
  activeMap: Texture | null,
  displacementMap: Texture,
  config: SceneConfig,
  seamCorrectionValue: number
) {
  const factory = getMaterialFactory();
  const materialCache = useRef<ShaderMaterialCache>(new Map());

  const standardMaterial = useMemo(() => {
    if (!activeMap || !displacementMap) return undefined;

    return (
      factory.createStandardMaterial({
        colorMap: activeMap,
        displacementMap,
        displacementScale: config.displacementScale,
      }) ?? undefined
    );
  }, [activeMap, displacementMap, config.displacementScale]);

  const createMaterialForStyle = useCallback((style: ShaderRenderStyle): ShaderMaterial => {
    switch (style) {
      case RenderStyle.ANIME:
        return factory.createAnimeMaterial();
      case RenderStyle.CEL_SHADING:
        return factory.createCelMaterial();
      case RenderStyle.CRYSTAL:
        return factory.createCrystalMaterial();
      case RenderStyle.HOLOGRAM_V2:
        return factory.createHologramV2Material();
      case RenderStyle.INK_WASH:
        return factory.createInkWashMaterial();
      case RenderStyle.MATRIX:
        return factory.createMatrixMaterial();
      case RenderStyle.RETRO_PIXEL:
        return factory.createRetroPixelMaterial();
    }
  }, []);

  const getOrCreateMaterial = useCallback(
    (style: ShaderRenderStyle): ShaderMaterial => {
      const cached = materialCache.current.get(style);

      if (cached) {
        return cached;
      }

      const newMaterial = createMaterialForStyle(style);

      materialCache.current.set(style, newMaterial);

      return newMaterial;
    },
    [createMaterialForStyle]
  );

  const activeMaterial = useMemo((): Material | undefined => {
    if (config.renderStyle === RenderStyle.NORMAL) {
      return standardMaterial;
    }

    if (isShaderStyle(config.renderStyle)) {
      return getOrCreateMaterial(config.renderStyle);
    }

    return standardMaterial;
  }, [config.renderStyle, standardMaterial, getOrCreateMaterial]);

  useEffect(
    () => () => {
      standardMaterial?.dispose();
      for (const material of materialCache.current.values()) {
        material.dispose();
      }
      materialCache.current.clear();
    },
    [standardMaterial]
  );

  useEffect(() => {
    if (!activeMaterial) return;

    const scale = config.depthInvert ? -config.displacementScale : config.displacementScale;
    const bias = -scale / 2;
    const texelSize = getTexelSize(activeMap);
    const ctx: MaterialUpdateContext = {
      activeMap,
      displacementMap,
      config,
      seamCorrectionValue,
      scale,
      bias,
      texelSize,
    };

    if (activeMaterial === standardMaterial && standardMaterial) {
      updateStandardMaterial(standardMaterial, ctx);

      return;
    }

    type UniformBuilder = (ctx: MaterialUpdateContext) => Record<string, unknown>;
    const uniformBuilders: Record<ShaderRenderStyle, UniformBuilder> = {
      [RenderStyle.ANIME]: buildAnimeUniforms,
      [RenderStyle.CEL_SHADING]: buildCelUniforms,
      [RenderStyle.CRYSTAL]: buildCrystalUniforms,
      [RenderStyle.HOLOGRAM_V2]: buildHologramV2Uniforms,
      [RenderStyle.INK_WASH]: buildInkWashUniforms,
      [RenderStyle.MATRIX]: buildMatrixUniforms,
      [RenderStyle.RETRO_PIXEL]: buildRetroPixelUniforms,
    };

    if (isShaderStyle(config.renderStyle)) {
      const builder = uniformBuilders[config.renderStyle];
      const extraUniforms = builder(ctx);

      updateShaderMaterial(activeMaterial as ShaderMaterial, ctx, extraUniforms);
    }
  }, [activeMaterial, standardMaterial, config, activeMap, displacementMap, seamCorrectionValue]);

  const getMaterialByStyle = useCallback(
    (style: RenderStyle): Material | undefined => {
      if (style === RenderStyle.NORMAL) {
        return standardMaterial;
      }

      if (isShaderStyle(style)) {
        return materialCache.current.get(style);
      }

      return undefined;
    },
    [standardMaterial]
  );

  return {
    activeMaterial,
    animeMaterial: getOrCreateMaterial(RenderStyle.ANIME),
    celMaterial: getOrCreateMaterial(RenderStyle.CEL_SHADING),
    crystalMaterial: getOrCreateMaterial(RenderStyle.CRYSTAL),
    getMaterialByStyle,
    hologramV2Material: getOrCreateMaterial(RenderStyle.HOLOGRAM_V2),
    inkWashMaterial: getOrCreateMaterial(RenderStyle.INK_WASH),
    matrixMaterial: getOrCreateMaterial(RenderStyle.MATRIX),
    retroPixelMaterial: getOrCreateMaterial(RenderStyle.RETRO_PIXEL),
    standardMaterial,
  };
}
