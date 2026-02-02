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
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-transparent">
      <span className="text-[15px] font-bold text-zinc-100 tracking-wide font-tech">控制面板</span>
      <div className="flex items-center gap-1.5">
        <button
          className={`p-1.5 rounded-md transition-all disabled:opacity-50 ${isRecording ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30' : 'text-zinc-400 hover:text-cyan-400 hover:bg-white/5'}`}
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
        <button
          className="p-1.5 rounded-md text-zinc-400 hover:text-cyan-400 hover:bg-white/5 transition-all disabled:opacity-50"
          disabled={isExporting}
          onClick={onDownloadSnapshot}
          title="保存截图"
          type="button"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 rounded-md text-zinc-400 hover:text-cyan-400 hover:bg-white/5 transition-all disabled:opacity-50"
          disabled={isExporting}
          onClick={onExportScene}
          title="导出场景 (GLB)"
          type="button"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-zinc-700 mx-1" />
        <button
          className="p-1.5 rounded-md text-zinc-400 hover:text-cyan-400 hover:bg-white/5 transition-all disabled:opacity-50"
          disabled={isExporting}
          onClick={onReset}
          title="重置设置"
          type="button"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
);

ControlPanelHeader.displayName = 'ControlPanelHeader';

export type { ControlPanelHeaderProps };
