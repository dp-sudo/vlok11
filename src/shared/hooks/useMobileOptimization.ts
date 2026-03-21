/**
 * Mobile Optimization Hook
 * 移动端优化 Hook
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type DeviceCapabilities,
  detectDeviceCapabilities,
  getOptimalRenderSettings,
} from '../utils/deviceDetection';

export interface MobileOptimizations {
  device: DeviceCapabilities;
  renderSettings: ReturnType<typeof getOptimalRenderSettings>;
  reducedMotion: boolean;
  prefersDarkMode: boolean;
}

export function useMobileOptimization(): MobileOptimizations {
  const [device, setDevice] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = useState(true);

  // 监听系统偏好变化 - reduced motion
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setReducedMotion(motionQuery.matches);

    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    motionQuery.addEventListener('change', motionHandler);

    return () => {
      motionQuery.removeEventListener('change', motionHandler);
    };
  }, []);

  // 监听系统偏好变化 - dark mode
  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    setPrefersDarkMode(darkQuery.matches);

    const darkHandler = (e: MediaQueryListEvent) => setPrefersDarkMode(e.matches);

    darkQuery.addEventListener('change', darkHandler);

    return () => {
      darkQuery.removeEventListener('change', darkHandler);
    };
  }, []);

  // 监听屏幕方向变化
  useEffect(() => {
    const handleOrientationChange = () => {
      setDevice(detectDeviceCapabilities());
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // 监听窗口大小变化（带防抖）
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setDevice(detectDeviceCapabilities());
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // 使用useMemo缓存renderSettings，避免每次渲染时重新计算
  const renderSettings = useMemo(() => getOptimalRenderSettings(), []);

  return {
    device,
    renderSettings,
    reducedMotion,
    prefersDarkMode,
  };
}

/**
 * Hook to handle mobile gestures
 */
export function useMobileGestures(containerRef: React.RefObject<HTMLElement>) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(
    null
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      setIsSwiping(true);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
    setSwipeDirection(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchEnd]);

  return { isSwiping, swipeDirection };
}
