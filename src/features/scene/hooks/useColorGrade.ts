import { useMemo } from 'react';

import { useSceneStore } from '@/stores/sharedStore';

import { COLOR_GRADE_MULTIPLIERS } from './useColorGrade.constants';

export function useColorGrade(): ColorGradeStyle {
  // Use individual selectors to avoid infinite loop with object selector
  const saturation = useSceneStore((state) => state.config.saturation);
  const contrast = useSceneStore((state) => state.config.contrast);
  const brightness = useSceneStore((state) => state.config.brightness);
  const colorGrade = useSceneStore((state) => state.config.colorGrade);

  return useMemo(() => {
    let hueRotate = '0deg';
    let saturateVal = saturation;
    let contrastVal = contrast;
    let sepia = '0%';
    let grayscale = '0%';
    let brightnessVal = brightness;

    switch (colorGrade) {
      case 'CYBERPUNK':
        saturateVal *= COLOR_GRADE_MULTIPLIERS.CYBERPUNK_SATURATE;
        contrastVal *= COLOR_GRADE_MULTIPLIERS.CYBERPUNK_CONTRAST;
        hueRotate = '-20deg';
        break;
      case 'VINTAGE':
        sepia = '40%';
        contrastVal *= COLOR_GRADE_MULTIPLIERS.VINTAGE_CONTRAST;
        saturateVal *= COLOR_GRADE_MULTIPLIERS.VINTAGE_SATURATE;
        break;
      case 'NOIR':
        grayscale = '100%';
        contrastVal *= COLOR_GRADE_MULTIPLIERS.NOIR_CONTRAST;
        break;
      case 'CINEMATIC':
        contrastVal *= COLOR_GRADE_MULTIPLIERS.CINEMATIC_CONTRAST;
        saturateVal *= COLOR_GRADE_MULTIPLIERS.CINEMATIC_SATURATE;
        sepia = '10%';
        hueRotate = '-5deg';
        break;
      case 'DREAMY':
        contrastVal *= COLOR_GRADE_MULTIPLIERS.DREAMY_CONTRAST;
        saturateVal *= COLOR_GRADE_MULTIPLIERS.DREAMY_SATURATE;
        brightnessVal *= COLOR_GRADE_MULTIPLIERS.DREAMY_BRIGHTNESS;
        sepia = '10%';
        break;
      case 'VHS':
        contrastVal *= COLOR_GRADE_MULTIPLIERS.VHS_CONTRAST;
        saturateVal *= COLOR_GRADE_MULTIPLIERS.VHS_SATURATE;
        sepia = '20%';
        break;
      case 'WARM':
        sepia = '30%';
        contrastVal *= COLOR_GRADE_MULTIPLIERS.WARM_CONTRAST;
        saturateVal *= COLOR_GRADE_MULTIPLIERS.WARM_SATURATE;
        break;
    }

    return {
      filter: `saturate(${saturateVal}) contrast(${contrastVal}) brightness(${brightnessVal}) hue-rotate(${hueRotate}) sepia(${sepia}) grayscale(${grayscale})`,
      transition: 'filter 0.3s ease-out',
    };
  }, [saturation, contrast, brightness, colorGrade]);
}

export interface ColorGradeStyle {
  filter: string;
  transition: string;
}
