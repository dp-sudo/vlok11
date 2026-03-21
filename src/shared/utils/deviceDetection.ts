/**
 * Mobile Device Detection & Optimization
 * 移动端设备检测与优化
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  isLowEnd: boolean;
  pixelRatio: number;
  memory?: number;
  hardwareConcurrency?: number;
}

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isTouch: false,
      isLowEnd: false,
      pixelRatio: 1,
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /ipad|android.*tablet|playbook|silk/i.test(ua);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Detect low-end devices
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const { hardwareConcurrency } = navigator;
  const isLowEnd =
    (memory !== undefined && memory < 4) ||
    (hardwareConcurrency !== undefined && hardwareConcurrency < 4) ||
    /iphone 6|iphone 7|iphone 8|galaxy s[5-9]|pixel [1-3]/i.test(ua);

  // Get device pixel ratio (capped for performance)
  const pixelRatio = Math.min(window.devicePixelRatio || 1, isLowEnd ? 1.5 : 2);

  const capabilities: DeviceCapabilities = {
    isMobile,
    isTablet,
    isTouch,
    isLowEnd,
    pixelRatio,
  };

  if (memory !== undefined) capabilities.memory = memory;
  if (hardwareConcurrency !== undefined) capabilities.hardwareConcurrency = hardwareConcurrency;

  return capabilities;
}

/**
 * Get optimal rendering settings based on device
 */
export function getOptimalRenderSettings(): {
  pixelRatio: number;
  antialias: boolean;
  powerPreference: 'high-performance' | 'default';
  maxParticles: number;
  enableShadows: boolean;
} {
  const capabilities = detectDeviceCapabilities();

  return {
    pixelRatio: capabilities.pixelRatio,
    antialias: !capabilities.isLowEnd,
    powerPreference: capabilities.isLowEnd ? 'high-performance' : 'default',
    maxParticles: capabilities.isLowEnd ? 1000 : 5000,
    enableShadows: !capabilities.isMobile,
  };
}

/**
 * Check if device supports WebGL2
 */
export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement('canvas');

    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}
