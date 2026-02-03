import { Circle, Download, Image as ImageIcon, RotateCcw, Square } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';

interface ControlPanelHeaderProps {
  isExporting: boolean;
  isRecording?: boolean;
  onDownloadSnapshot?: () => void;
  onExportScene?: () => void;
  onReset: () => void;
  onToggleRecording?: () => void;
}

export const ControlPanelHeader: React.FC<ControlPanelHeaderProps> = memo(
  ({ isExporting, isRecording, onToggleRecording, onDownloadSnapshot, onExportScene, onReset }) => (
    <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-cyan-500/20 shadow-lg shadow-black/20 relative overflow-hidden">
      {/* 顶部光效线条 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* 标题区域 */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-teal-500 rounded-full" />
        <span className="text-[15px] font-bold bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent tracking-wide">
          控制面板
        </span>
      </div>

      {/* 按钮组 */}
      <div className="flex items-center gap-1">
        {/* 录制按钮 */}
        <button
          className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isRecording
              ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30 ring-1 ring-red-500/50'
              : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
          }`}
          disabled={isExporting}
          onClick={onToggleRecording}
          title={isRecording ? '停止录制' : '开始录制(WebM)'}
          type="button"
        >
          {isRecording ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        {/* 截图按钮 */}
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isExporting}
          onClick={onDownloadSnapshot}
          title="保存截图"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* 导出按钮 */}
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isExporting}
          onClick={onExportScene}
          title="导出场景 (GLB)"
          type="button"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-slate-600 mx-1.5" />

        {/* 重置按钮 */}
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isExporting}
          onClick={onReset}
          title="重置设置"
          type="button"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
);

ControlPanelHeader.displayName = 'ControlPanelHeader';

export type { ControlPanelHeaderProps };
