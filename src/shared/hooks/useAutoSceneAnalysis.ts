import { useEffect, useRef } from 'react';

import { getEventBus } from '@/core/EventBus';
import { SessionEvents } from '@/core/EventTypes';
import { immersiveExperienceManager } from '@/features/immersive/ImmersiveExperienceManager';
import type { SceneConfig } from '@/shared/types';
import { useSessionStore } from '@/stores/sharedStore';

export function useAutoSceneAnalysis(config: Pick<SceneConfig, 'autoSceneAnalysis'>): void {
  const prevEnabled = useRef(config.autoSceneAnalysis);
  const isAnalyzing = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentImageUrl = useSessionStore((state) => state.result?.imageUrl);

  useEffect(() => {
    const { autoSceneAnalysis } = config;

    if (!autoSceneAnalysis || !currentImageUrl || isAnalyzing.current) {
      prevEnabled.current = autoSceneAnalysis;

      return;
    }

    const enabledChanged = !prevEnabled.current && autoSceneAnalysis;

    if (!enabledChanged) {
      prevEnabled.current = autoSceneAnalysis;

      return;
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    isAnalyzing.current = true;

    const img = new Image();

    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
      isAnalyzing.current = false;
    };

    signal.addEventListener('abort', cleanup);

    img.onload = async () => {
      if (signal.aborted) {
        cleanup();

        return;
      }

      try {
        const result = await immersiveExperienceManager.analyze(img);

        if (signal.aborted) {
          cleanup();

          return;
        }

        const recommendedConfig: Partial<SceneConfig> = {
          aiMotionStyle: result.insight.suggestedMotion,
          emotionalTone: result.toneConfig.tone,
          toneIntensity: result.toneConfig.intensity,
          audioMood: result.audioConfig.mood,
          audioVolume: result.audioConfig.volume,
        };

        getEventBus().emit(SessionEvents.CONFIG_RECOMMENDED, {
          config: recommendedConfig,
        });
      } catch (error) {
        if (!signal.aborted) {
          console.warn('Auto scene analysis failed:', error);
        }
      } finally {
        cleanup();
      }
    };

    img.onerror = () => {
      if (!signal.aborted) {
        console.warn('Failed to load image for scene analysis');
      }
      cleanup();
    };

    img.src = currentImageUrl;

    prevEnabled.current = autoSceneAnalysis;

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [config.autoSceneAnalysis, currentImageUrl]);
}
