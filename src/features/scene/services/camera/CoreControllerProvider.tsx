import { createContext, memo, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createLogger } from '@/core/Logger';
import { useCameraPoseStore } from '@/stores/cameraStore';

import { getCoreController } from './CoreController';

import type { CoreController } from '@/shared/types';
import type { ReactNode } from 'react';

export function useAnimationService() {
  const { controller, isReady } = useCoreController();

  return isReady ? controller?.animation : null;
}

export function useCameraService() {
  return useCameraPoseStore;
}

export function useCoreController(): CoreControllerContextValue {
  const context = useContext(CoreControllerContext);

  if (!context) {
    throw new Error('useCoreController must be used within CoreControllerProvider');
  }

  return context;
}

/**
 * 获取相机状态 store（用于输入/交互状态）
 * @returns useCameraPoseStore - zustand store hook，不是 service 实例
 */
export function useCameraInputStore() {
  return useCameraPoseStore;
}

/**
 * 获取相机状态 store（用于运动状态）
 * @returns useCameraPoseStore - zustand store hook，不是 service 实例
 */
export function useCameraMotionStore() {
  return useCameraPoseStore;
}

/**
 * @deprecated 请使用 useCameraInputStore()，命名更准确
 */
export function useInputService() {
  return useCameraPoseStore;
}

/**
 * @deprecated 请使用 useCameraMotionStore()，命名更准确
 */
export function useMotionService() {
  return useCameraPoseStore;
}

interface CoreControllerContextValue {
  controller: CoreController | null;
  isReady: boolean;
}
interface CoreControllerProviderProps {
  autoInit?: boolean;
  children: ReactNode;
}

const CoreControllerContext = createContext<CoreControllerContextValue>({
  controller: null,
  isReady: false,
});

// Track initialization state globally to prevent re-initialization loops
let isControllerInitialized = false;

export const CoreControllerProvider = memo(
  ({ children, autoInit = true }: CoreControllerProviderProps) => {
    const [isReady, setIsReady] = useState(isControllerInitialized);

    const controllerRef = useRef<CoreController | null>(null);
    const initAttemptedRef = useRef(false);

    useEffect(() => {
      if (!autoInit) {
        return;
      }

      // Prevent re-initialization if already initialized
      if (isControllerInitialized) {
        controllerRef.current = getCoreController();
        setIsReady(true);

        return;
      }

      // Prevent multiple init attempts
      if (initAttemptedRef.current) {
        return;
      }
      initAttemptedRef.current = true;

      const controller = getCoreController();

      controllerRef.current = controller;

      const init = async (): Promise<void> => {
        try {
          await controller.initialize();
          isControllerInitialized = true;
          setIsReady(true);
        } catch (error) {
          logger.error('Init failed', { error: String(error) });
        }
      };

      void init();

      return () => {
        // Don't dispose on unmount - controller is a singleton
        // setIsReady(false);
      };
    }, [autoInit]);

    const value = useMemo<CoreControllerContextValue>(
      () => ({
        controller: controllerRef.current,
        isReady,
      }),
      [isReady]
    );

    return (
      <CoreControllerContext.Provider value={value}>{children}</CoreControllerContext.Provider>
    );
  }
);
const logger = createLogger({ module: 'CoreControllerProvider' });

export { CoreControllerContext };

CoreControllerProvider.displayName = 'CoreControllerProvider';
