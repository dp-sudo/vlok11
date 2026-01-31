import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

import { useCameraInput } from '@/features/camera/hooks/useCameraInput';
import { useIsInteracting } from '@/stores/cameraStore';

export const useUserInteraction = (): boolean => {
  const { gl } = useThree();
  const containerRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    containerRef.current = gl.domElement;
  }, [gl]);

  useCameraInput(containerRef as React.RefObject<HTMLElement>, { enabled: true });

  return useIsInteracting();
};
