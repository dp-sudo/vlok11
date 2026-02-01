import { useEffect, useRef } from 'react';

import { immersiveAudioManager } from '@/features/audio';
import type { SceneConfig } from '@/shared/types';

type AudioConfig = Pick<SceneConfig, 'immersiveAudioEnabled' | 'audioMood' | 'audioVolume'>;

export function useImmersiveAudio(config: AudioConfig): void {
  const isFirstRender = useRef(true);
  const prevAudioEnabled = useRef<boolean | null>(null);
  const prevMood = useRef<string | null>(null);
  const prevVolume = useRef<number | null>(null);

  const { immersiveAudioEnabled, audioMood, audioVolume } = config;

  useEffect(() => {
    if (!immersiveAudioEnabled) {
      if (prevAudioEnabled.current === true) {
        immersiveAudioManager.stop();
      }

      prevAudioEnabled.current = false;
      prevMood.current = audioMood;
      prevVolume.current = audioVolume;
      isFirstRender.current = false;

      return;
    }

    const shouldPlay =
      isFirstRender.current ||
      prevAudioEnabled.current !== immersiveAudioEnabled ||
      prevMood.current !== audioMood;

    const volumeChanged =
      prevVolume.current !== null && Math.abs(prevVolume.current - audioVolume) > 0.01;

    if (shouldPlay) {
      void immersiveAudioManager.play({
        mood: audioMood,
        volume: audioVolume,
      });
    } else if (volumeChanged && immersiveAudioManager.isPlaying()) {
      immersiveAudioManager.setVolume(audioVolume);
    }

    prevAudioEnabled.current = immersiveAudioEnabled;
    prevMood.current = audioMood;
    prevVolume.current = audioVolume;
    isFirstRender.current = false;
  }, [immersiveAudioEnabled, audioMood, audioVolume]);
}
