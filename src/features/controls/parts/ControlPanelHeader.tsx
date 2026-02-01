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
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-900/50">
      <span className="text-xs font-medium text-zinc-300 tracking-wide">控制面板</span>
      <div className="flex items-center gap-1">
        <button
          className={`p-1.5 rounded-md transition-all disabled:opacity-50 ${isRecording ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
          disabled={isExporting}
          onClick={onToggleRecording}
          title={isRecording ? '停止录制' : '开始录制(WebM)'}
        >
          {isRecording ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Circle className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
          disabled={isExporting}
          onClick={onDownloadSnapshot}
          title="保存截图"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
          disabled={isExporting}
          onClick={onExportScene}
          title="导出场景 (GLB)"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1" />
        <button
          className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
          disabled={isExporting}
          onClick={onReset}
          title="重置设置"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
);

ControlPanelHeader.displayName = 'ControlPanelHeader';

export type { ControlPanelHeaderProps };
