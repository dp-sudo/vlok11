import { useEffect, useRef } from 'react';

import { useSceneStore } from '@/stores/sharedStore';
import type { SceneConfig } from '@/shared/types';

type EmotionalTone = SceneConfig['emotionalTone'];

interface TonePreset {
  saturation: number;
  contrast: number;
  brightness: number;
  vignetteStrength: number;
  hueShift: number;
  exposure: number;
}

const TONE_PRESETS: Record<EmotionalTone, TonePreset> = {
  warm: {
    saturation: 1.35,
    contrast: 1.12,
    brightness: 1.08,
    vignetteStrength: 0.2,
    hueShift: 15,
    exposure: 1.1,
  },
  cool: {
    saturation: 0.75,
    contrast: 1.15,
    brightness: 0.95,
    vignetteStrength: 0.25,
    hueShift: -20,
    exposure: 0.95,
  },
  vintage: {
    saturation: 0.55,
    contrast: 0.85,
    brightness: 0.9,
    vignetteStrength: 0.45,
    hueShift: 25,
    exposure: 0.88,
  },
  dramatic: {
    saturation: 1.50,
    contrast: 1.35,
    brightness: 0.85,
    vignetteStrength: 0.55,
    hueShift: 0,
    exposure: 0.9,
  },
  ethereal: {
    saturation: 1.20,
    contrast: 0.88,
    brightness: 1.15,
    vignetteStrength: 0.3,
    hueShift: -10,
    exposure: 1.2,
  },
  natural: {
    saturation: 1.05,
    contrast: 1.02,
    brightness: 1.0,
    vignetteStrength: 0.1,
    hueShift: 0,
    exposure: 1.0,
  },
};

type EmotionalToneConfig = Pick<
  SceneConfig,
  'emotionalToneEnabled' | 'emotionalTone' | 'toneIntensity'
>;

export function useEmotionalTone(config: EmotionalToneConfig): void {
  const isFirstRender = useRef(true);
  const prevEnabled = useRef<boolean | null>(null);
  const prevTone = useRef<EmotionalTone | null>(null);
  const prevIntensity = useRef<number | null>(null);

  const { emotionalToneEnabled, emotionalTone, toneIntensity } = config;

  useEffect(() => {
    if (!emotionalToneEnabled) {
      if (prevEnabled.current === true) {
        useSceneStore.getState().setConfig({
          saturation: 1.0,
          contrast: 1.0,
          brightness: 1.0,
          vignetteStrength: 0,
          enableVignette: false,
          exposure: 1.0,
        });
      }

      prevEnabled.current = false;
      prevTone.current = emotionalTone;
      prevIntensity.current = toneIntensity;
      isFirstRender.current = false;

      return;
    }

    const shouldApply =
      isFirstRender.current ||
      prevEnabled.current !== emotionalToneEnabled ||
      prevTone.current !== emotionalTone ||
      (prevIntensity.current !== null && Math.abs(prevIntensity.current - toneIntensity) > 0.01);

    if (shouldApply) {
      const preset = TONE_PRESETS[emotionalTone];
      const intensity = toneIntensity;

      const lerp = (base: number, target: number, t: number) => base + (target - base) * t;

      useSceneStore.getState().setConfig({
        saturation: lerp(1.0, preset.saturation, intensity),
        contrast: lerp(1.0, preset.contrast, intensity),
        brightness: lerp(1.0, preset.brightness, intensity),
        vignetteStrength: lerp(0, preset.vignetteStrength, intensity),
        enableVignette: intensity > 0.1,
        exposure: lerp(1.0, preset.exposure, intensity),
      });

      console.info('[Emotional Tone] Applied:', {
        tone: emotionalTone,
        intensity,
        saturation: lerp(1.0, preset.saturation, intensity).toFixed(2),
        contrast: lerp(1.0, preset.contrast, intensity).toFixed(2),
      });
    }

    prevEnabled.current = emotionalToneEnabled;
    prevTone.current = emotionalTone;
    prevIntensity.current = toneIntensity;
    isFirstRender.current = false;
  }, [emotionalToneEnabled, emotionalTone, toneIntensity]);
}
