import { ArrowRight, Image as ImageIcon, Link as LinkIcon, Upload, X } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';

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
    <TechCard className="w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="mb-2">
          <HexIcon active>
            <ImageIcon className="w-8 h-8" />
          </HexIcon>
        </div>

        {!showUrlInput ? (
          <>
            <div className="space-y-4 pt-4">
              <h2 className="text-4xl font-bold text-white font-orbitron tracking-[0.2em] uppercase glow-text drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                DATA IMPORT
              </h2>
              <div className="flex flex-col gap-1">
                <p className="text-cyan-500 font-tech text-xs tracking-[0.3em] uppercase opacity-90">
                  SYSTEM READY FOR INGESTION
                </p>
                <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mt-2" />
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-zinc-300 text-base font-medium max-w-xs mx-auto leading-relaxed">
                  支持 4K 超清视频与全景照片
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-mono">
                  AI 深度估计技术将把它们转化为交互式 3D 场景
                </p>
              </div>
            </div>

            <div className="relative group w-full max-w-sm pt-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative">
                {/* Border Effect */}
                <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-lg group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5 transition-all duration-300 pointer-events-none" />

                <input
                  accept={acceptedFormats}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={onFileUpload}
                  type="file"
                />

                <div className="w-full py-10 px-6 bg-zinc-950/50 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-4 transition-all z-10">
                  <div className="p-4 rounded-full bg-zinc-800/50 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-zinc-400 transition-all duration-300 ring-1 ring-white/5 group-hover:ring-cyan-500/30">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="tracking-[0.2em] uppercase font-orbitron text-sm text-white group-hover:text-cyan-400 transition-colors">
                      INITIALIZE UPLOAD
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400">
                      DROP FILE OR CLICK TO SCAN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-6 w-full opacity-80 hover:opacity-100 transition-opacity">
              <button
                className="group flex items-center gap-2 px-6 py-2 rounded-full border border-white/5 hover:border-cyan-500/30 bg-white/5 hover:bg-cyan-950/30 transition-all duration-300"
                onClick={() => {
                  setShowUrlInput(true);
                }}
              >
                <LinkIcon className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300" />
                <span className="font-mono text-[10px] tracking-widest text-zinc-400 group-hover:text-cyan-200">
                  LOAD FROM URL
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white font-orbitron tracking-wider">
                NETWORK LINK
              </h2>
              <button
                className="text-zinc-500 hover:text-red-400 transition-colors"
                onClick={() => {
                  setShowUrlInput(false);
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-amber-500/80 mb-2 text-left font-mono">
              {'>'} WAITING FOR INPUT STREAM...
            </p>

            <div className="flex gap-0">
              <input
                className="flex-1 bg-zinc-950/50 border border-white/10 border-r-0 rounded-l-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono placeholder:text-zinc-600"
                onChange={(e) => {
                  setUrlInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void onUrlSubmit();
                  }
                }}
                placeholder="Protocol://resource_path..."
                type="text"
                value={urlInput}
              />
              <button
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 rounded-r-sm flex items-center justify-center btn-cyber border border-cyan-500"
                onClick={() => {
                  void onUrlSubmit();
                }}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[10px] text-zinc-600 mt-4 text-left font-mono">
              Supported Formats: MP4, MOV, MKV, AVI, M3U8
            </p>
          </div>
        )}
      </div>
    </TechCard>
  )
);

UploadPanel.displayName = 'UploadPanel';
