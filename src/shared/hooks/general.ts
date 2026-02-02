import { useCallback, useEffect, useRef, useState } from 'react';

import { getEventBus } from '@/core/EventBus';
import {
  calculateMotion,
  calculateProgress,
  type MotionType as MotionLogicType,
} from '@/features/camera/logic/motion';
import { CAMERA, DEFAULT_FOV } from '@/shared/constants';
import type {
  BlendMode,
  CameraPose,
  MotionPoint,
  MotionResult,
  MotionType,
  SceneConfig,
} from '@/shared/types';
import { CameraMotionType } from '@/shared/types';
import { useCameraPoseStore } from '@/stores/cameraStore';
import { useSceneStore } from '@/stores/sharedStore';

const MOTION_PREVIEW = {
  DEFAULT_DURATION: 10,
  DEFAULT_SAMPLES: 100,
  DEFAULT_FOV,
  DEFAULT_POSITION_Z: CAMERA.INITIAL_DISTANCE,
};

const MOTION_TYPE_MAP: CameraMotionType[] = [
  CameraMotionType.STATIC,
  CameraMotionType.ORBIT,
  CameraMotionType.FLY_BY,
  CameraMotionType.SPIRAL,
  CameraMotionType.ARC,
  CameraMotionType.DOLLY_ZOOM,
];

export function useKeyboardShortcuts(config: KeyboardShortcutConfig = {}) {
  const { enabled = true } = config;

  const setConfig = useSceneStore((s) => s.setConfig);
  const sceneConfig = useSceneStore((s) => s.config);

  const sceneConfigRef = useRef(sceneConfig);

  sceneConfigRef.current = sceneConfig;

  const configRef = useRef(config);

  configRef.current = config;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const ctx: KeyHandlerContext = {
        setConfig,
        currentConfig: sceneConfigRef.current,
        callbacks: configRef.current,
      };

      if (ctrl) {
        handleCtrlShortcut(key, e, ctx);

        return;
      }

      if (handleMotionTypeKey(key, ctx)) return;

      handleSingleKeyShortcut(key, e, ctx);
    },
    [setConfig]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
