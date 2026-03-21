import { BookOpen, Bot, ChevronDown, FolderOpen, Save, Settings } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { createLogger } from '@/core/Logger';
import { projectService } from '@/core/services/ProjectService';

const logger = createLogger({ module: 'TitleBar' });

interface TitleBarProps {
  onOpenModelManager?: () => void;
  onOpenSettings?: () => void;
}

const AppLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="应用图标"
    role="img"
    className="opacity-90 group-hover:opacity-100 transition-opacity filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
  >
    <title>应用图标</title>
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="#06b6d4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-[pulse_3s_ease-in-out_infinite]"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke="#a78bfa"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 7V17L12 22V12L2 7Z"
      stroke="#06b6d4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.5"
    />
    <path
      d="M22 7V17L12 22V12L22 7Z"
      stroke="#a78bfa"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.5"
    />
    <circle
      cx="12"
      cy="12"
      r="2"
      fill="#22d3ee"
      className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
    />
  </svg>
);

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenModelManager, onOpenSettings }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-12 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-between px-2 md:px-4 select-none z-[9999] fixed top-0 left-0 right-0 border-b border-white/5 shadow-md">
      <div className="flex h-full items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2 md:gap-3 pl-1 group cursor-default">
          <AppLogo />
          <span className="hidden sm:inline text-xs font-orbitron text-zinc-400 group-hover:text-white tracking-[0.2em] transition-all duration-300">
            IMMERSA <span className="text-cyan-400 font-bold">3D</span>
          </span>
          <span className="sm:hidden text-xs font-orbitron text-zinc-400 group-hover:text-white tracking-wider transition-all duration-300">
            <span className="text-cyan-400 font-bold">3D</span>
          </span>
        </div>

        {/* Desktop: Show all buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              projectService.openProject().catch((err) => {
                logger.error('打开项目失败', { error: err });
              });
            }}
            data-testid="open-project-button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-transparent hover:border-cyan-500/30 transition-all duration-200 group"
          >
            <FolderOpen className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
            <span className="font-mono tracking-wider font-medium">打开</span>
          </button>
          <button
            type="button"
            onClick={() => {
              projectService.saveProject().catch((err) => {
                logger.error('保存项目失败', { error: err });
              });
            }}
            data-testid="save-project-button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-purple-300 hover:bg-purple-950/30 border border-transparent hover:border-purple-500/30 transition-all duration-200 group"
          >
            <Save className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
            <span className="font-mono tracking-wider font-medium">保存</span>
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          <button
            type="button"
            onClick={onOpenModelManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-200 group"
          >
            <Bot className="w-4 h-4" />
            <span className="font-mono tracking-wider font-medium">模型管理</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-200 group"
          >
            <Settings className="w-4 h-4" />
            <span className="font-mono tracking-wider font-medium">设置</span>
          </button>

          <button
            type="button"
            onClick={() => window.open('https://ai.google.dev/docs', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-200 group"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-mono tracking-wider font-medium">文档</span>
          </button>
        </div>

        {/* Mobile: Dropdown menu */}
        <div className="md:hidden relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent transition-all duration-200"
          >
            <span className="font-mono tracking-wider font-medium">菜单</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                tabIndex={-1}
                aria-label="关闭菜单"
              />
              <div className="absolute top-full left-0 mt-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 min-w-[160px]">
                <button
                  type="button"
                  onClick={() => {
                    projectService.openProject().catch((err) => {
                      logger.error('打开项目失败', { error: err });
                    });
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="font-mono">打开</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    projectService.saveProject().catch((err) => {
                      logger.error('保存项目失败', { error: err });
                    });
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:text-purple-300 hover:bg-purple-950/30 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span className="font-mono">保存</span>
                </button>
                <div className="h-px bg-zinc-800 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onOpenModelManager?.();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  <span className="font-mono">模型管理</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings?.();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-mono">设置</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://ai.google.dev/docs', '_blank');
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="font-mono">文档</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
