import type React from 'react';
import { cn } from '@/shared/utils/cn';

interface TechCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'scanner';
}

export const TechCard = ({
  children,
  className,
  variant: _variant = 'default',
  ...props
}: TechCardProps) => {
  return (
    <div className={cn('relative group', className)} {...props}>
      {/* 1. Main Background Shape with Clip Path (Chamfered) */}
      <div
        className={cn(
          'absolute inset-0 bg-zinc-950/80 backdrop-blur-xl border border-white/10',
          'clip-tech-card shadow-[0_0_30px_rgba(0,0,0,0.5)]'
        )}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)', // Bottom-right cut
        }}
      />

      {/* 2. Grid Texture Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,24,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />

      {/* 3. Decorative Border Lines */}
      {/* Top Left Accent */}
      <div className="absolute top-0 left-0 w-20 h-[2px] bg-cyan-500/50 z-10 box-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
      <div className="absolute top-0 left-0 w-[2px] h-10 bg-cyan-500/50 z-10" />

      {/* Bottom Right Cut Accent */}
      <div className="absolute bottom-[-1px] right-[19px] w-[28px] h-[2px] bg-cyan-500/50 z-10 origin-right rotate-[-45deg]" />

      {/* 4. Content Container */}
      <div className="relative z-20 p-6">{children}</div>
    </div>
  );
};
