import { Canvas } from '@react-three/fiber';
import { memo, type ReactNode } from 'react';

import { RENDERER } from '@/shared/constants';
import { useSceneStore } from '@/stores/sharedStore';

import { useColorGrade } from '../hooks/useColorGrade';
import { ToneMappingEffect } from './effects';

interface SceneCanvasProps {
  children: ReactNode;
  className?: string;
}

export const SceneCanvas = memo(({ children, className }: SceneCanvasProps) => {
  const config = useSceneStore((state) => state.config);
  const { enableVignette, exposure } = config;

  // 复用 useColorGrade hook，消除重复的 useFilterStyle 实现
  const filterStyle = useColorGrade();

  return (
    <div
      className={`w-full h-full bg-black relative rounded-lg overflow-hidden shadow-2xl border border-zinc-800 transition-all duration-200 ${className ?? ''}`}
      style={filterStyle}
    >
      {enableVignette ? (
        <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)] mix-blend-multiply" />
      ) : null}

      <Canvas dpr={RENDERER.DPR} gl={{ preserveDrawingBuffer: true }} shadows>
        <ToneMappingEffect exposure={exposure} />
        {children}
      </Canvas>
    </div>
  );
});

SceneCanvas.displayName = 'SceneCanvas';
