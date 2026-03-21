import { Html, useProgress } from '@react-three/drei';
import { memo } from 'react';

export const CanvasLoader = memo(() => {
  const { progress, active } = useProgress();

  if (!active && progress === 100) return null;

  return (
    <Html center zIndexRange={[100, 0]}>
      <output
        aria-label="加载3D场景"
        aria-live="polite"
        className="flex flex-col items-center justify-center pointer-events-none select-none"
      >
        <div aria-hidden="true" className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-t-2 border-r-2 border-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />

          {/* Inner pulsating dot */}
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
        </div>

        {/* Progress Text */}
        <div className="mt-4 text-cyan-400 font-mono text-sm tracking-widest uppercase flex flex-col items-center space-y-1 bg-black/40 px-3 py-1 rounded backdrop-blur-sm border border-cyan-900/50">
          <span>加载 3D 引擎</span>
          <span className="font-bold">{progress.toFixed(0)}%</span>
        </div>
      </output>
    </Html>
  );
});

CanvasLoader.displayName = 'CanvasLoader';
