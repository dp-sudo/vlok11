import { useEffect, useRef, useState } from 'react';
import { GaussianSplattingRenderer } from './GaussianSplattingRenderer';

interface Props {
  className?: string;
}

export function NeuralRenderView({ className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GaussianSplattingRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建渲染器
    const renderer = new GaussianSplattingRenderer({
      container: containerRef.current,
      backgroundColor: 0x050508,
    });

    rendererRef.current = renderer;

    // 模拟加载过程
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setIsLoading(false);
      }
      setProgress(Math.min(100, currentProgress));
    }, 100);

    // 生成演示场景
    renderer.generateDemoScene();

    return () => {
      clearInterval(interval);
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 渲染容器 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 加载界面 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
          <div className="text-center">
            {/* 环形进度 */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 100 100"
                role="img"
                aria-label="加载中"
              >
                <title>加载进度</title>
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.51} 251`}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
              </div>
            </div>

            <h3 className="text-xl font-light text-white mb-2">初始化神经渲染引擎</h3>
            <p className="text-zinc-400 text-sm">Loading Neural Rendering Engine...</p>
          </div>
        </div>
      )}

      {/* 控制提示 */}
      {!isLoading && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 
                        px-6 py-3 bg-zinc-900/80 backdrop-blur-md 
                        rounded-full border border-zinc-700/50
                        flex items-center gap-4 text-sm text-zinc-300"
        >
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs">🖱️ 拖拽</kbd>
            旋转视角
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs">⚲ 滚轮</kbd>
            缩放
          </span>
        </div>
      )}
    </div>
  );
}
