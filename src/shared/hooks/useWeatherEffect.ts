import { useEffect, useRef } from 'react';

import { createLogger } from '@/core/Logger';
import type { SceneConfig } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

const logger = createLogger({ module: 'useWeatherEffect' });

type WeatherEffect = SceneConfig['weatherEffect'];
type ParticleType = 'dust' | 'snow' | 'rain' | 'firefly' | 'stars' | 'leaves';

interface WeatherVisualConfig {
  particleType: ParticleType;
  brightness: number;
  saturation: number;
  contrast: number;
  depthFog: number;
  lightIntensity: number;
  exposure: number;
  vignetteStrength: number;
  particleDensity: number;
  particleColor?: string;
}

const WEATHER_VISUAL_CONFIGS: Record<WeatherEffect, WeatherVisualConfig> = {
  sunny: {
    particleType: 'dust',
    // Light pink for Sunset (晚霞)
    particleColor: '#FFC0CB',
    brightness: 1.1,
    saturation: 1.2,
    contrast: 1.1,
    depthFog: 0.02,
    lightIntensity: 1.2,
    exposure: 1.1,
    vignetteStrength: 0.2,
    particleDensity: 1.2, // Increased density for better visibility
  },
  rain: {
    particleType: 'rain',
    brightness: 0.75,
    saturation: 0.8,
    contrast: 0.9,
    depthFog: 0.4,
    lightIntensity: 0.6,
    exposure: 0.85,
    vignetteStrength: 0.3,
    particleDensity: 3.0,
  },
  fog: {
    particleType: 'dust',
    brightness: 0.85,
    saturation: 0.5,
    contrast: 0.7,
    depthFog: 0.8,
    lightIntensity: 0.7,
    exposure: 0.9,
    vignetteStrength: 0.4,
    particleDensity: 1.6,
    particleColor: '#A0A0A0',
  },
  snow: {
    particleType: 'snow',
    brightness: 1.2,
    saturation: 0.7,
    contrast: 0.85,
    depthFog: 0.3,
    lightIntensity: 1.1,
    exposure: 1.1,
    vignetteStrength: 0.15,
    particleDensity: 2.4,
  },
};

type WeatherConfig = Pick<SceneConfig, 'weatherEnabled' | 'weatherEffect' | 'weatherIntensity' | 'weatherParticleDensity' | 'particleColor'>;

export function useWeatherEffect(config: WeatherConfig): void {
  const isFirstRender = useRef(true);
  const prevEnabled = useRef<boolean | null>(null);
  const prevEffect = useRef<WeatherEffect | null>(null);
  const prevIntensity = useRef<number | null>(null);
  const prevParticleDensity = useRef<number | null>(null);

  const { weatherEnabled, weatherEffect, weatherIntensity, weatherParticleDensity, particleColor } = config;

  useEffect(() => {
    if (!weatherEnabled) {
      if (prevEnabled.current === true) {
        useSceneStore.getState().setConfig({
          enableParticles: false,
          brightness: 1.0,
          saturation: 1.0,
          contrast: 1.0,
          depthFog: 0,
          lightIntensity: 1.0,
          exposure: 1.0,
          vignetteStrength: 0,
          enableVignette: false,
        });
      }

      prevEnabled.current = false;
      prevEffect.current = weatherEffect;
      prevIntensity.current = weatherIntensity;
      prevParticleDensity.current = weatherParticleDensity;
      isFirstRender.current = false;

      return;
    }

    const visualConfig = WEATHER_VISUAL_CONFIGS[weatherEffect];

    // Check if the current particle color matches the intended visual config color
    // This allows hot-reloading keys/colors in constants to apply immediately
    const colorMismatch = visualConfig.particleColor && particleColor !== visualConfig.particleColor;

    const shouldApply =
      isFirstRender.current ||
      prevEnabled.current !== weatherEnabled ||
      prevEffect.current !== weatherEffect ||
      (prevIntensity.current !== null && Math.abs(prevIntensity.current - weatherIntensity) > 0.01) ||
      (prevParticleDensity.current !== null && Math.abs(prevParticleDensity.current - (weatherParticleDensity ?? 0.5)) > 0.01) ||
      colorMismatch;

    if (shouldApply) {
      const intensity = weatherIntensity ?? 0.5;

      const lerp = (base: number, target: number, t: number) => base + (target - base) * t;

      useSceneStore.getState().setConfig({
        enableParticles: true,
        particleType: visualConfig.particleType,
        brightness: lerp(1.0, visualConfig.brightness, intensity),
        saturation: lerp(1.0, visualConfig.saturation, intensity),
        contrast: lerp(1.0, visualConfig.contrast, intensity),
        depthFog: lerp(0, visualConfig.depthFog, intensity),
        lightIntensity: lerp(1.0, visualConfig.lightIntensity, intensity),
        exposure: lerp(1.0, visualConfig.exposure, intensity),
        vignetteStrength: lerp(0, visualConfig.vignetteStrength, intensity),
        enableVignette: visualConfig.vignetteStrength > 0.1,
        // Particle density is now controlled by its own slider (weatherParticleDensity)
        // We treat the slider (0-1) as a direct multiplier of the base config density
        // But to allow "more than default" (since slider default is 0.5), we might want to scale it.
        // Actually, let's keep it simple: Slider 0-1 maps to 0-100% of the config's "Max Density".
        // We will increase the config densities slightly if needed.
        particleDensity: visualConfig.particleDensity * (config.weatherParticleDensity ?? 0.5) * 2, // *2 so 0.5 is 1x (normal)
        particleColor: visualConfig.particleColor ?? '',
      });

      logger.info('[Weather Effect] Applied', {
        effect: weatherEffect,
        intensity,
        brightness: lerp(1.0, visualConfig.brightness, intensity).toFixed(2),
        saturation: lerp(1.0, visualConfig.saturation, intensity).toFixed(2),
        depthFog: lerp(0, visualConfig.depthFog, intensity).toFixed(2),
      });
    }

    prevEnabled.current = weatherEnabled;
    prevEffect.current = weatherEffect;
    prevIntensity.current = weatherIntensity;
    prevParticleDensity.current = weatherParticleDensity;
    isFirstRender.current = false;
  }, [weatherEnabled, weatherEffect, weatherIntensity, weatherParticleDensity]);
}
