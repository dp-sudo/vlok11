import { ArrowRight, Image as ImageIcon, Link as LinkIcon, Upload, X } from 'lucide-react';
import type React from 'react';
import { memo, useEffect, useRef } from 'react';

import { HexIcon } from '@/shared/components/ui/HexIcon';
import { TechCard } from '@/shared/components/ui/TechCard';

interface UploadPanelProps {
  acceptedFormats: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: () => void | Promise<void>;
  setShowUrlInput: (show: boolean) => void;
  setUrlInput: (url: string) => void;
  showUrlInput: boolean;
  urlInput: string;
}

// 3D Perspective Grid & Glitch Particles
const HolographicGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    
    // Resize Observer to handle window resize correctly since it's now full screen
    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    handleResize(); // Initial size

    let { width, height } = canvas;

    // Grid Perspective Vars
    let time = 0;
    const speed = 0.5;
    
    // Particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.1
    }));

    let animationFrameId: number;

    const render = () => {
        // Ensure dimensions are up to date if they drift
        ({ width, height } = canvas);

        ctx.clearRect(0, 0, width, height);
        
        time += speed;

        // 1. Draw Perspective Grid (Bottom half)
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'; // Cyan-500 low opacity
        ctx.lineWidth = 1;
        
        const horizonY = height * 0.4;
        const gridSpacing = 40;
        
        ctx.beginPath();
        // Vertical perspective lines
        for (let x = 0; x <= width; x += gridSpacing * 0.8 * (width/1000)) { 
             // Converge to center at horizon
            const centerX = width / 2;
            const xOffset = x - centerX;
            
            // Adjust perspective intensity
            ctx.moveTo(centerX + xOffset * 0.05, horizonY); 
            ctx.lineTo(x, height);
        }
        
        // Horizontal moving lines
        const loopHeight = height - horizonY;
        const offset = time % gridSpacing;
        
        for (let y = horizonY; y < height; y += gridSpacing) {
            let currentY = y + offset;

            if (currentY > height) currentY -= loopHeight;
             
            // Fade out near horizon
            const alpha = Math.max(0, (currentY - horizonY) / loopHeight);

            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.2})`;

            ctx.beginPath();
            ctx.moveTo(0, currentY);
            ctx.lineTo(width, currentY);
            ctx.stroke();
        }
        ctx.stroke();

        // 2. Rising Data Particles (Top half + Over grid)
        
        particles.forEach(p => {
             p.y -= p.speed;
             if (p.y < 0) {
                 p.y = height;
                 p.x = Math.random() * width;
             }
             
             // Draw diamond shape
             const alpha = Math.min(1, p.opacity); // Consistent opacity

             ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
             
             ctx.beginPath();
             ctx.moveTo(p.x, p.y - p.size);
             ctx.lineTo(p.x + p.size, p.y);
             ctx.lineTo(p.x, p.y + p.size);
             ctx.lineTo(p.x - p.size, p.y);
             ctx.fill();
        });

        // 3. Random Glitch Blocks - infrequent
        if (Math.random() > 0.98) {
            const y = Math.random() * height;

            ctx.fillStyle = `rgba(6, 182, 212, ${Math.random() * 0.05})`;
            ctx.fillRect(0, y, width, Math.random() * 5 + 1);
        }

        animationFrameId = requestAnimationFrame(render);
    };

    render();

    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none mix-blend-screen" />;
};

export const UploadPanel = memo(
  ({
    showUrlInput,
    setShowUrlInput,
    urlInput,
    setUrlInput,
    onFileUpload,
    onUrlSubmit,
    acceptedFormats,
  }: UploadPanelProps) => (
    <>
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        {/* Dynamic Aurora Background - Global */}
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 opacity-40">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_25s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(6,182,212,0.1)_60deg,transparent_120deg)] mix-blend-screen" />
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_35s_linear_infinite_reverse] bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,rgba(167,139,250,0.1)_60deg,transparent_120deg)] mix-blend-screen" />
        </div>
        <HolographicGrid />
      </div>

      <TechCard className="w-full max-w-lg mx-auto relative overflow-hidden group/card shadow-[0_0_80px_rgba(6,182,212,0.15)] border border-cyan-500/20 backdrop-blur-xl bg-zinc-900/60 z-10">
        <div className="flex flex-col items-center text-center space-y-6 relative z-10 p-4">
          <div className="mb-2 relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            <HexIcon active>
              <ImageIcon className="w-8 h-8 relative z-10 text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            </HexIcon>
          </div>

        {!showUrlInput ? (
          <>
            <div className="space-y-4 pt-4">
              <h2 className="text-4xl font-bold text-white font-orbitron tracking-[0.2em] glow-text drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-[pulse_4s_ease-in-out_infinite]">
                DATA IMPORT
              </h2>
              <div className="flex flex-col gap-1">
                <p className="text-cyan-400 font-tech text-xs tracking-[0.4em] uppercase opacity-90 typing-effect">
                  SYSTEM READY FOR INGESTION
                </p>
                <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-3 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-zinc-200 text-lg font-medium max-w-xs mx-auto leading-relaxed font-sans tracking-wide">
                  支持 4K 超清视频与全景照片
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-mono">
                  {'>'} AI 深度估计技术将把它们转化为交互式 3D 场景
                </p>
              </div>
            </div>

            <div className="relative group w-full max-w-sm pt-6 pb-2">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-cyan-500/30 rounded-xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500 animate-[pulse_3s_ease-in-out_infinite]" />
              <div className="relative">
                {/* Border Effect */}
                <div className="absolute inset-0 border-2 border-dashed border-cyan-500/20 rounded-xl group-hover:border-cyan-400/80 group-hover:bg-cyan-900/10 transition-all duration-300 pointer-events-none" />
                
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-500 rounded-tl-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-500 rounded-br-sm opacity-50 group-hover:opacity-100 transition-opacity" />

                <input
                  accept={acceptedFormats}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={onFileUpload}
                  type="file"
                />

                <div className="w-full py-12 px-6 bg-zinc-950/80 backdrop-blur-md rounded-xl flex flex-col items-center justify-center gap-5 transition-all z-10">
                  <div className="p-4 rounded-full bg-zinc-900 group-hover:bg-cyan-500 text-zinc-500 group-hover:text-white transition-all duration-300 ring-1 ring-white/10 group-hover:ring-cyan-300 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] group-hover:scale-110">
                    <Upload className="w-8 h-8 transition-transform group-hover:-translate-y-1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="tracking-[0.2em] font-orbitron text-sm text-zinc-300 group-hover:text-white transition-colors">
                      INITIALIZE UPLOAD
                    </span>
                    <span className="text-[10px] font-mono text-cyan-700 group-hover:text-cyan-400/80 tracking-widest">
                      [ DROP FILE OR CLICK TO SCAN ]
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-4 w-full opacity-70 hover:opacity-100 transition-opacity">
              <button
                className="group flex items-center gap-2 px-6 py-2 rounded-full border border-white/5 hover:border-cyan-500/50 bg-white/5 hover:bg-cyan-950/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                onClick={() => {
                  setShowUrlInput(true);
                }}
              >
                <LinkIcon className="w-3 h-3 text-cyan-600 group-hover:text-cyan-300 transition-colors" />
                <span className="font-mono text-[10px] tracking-widest text-zinc-500 group-hover:text-cyan-200">
                  LOAD FROM REMOTE URL
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between mb-8 border-b border-cyan-900/30 pb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                 <h2 className="text-xl font-bold text-white font-orbitron tracking-wider glow-text">
                  NETWORK LINK
                </h2>
              </div>
              
              <button
                className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-950/30 p-2 rounded-full transition-all duration-200"
                onClick={() => {
                  setShowUrlInput(false);
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-900/50 p-4 rounded-lg border border-white/5 mb-6">
                <p className="text-xs text-cyan-400/80 mb-2 text-left font-mono flex items-center gap-2">
                <span className="animate-pulse">_</span> WAITING FOR INPUT STREAM...
                </p>

                <div className="flex gap-0 shadow-lg">
                <input
                    className="flex-1 bg-black/40 border border-zinc-700 border-r-0 rounded-l-md px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-black/60 font-mono placeholder:text-zinc-700 transition-all"
                    onChange={(e) => {
                    setUrlInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        void onUrlSubmit();
                    }
                    }}
                    placeholder="https://example.com/media..."
                    type="text"
                    value={urlInput}
                />
                <button
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-r-md flex items-center justify-center border border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
                    onClick={() => {
                    void onUrlSubmit();
                    }}
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
                </div>
            </div>

            <p className="text-[10px] text-zinc-600 text-center font-mono border-t border-dashed border-zinc-800 pt-4">
              Supported Protocols: HTTP / HTTPS / IPFS
              <br/>
              Formats: MP4, MOV, MKV, AVI
            </p>
          </div>
        )}
      </div>
    </TechCard>
    </>
  )
);

UploadPanel.displayName = 'UploadPanel';
