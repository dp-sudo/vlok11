import { FolderOpen, Save } from 'lucide-react';
import React from 'react';

import { projectService } from '@/core/services/ProjectService';

export const TitleBar: React.FC = () => {
  return (
    <div className="h-12 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-between px-4 select-none z-[9999] fixed top-0 left-0 right-0 border-b border-white/5 shadow-md">
      <div className="flex h-full items-center gap-6">
        <div className="flex items-center gap-2 pl-1 group cursor-default">
           <img src="/icon.png" alt="Icon" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
           <span className="text-xs font-orbitron text-zinc-400 group-hover:text-white tracking-[0.2em] transition-all duration-300">
             IMMERSA <span className="text-amber-500 font-bold">3D</span>
           </span>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
              onClick={() => { projectService.openProject().catch(() => {}); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-transparent hover:border-cyan-500/30 transition-all duration-200 group"
            >
               <FolderOpen className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
               <span className="font-mono tracking-wider font-medium">OPEN</span>
            </button>
            <button 
              onClick={() => { projectService.saveProject().catch(() => {}); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-amber-300 hover:bg-amber-950/30 border border-transparent hover:border-amber-500/30 transition-all duration-200 group"
            >
               <Save className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
               <span className="font-mono tracking-wider font-medium">SAVE</span>
            </button>
        </div>
      </div>
    </div>
  );
};
