import { cn } from '@/shared/utils/cn';
import React from 'react';

interface HexIconProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export const HexIcon = ({ children, className, active = false }: HexIconProps) => {
  return (
    <div className={cn("relative w-24 h-24 flex items-center justify-center", className)}>
      {/* Rotating Outer Hex */}
      <div className="absolute inset-0 border-[2px] border-zinc-700/30 w-full h-full animate-[spin_10s_linear_infinite]"
           style={{
             clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
           }} 
      />

      {/* Pulsing Inner Hex */}
      <div className={cn(
        "absolute w-20 h-20 border-[2px] transition-colors duration-300",
        active ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "border-zinc-600"
      )}
           style={{
             clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
           }}
      >
          {/* Inner Fill */}
          <div className={cn(
              "absolute inset-1 opacity-20 transition-colors duration-300",
              active ? "bg-amber-500" : "bg-transparent"
          )} 
               style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
               }}
          />
      </div>

      {/* Icon Content */}
      <div className={cn(
          "relative z-10 transition-colors duration-300",
          active ? "text-amber-400" : "text-zinc-500"
      )}>
        {children}
      </div>
    </div>
  );
};
