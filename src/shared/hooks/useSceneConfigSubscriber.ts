import { useEffect } from 'react';

import { getEventBus } from '@/core/EventBus';
import { SessionEvents } from '@/core/EventTypes';
import type { SceneConfig } from '@/shared/types';
import { useSceneStore } from '@/stores/sharedStore';

export function useSceneConfigSubscriber(): void {
  useEffect(() => {
    const eventBus = getEventBus();

    const unsubConfig = eventBus.on(SessionEvents.CONFIG_RECOMMENDED, (payload) => {
      const config = payload.config as Partial<SceneConfig>;

      useSceneStore.getState().setConfig(config);
    });

    const unsubReset = eventBus.on(SessionEvents.RESET_REQUESTED, () => {
      useSceneStore.getState().resetViewConfig();
    });

    return () => {
      unsubConfig();
      unsubReset();
    };
  }, []);
}
