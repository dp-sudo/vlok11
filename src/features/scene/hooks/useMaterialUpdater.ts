import { useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';

import type { Material, ShaderMaterial } from 'three';

export function useMaterialUpdater({
  activeMaterial,
  animeMaterial,
  celMaterial,
  crystalMaterial,
  hologramV2Material,
  inkWashMaterial,
  matrixMaterial,
  retroPixelMaterial,
  paused = false,
}: MaterialUpdaterOptions): void {
  const timeRef = useRef(0);

  const materialConfigs = useMemo(
    () =>
      new Map<Material, MaterialTimeConfig>([
        [animeMaterial, { material: animeMaterial, uniformName: 'uTime', speedMultiplier: 1 }],
        [celMaterial, { material: celMaterial, uniformName: 'uTime', speedMultiplier: 1 }],
        [crystalMaterial, { material: crystalMaterial, uniformName: 'uTime', speedMultiplier: 1 }],
        [
          hologramV2Material,
          { material: hologramV2Material, uniformName: 'uTime', speedMultiplier: 1 },
        ],
        [inkWashMaterial, { material: inkWashMaterial, uniformName: 'uTime', speedMultiplier: 1 }],
        [matrixMaterial, { material: matrixMaterial, uniformName: 'uTime', speedMultiplier: 1 }],
        [
          retroPixelMaterial,
          { material: retroPixelMaterial, uniformName: 'uTime', speedMultiplier: 1 },
        ],
      ]),
    [
      animeMaterial,
      celMaterial,
      crystalMaterial,
      hologramV2Material,
      inkWashMaterial,
      matrixMaterial,
      retroPixelMaterial,
    ]
  );

  useFrame((_, delta) => {
    if (paused || !activeMaterial) return;

    timeRef.current += delta;

    const config = materialConfigs.get(activeMaterial);

    if (config) {
      updateMaterialTime(config, delta);
    }
  });
}
export function useResetMaterialTime(materials: {
  animeMaterial: ShaderMaterial;
  celMaterial: ShaderMaterial;
  crystalMaterial: ShaderMaterial;
  hologramV2Material: ShaderMaterial;
  inkWashMaterial: ShaderMaterial;
  matrixMaterial: ShaderMaterial;
  retroPixelMaterial: ShaderMaterial;
}): () => void {
  return useCallback(() => {
    const {
      animeMaterial,
      celMaterial,
      crystalMaterial,
      hologramV2Material,
      inkWashMaterial,
      matrixMaterial,
      retroPixelMaterial,
    } = materials;

    resetMaterialTime(animeMaterial, 'uTime');
    resetMaterialTime(celMaterial, 'uTime');
    resetMaterialTime(crystalMaterial, 'uTime');
    resetMaterialTime(hologramV2Material, 'uTime');
    resetMaterialTime(inkWashMaterial, 'uTime');
    resetMaterialTime(matrixMaterial, 'uTime');
    resetMaterialTime(retroPixelMaterial, 'uTime');
  }, [materials]);
}

interface MaterialTimeConfig {
  material: ShaderMaterial;
  speedMultiplier: number;
  uniformName: string;
}
export interface MaterialUpdaterOptions {
  activeMaterial: Material | undefined;
  animeMaterial: ShaderMaterial;
  celMaterial: ShaderMaterial;
  crystalMaterial: ShaderMaterial;
  hologramV2Material: ShaderMaterial;
  inkWashMaterial: ShaderMaterial;
  matrixMaterial: ShaderMaterial;
  paused?: boolean;
  retroPixelMaterial: ShaderMaterial;
}

const resetMaterialTime = (material: ShaderMaterial, uniformName: string): void => {
  const uniform = material.uniforms?.[uniformName];

  if (uniform) {
    uniform.value = 0;
  }
};
const updateMaterialTime = (config: MaterialTimeConfig, delta: number): void => {
  const { material, uniformName, speedMultiplier } = config;
  const uniform = material.uniforms?.[uniformName];

  if (uniform) {
    uniform.value += delta * speedMultiplier;
  }
};
