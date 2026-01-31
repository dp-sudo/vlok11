import { useThree } from '@react-three/fiber';
import { memo, useEffect } from 'react';
import { ACESFilmicToneMapping } from 'three';

interface ToneMappingEffectProps {
  exposure: number;
}

export const ToneMappingEffect = memo(({ exposure }: ToneMappingEffectProps) => {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  return null;
});

ToneMappingEffect.displayName = 'ToneMappingEffect';
