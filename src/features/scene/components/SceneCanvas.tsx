import { Canvas, useThree } from '@react-three/fiber';
import { memo, type ReactNode, useEffect, useMemo } from 'react';
import { ACESFilmicToneMapping } from 'three';

import { RENDERER } from '@/shared/constants';
import { useSceneStore } from '@/stores/sharedStore';

import {
  CINEMATIC_CONTRAST_MULTIPLIER,
  CINEMATIC_HUE_ROTATE,
  CINEMATIC_SATURATE_MULTIPLIER,
  CINEMATIC_SEPIA,
  CYBERPUNK_CONTRAST_MULTIPLIER,
  CYBERPUNK_HUE_ROTATE,
  CYBERPUNK_SATURATE_MULTIPLIER,
  DREAMY_BRIGHTNESS_MULTIPLIER,
  DREAMY_CONTRAST_MULTIPLIER,
  DREAMY_SATURATE_MULTIPLIER,
  DREAMY_SEPIA,
  NOIR_CONTRAST_MULTIPLIER,
  NOIR_GRAYSCALE,
  VHS_CONTRAST_MULTIPLIER,
  VHS_SATURATE_MULTIPLIER,
  VHS_SEPIA,
  VINTAGE_CONTRAST_MULTIPLIER,
  VINTAGE_SATURATE_MULTIPLIER,
  VINTAGE_SEPIA,
  WARM_CONTRAST_MULTIPLIER,
  WARM_SATURATE_MULTIPLIER,
  WARM_SEPIA,
} from './SceneCanvas.constants';

interface SceneCanvasProps {
  children: ReactNode;
  className?: string;
}
interface ToneMappingEffectProps {
  exposure: number;
}

export const SceneCanvas = memo(({ children, className }: SceneCanvasProps) => {
  const config = useSceneStore((state) => state.config);
  const { enableVignette, exposure } = config;

  const filterStyle = useFilterStyle(config);

  return (
    <div
      className={`w-full h-full bg-black relative rounded-lg overflow-hidden shadow-2xl border border-zinc-800 transition-all duration-200 ${className ?? ''}`}
      style={filterStyle}
    >
      {enableVignette ? (
        <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)] mix-blend-multiply" />
      ) : null}

      <Canvas dpr={RENDERER.DPR} gl={{ preserveDrawingBuffer: true }} shadows>
        <ToneMappingEffect exposure={exposure} />
        {children}
      </Canvas>
    </div>
  );
});
const ToneMappingEffect = memo(({ exposure }: ToneMappingEffectProps) => {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  return null;
});

function useFilterStyle(config: ReturnType<typeof useSceneStore.getState>['config']) {
  const { colorGrade, saturation, contrast: baseContrast, brightness: baseBrightness } = config;

  return useMemo(() => {
    let hueRotate = '0deg';
    let saturate = saturation;
    let contrast = baseContrast;
    let sepia = '0%';
    let grayscale = '0%';
    let brightness = baseBrightness;

    switch (colorGrade) {
      case 'CYBERPUNK':
        saturate *= CYBERPUNK_SATURATE_MULTIPLIER;
        contrast *= CYBERPUNK_CONTRAST_MULTIPLIER;
        hueRotate = CYBERPUNK_HUE_ROTATE;
        break;
      case 'VINTAGE':
        sepia = VINTAGE_SEPIA;
        contrast *= VINTAGE_CONTRAST_MULTIPLIER;
        saturate *= VINTAGE_SATURATE_MULTIPLIER;
        break;
      case 'NOIR':
        grayscale = NOIR_GRAYSCALE;
        contrast *= NOIR_CONTRAST_MULTIPLIER;
        break;
      case 'CINEMATIC':
        contrast *= CINEMATIC_CONTRAST_MULTIPLIER;
        saturate *= CINEMATIC_SATURATE_MULTIPLIER;
        sepia = CINEMATIC_SEPIA;
        hueRotate = CINEMATIC_HUE_ROTATE;
        break;
      case 'DREAMY':
        contrast *= DREAMY_CONTRAST_MULTIPLIER;
        saturate *= DREAMY_SATURATE_MULTIPLIER;
        brightness *= DREAMY_BRIGHTNESS_MULTIPLIER;
        sepia = DREAMY_SEPIA;
        break;
      case 'VHS':
        contrast *= VHS_CONTRAST_MULTIPLIER;
        saturate *= VHS_SATURATE_MULTIPLIER;
        sepia = VHS_SEPIA;
        break;
      case 'WARM':
        sepia = WARM_SEPIA;
        contrast *= WARM_CONTRAST_MULTIPLIER;
        saturate *= WARM_SATURATE_MULTIPLIER;
        break;
    }

    return {
      filter: `saturate(${saturate}) contrast(${contrast}) brightness(${brightness}) hue-rotate(${hueRotate}) sepia(${sepia}) grayscale(${grayscale})`,
      transition: 'filter 0.3s ease-out',
    };
  }, [colorGrade, saturation, baseContrast, baseBrightness]);
}

export default SceneCanvas;

ToneMappingEffect.displayName = 'ToneMappingEffect';
SceneCanvas.displayName = 'SceneCanvas';
