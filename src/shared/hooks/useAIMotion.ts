import { useEffect, useRef } from 'react';

import { getEventBus } from '@/core/EventBus';
import { CameraMotionType } from '@/core/domain/types';
import { lightSceneAnalyzer, type SimpleInsight } from '@/features/ai/services/LightSceneAnalyzer';
import { smartMotionEngine, type MotionPath } from '@/features/ai/services/SmartMotionEngine';
import type { SceneConfig } from '@/shared/types';
import { useCameraPoseStore } from '@/stores/cameraStore';
import { useSessionStore } from '@/stores/sharedStore';

type AIMotionConfig = Pick<SceneConfig, 'aiMotionEnabled' | 'aiMotionStyle'>;

export function useAIMotion(config: AIMotionConfig): void {
  const isFirstRender = useRef(true);
  const prevEnabled = useRef<boolean | null>(null);
  const prevStyle = useRef<string | null>(null);
  const currentPath = useRef<MotionPath | null>(null);
  const cachedInsight = useRef<SimpleInsight | null>(null);

  const currentImageUrl = useSessionStore((state) => state.result?.imageUrl);

  const { aiMotionEnabled, aiMotionStyle } = config;

  useEffect(() => {
    if (!aiMotionEnabled) {
      if (prevEnabled.current === true) {
        useCameraPoseStore.getState().stopMotion();
        currentPath.current = null;
      }

      prevEnabled.current = false;
      prevStyle.current = aiMotionStyle;
      isFirstRender.current = false;

      return;
    }

    const shouldAnalyze =
      isFirstRender.current ||
      prevEnabled.current !== aiMotionEnabled ||
      prevStyle.current !== aiMotionStyle;

    if (!shouldAnalyze) {
      prevEnabled.current = aiMotionEnabled;
      prevStyle.current = aiMotionStyle;
      isFirstRender.current = false;

      return;
    }

    const analyzeAndApply = async () => {
      let insight = cachedInsight.current;

      if (!insight && currentImageUrl) {
        try {
          const img = new Image();

          img.crossOrigin = 'anonymous';
          img.src = currentImageUrl;

          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
          });

          insight = lightSceneAnalyzer.analyze(img);
          cachedInsight.current = insight;

          console.info('[AI Motion] Scene analyzed:', insight);
        } catch {
          insight = {
            type: 'indoor',
            mood: 'neutral',
            suggestedMotion: aiMotionStyle,
            confidence: 0.5,
          };
        }
      }

      insight ??= {
        type: 'indoor',
        mood: 'neutral',
        suggestedMotion: aiMotionStyle,
        confidence: 0.5,
      };

      const cameraState = useCameraPoseStore.getState();
      const currentPose = cameraState.pose;

      const effectiveInsight = {
        ...insight,
        suggestedMotion: aiMotionStyle,
      };

      const path = smartMotionEngine.generatePath(effectiveInsight, currentPose, 15);

      currentPath.current = path;

      const motionType = mapStyleToMotionType(aiMotionStyle, insight);

      cameraState.startMotion(motionType);

      getEventBus().emit(
        'motion:ai-path-generated' as never,
        {
          path,
          insight,
          params: {
            recommendedDistance: smartMotionEngine.getRecommendedCameraDistance(insight),
          },
        } as never
      );

      console.info('[AI Motion] Path generated:', {
        style: aiMotionStyle,
        sceneType: insight.type,
        mood: insight.mood,
        waypointCount: path.waypoints.length,
      });
    };

    void analyzeAndApply();

    prevEnabled.current = aiMotionEnabled;
    prevStyle.current = aiMotionStyle;
    isFirstRender.current = false;
  }, [aiMotionEnabled, aiMotionStyle, currentImageUrl]);
}

function mapStyleToMotionType(
  style: SceneConfig['aiMotionStyle'],
  insight: SimpleInsight
): CameraMotionType {
  if (insight.mood === 'dark') {
    return CameraMotionType.DOLLY_ZOOM;
  }

  if (insight.type === 'portrait') {
    return CameraMotionType.ARC;
  }

  switch (style) {
    case 'cinematic':
      return insight.type === 'nature' ? CameraMotionType.FLY_BY : CameraMotionType.ORBIT;
    case 'dynamic':
      return CameraMotionType.SPIRAL;
    case 'focus':
      return CameraMotionType.DOLLY_ZOOM;
    case 'exploration':
      return CameraMotionType.ORBIT;
    default:
      return CameraMotionType.ORBIT;
  }
}
