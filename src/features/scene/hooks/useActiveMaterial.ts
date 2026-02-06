import type { SceneConfig } from '@/shared/types';
import { ProjectionMode } from '@/shared/types';
import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import type { Material, ShaderMaterial, Texture, VideoTexture } from 'three';
import { TextureLoader } from 'three';
import { useMaterialUpdater } from './useMaterialUpdater';
import { usePointCloudMaterial } from './usePointCloudMaterial';
import { useSceneMaterials } from './useSceneMaterials';

interface UseActiveMaterialOptions {
  activeMap: Texture | null;
  config: SceneConfig;
  displacementMap: Texture | null;
  seamCorrectionValue: number;
}

interface UseActiveMaterialReturn {
  activeMaterial: Material | ShaderMaterial | null;
}

export function useActiveMaterial(options: UseActiveMaterialOptions): UseActiveMaterialReturn {
  const { activeMap, displacementMap, config, seamCorrectionValue } = options;

  const pointCloudMaterial = usePointCloudMaterial();
  const materials = useSceneMaterials(activeMap, displacementMap!, config, seamCorrectionValue);
  let { activeMaterial } = materials;

  const isGaussianSplat = config.projectionMode === ProjectionMode.GAUSSIAN_SPLAT;

  if (isGaussianSplat && activeMap && displacementMap) {
    const { uniforms } = pointCloudMaterial;

    if (uniforms['map'] && uniforms['displacementMap'] && uniforms['displacementScale']) {
      uniforms['map']!.value = activeMap;
      uniforms['displacementMap']!.value = displacementMap;
      uniforms['displacementScale']!.value = config.displacementScale;
      activeMaterial = pointCloudMaterial;
    }
  }

  useMaterialUpdater({
    activeMaterial,
    animeMaterial: materials.animeMaterial,
    celMaterial: materials.celMaterial,
    crystalMaterial: materials.crystalMaterial,
    hologramV2Material: materials.hologramV2Material,
    inkWashMaterial: materials.inkWashMaterial,
    matrixMaterial: materials.matrixMaterial,
    retroPixelMaterial: materials.retroPixelMaterial,
  });

  return { activeMaterial: activeMaterial ?? null };
}

interface UseSceneTexturesOptions {
  backgroundUrl: string | null;
  depthUrl: string;
  emptyPixel: string;
  imageUrl: string;
  videoTextureRef: React.RefObject<VideoTexture | null>;
}

interface UseSceneTexturesReturn {
  activeMap: Texture | null;
  backgroundTexture: Texture;
  displacementMap: Texture;
  setVideoTexture: (texture: VideoTexture | null) => void;
}

export function useSceneTextures(options: UseSceneTexturesOptions): UseSceneTexturesReturn {
  const { imageUrl, depthUrl, backgroundUrl, emptyPixel, videoTextureRef } = options;

  const [colorMap, displacementMap, backgroundTexture] = useLoader(TextureLoader, [
    imageUrl,
    depthUrl,
    backgroundUrl ?? emptyPixel,
  ]);

  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);

  useEffect(() => {
    if (videoTextureRef) {
      videoTextureRef.current = videoTexture;
    }
  }, [videoTexture, videoTextureRef]);

  const activeMap = useMemo(() => videoTexture ?? colorMap ?? null, [videoTexture, colorMap]);

  return {
    activeMap,
    displacementMap: displacementMap!,
    backgroundTexture: backgroundTexture!,
    setVideoTexture,
  };
}
