import { useCallback, useMemo, useRef } from 'react';

import { CameraMotionType, MirrorMode, ProjectionMode, RenderStyle } from '@/shared/types';

import type { SceneConfig } from '@/shared/types';

export function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

export function useThrottle<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );
}

export function useStableCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(((...args: Parameters<T>) => callbackRef.current(...args)) as T, []);
}

export function useSceneConfigDerived(config: SceneConfig) {
  const isAutoMotion = useMemo(
    () =>
      [
        CameraMotionType.ORBIT,
        CameraMotionType.FLY_BY,
        CameraMotionType.SPIRAL,
        CameraMotionType.DOLLY_ZOOM,
        CameraMotionType.ARC,
        CameraMotionType.TRACKING,
      ].includes(config.cameraMotionType),
    [config.cameraMotionType]
  );

  const isImmersiveProjection = useMemo(
    () =>
      [
        ProjectionMode.INFINITE_BOX,
        ProjectionMode.CORNER,
        ProjectionMode.CUBE,
        ProjectionMode.PANORAMA,
        ProjectionMode.SPHERE,
        ProjectionMode.DOME,
        ProjectionMode.CYLINDER,
      ].includes(config.projectionMode),
    [config.projectionMode]
  );

  const hasMirror = useMemo(() => config.mirrorMode !== MirrorMode.NONE, [config.mirrorMode]);

  const isSpecialRenderStyle = useMemo(
    () => config.renderStyle !== RenderStyle.NORMAL,
    [config.renderStyle]
  );

  const hasActiveEffects = useMemo(
    () => config.enableParticles || config.enableNakedEye3D || hasMirror || isSpecialRenderStyle,
    [config.enableParticles, config.enableNakedEye3D, hasMirror, isSpecialRenderStyle]
  );

  return {
    isAutoMotion,
    isImmersiveProjection,
    hasMirror,
    isSpecialRenderStyle,
    hasActiveEffects,
  };
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const previous = ref.current;

  ref.current = value;

  return previous;
}

export function useIsFirstRender(): boolean {
  const isFirstRef = useRef(true);

  if (isFirstRef.current) {
    isFirstRef.current = false;

    return true;
  }

  return false;
}

export function useIsMounted(): () => boolean {
  const mountedRef = useRef(false);

  const isMounted = useCallback(() => mountedRef.current, []);

  useMemo(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return isMounted;
}

export function useLazyInit<T>(factory: () => T): T {
  const valueRef = useRef<T | null>(null);

  valueRef.current ??= factory();

  return valueRef.current;
}

export function useShallowMemo<T extends Record<string, unknown>>(obj: T): T {
  const ref = useRef<T>(obj);

  const isEqual = useMemo(() => {
    const keys = Object.keys(obj);
    const prevKeys = Object.keys(ref.current);

    if (keys.length !== prevKeys.length) return false;

    return keys.every((key) => Object.is(obj[key], ref.current[key]));
  }, [obj]);

  if (!isEqual) {
    ref.current = obj;
  }

  return ref.current;
}