export function useMotionEngine(): MotionEngineReturn {
  const motionState = useCameraPoseStore((s) => s.motion);
  const startMotion = useCameraPoseStore((s) => s.startMotion);
  const stopMotion = useCameraPoseStore((s) => s.stopMotion);
  const pauseMotion = useCameraPoseStore((s) => s.pauseMotion);
  const resumeMotion = useCameraPoseStore((s) => s.resumeMotion);

  const [blendModeState, setBlendModeState] = useState<BlendMode>('additive');
  const lastResultRef = useRef<MotionResult | null>(null);

  const state: MotionEngineState = {
    isActive: motionState.isActive,
    isPaused: motionState.isPaused,
    motionType: motionState.type as MotionType,
    progress: motionState.progress,
    blendMode: blendModeState,
  };

  const start = useCallback(
    (type: MotionType) => {
      startMotion(type);
    },
    [startMotion]
  );

  const stop = useCallback(() => {
    stopMotion();
    lastResultRef.current = null;
  }, [stopMotion]);

  const pause = useCallback(() => {
    pauseMotion();
  }, [pauseMotion]);

  const resume = useCallback(() => {
    resumeMotion();
  }, [resumeMotion]);

  const updateBlendMode = useCallback((mode: BlendMode) => {
    setBlendModeState(mode);
  }, []);

  const calculate = useCallback(
    (time: number, basePose: CameraPose): MotionResult | null => {
      if (!state.isActive || state.isPaused) return lastResultRef.current;

      const progress = calculateProgress(time, motionState.startTime, 1);
      const result = calculateMotion(motionState.type as MotionLogicType, progress, basePose);

      if (result) lastResultRef.current = result;

      return result;
    },
    [state.isActive, state.isPaused, motionState.startTime, motionState.type]
  );

  const generatePreview = useCallback(
    (duration = DEFAULT_PREVIEW_DURATION, samples = DEFAULT_PREVIEW_SAMPLES): MotionPoint[] => {
      const points: MotionPoint[] = [];
      const basePose: CameraPose = {
        position: { x: 0, y: 0, z: MOTION_PREVIEW.DEFAULT_POSITION_Z },
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        fov: MOTION_PREVIEW.DEFAULT_FOV,
      };

      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * duration;
        const progress = t / duration;
        const result = calculateMotion(motionState.type as MotionLogicType, progress, basePose);

        if (result) {
          points.push({
            position: result.position,
            target: result.target,
            fov: result.fov,
            time: t,
          });
        }
      }

      return points;
    },
    [motionState.type]
  );

  return {
    ...state,
    start,
    stop,
    pause,
    resume,
    setBlendMode: updateBlendMode,
    calculate,
    generatePreview,
  };
}
export function useSceneConfig() {
  const config = useSceneStore((state) => state.config);
  const setConfig = useSceneStore((state) => state.setConfig);
  const resetConfig = useSceneStore((state) => state.resetConfig);
  const resetViewConfig = useSceneStore((state) => state.resetViewConfig);

  const updateConfig = useCallback(
    <K extends keyof SceneConfig>(key: K, value: SceneConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [setConfig]
  );

  return { config, setConfig, updateConfig, resetConfig, resetViewConfig };
}

export interface KeyboardShortcutConfig {
  enabled?: boolean;
  onExport?: () => void;
  onResetView?: () => void;
  onSnapshot?: () => void;
  onToggleFullscreen?: () => void;
  onTogglePlay?: () => void;
  onToggleWireframe?: () => void;
}
interface KeyHandlerContext {
  callbacks: KeyboardShortcutConfig;
  currentConfig: SceneConfig;
  setConfig: (config: Partial<SceneConfig>) => void;
}
export interface MotionEngineReturn extends MotionEngineState {
  calculate: (time: number, basePose: CameraPose) => MotionResult | null;
  generatePreview: (duration?: number, samples?: number) => MotionPoint[];
  pause: () => void;
  resume: () => void;
  setBlendMode: (mode: BlendMode) => void;
  start: (type: MotionType) => void;
  stop: () => void;
}
export interface MotionEngineState {
  blendMode: BlendMode;
  isActive: boolean;
  isPaused: boolean;
  motionType: MotionType;
  progress: number;
}

export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
} as const;
const DEFAULT_PREVIEW_DURATION = MOTION_PREVIEW.DEFAULT_DURATION;
const DEFAULT_PREVIEW_SAMPLES = MOTION_PREVIEW.DEFAULT_SAMPLES;
const handleCtrlShortcut = (key: string, e: KeyboardEvent, ctx: KeyHandlerContext): boolean => {
  if (key === 's') {
    e.preventDefault();
    ctx.callbacks.onSnapshot?.();

    return true;
  }
  if (key === 'e') {
    e.preventDefault();
    ctx.callbacks.onExport?.();

    return true;
  }

  return false;
};
const handleMotionTypeKey = (key: string, ctx: KeyHandlerContext): boolean => {
  if (key >= '1' && key <= '6') {
    const index = parseInt(key, 10) - 1;
    const motionType = MOTION_TYPE_MAP[index];

    if (motionType !== undefined) {
      ctx.setConfig({ cameraMotionType: motionType });
    }

    return true;
  }

  return false;
};
const handleSingleKeyShortcut = (key: string, e: KeyboardEvent, ctx: KeyHandlerContext): void => {
  const { setConfig, currentConfig, callbacks } = ctx;

  switch (key) {
    case ' ':
      e.preventDefault();
      callbacks.onTogglePlay?.();
      break;
    case 'r':
      e.preventDefault();
      callbacks.onResetView?.();
      setConfig({ cameraMotionType: CameraMotionType.STATIC });
      getEventBus().emit('keyboard:reset-view', {});
      break;
    case 'w':
      e.preventDefault();
      callbacks.onToggleWireframe?.();
      setConfig({ wireframe: !currentConfig.wireframe });
      break;
    case 'f':
      e.preventDefault();
      callbacks.onToggleFullscreen?.();
      break;
    case 'g':
      e.preventDefault();
      setConfig({ showGrid: !currentConfig.showGrid });
      break;
    case 'escape':
      setConfig({ cameraMotionType: CameraMotionType.STATIC });
      getEventBus().emit('keyboard:escape', {});
      break;
  }
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, ...deps]
  );
};
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return window.matchMedia(query).matches;

    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};
export const useResponsive = () => {
  const isMobile = useMediaQuery(breakpoints.mobile);
  const isTablet = useMediaQuery(breakpoints.tablet);
  const isDesktop = useMediaQuery(breakpoints.desktop);
  const isPortrait = useMediaQuery(breakpoints.portrait);
  const prefersReducedMotion = useMediaQuery(breakpoints.reducedMotion);
  const prefersDark = useMediaQuery(breakpoints.dark);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape: !isPortrait,
    prefersReducedMotion,
    prefersDark,
    isTouchDevice: isMobile || isTablet,
  };
};
export const useThrottledCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= limit) {
        callbackRef.current(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () => {
            callbackRef.current(...args);
            lastRan.current = Date.now();
          },
          limit - (now - lastRan.current)
        );
      }
    },
    [limit]
  );
};
export const useWindowSize = () => {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useCallback(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return size;
};

export {
  useAnimationService,
  useCameraService,
  useCoreController,
  useInputService,
  useMotionService,
} from '@/features/scene/services/camera';
export {
  useCameraController,
  type CameraControllerOptions,
  type CameraControllerReturn,
} from '@/shared/hooks/useCameraController';
