import { useEffect, useRef } from 'react';

import { createLogger } from '@/core/Logger';
import { loadImageDataFromUrl } from '@/shared/utils';

export function useDepthImageData(depthUrl: string): ImageData | null {
  const imageDataRef = useRef<ImageData | null>(null);

  useEffect(() => {
    let cancelled = false;

    imageDataRef.current = null;

    const load = async () => {
      try {
        const imageData = await loadImageDataFromUrl(depthUrl);

        if (cancelled) return;
        imageDataRef.current = imageData;
      } catch (e) {
        logger.warn('Depth image load failed', { error: String(e) });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [depthUrl]);

  return imageDataRef.current;
}

const logger = createLogger({ module: 'useDepthImageData' });
