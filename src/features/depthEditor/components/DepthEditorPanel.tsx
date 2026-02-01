import { Redo2, RotateCcw, Undo2, X } from 'lucide-react';
import { memo, useCallback } from 'react';

import { useDepthEditor } from '../hooks/useDepthEditor';

import { DepthEditorCanvas } from './DepthEditorCanvas';
import { DepthEditorSettings } from './DepthEditorSettings';
import { DepthEditorToolbar } from './DepthEditorToolbar';

interface DepthEditorPanelProps {
  depthImageUrl: string;
  onApply?: (depthData: ImageData) => void;
  onClose: () => void;
}

export const DepthEditorPanel = memo<DepthEditorPanelProps>(
  ({ depthImageUrl, onClose, onApply }) => {
    const editor = useDepthEditor();

    const handleApply = useCallback(() => {
      const depthData = editor.getDepthData();

      if (depthData && onApply) {
        onApply(depthData);
      }
      onClose();
    }, [editor, onApply, onClose]);

    const handleDepthPick = useCallback(
      (value: number) => {
        editor.setToolSetting('depthValue', value);
        editor.setCurrentTool('brush');
      },
      [editor]
    );

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
            <h2 className="text-lg font-semibold text-white">深度图编辑器</h2>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={!editor.canUndo}
                onClick={editor.undo}
                title="撤销"
                type="button"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={!editor.canRedo}
                onClick={editor.redo}
                title="重做"
                type="button"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50 transition-colors"
                onClick={editor.reset}
                title="重置"
                type="button"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-zinc-700 mx-1" />
              <button
                className="p-2 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-red-500/50 hover:text-white transition-colors"
                onClick={onClose}
                title="关闭"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-4 gap-4">
              <DepthEditorToolbar
                currentTool={editor.currentTool}
                onToolChange={editor.setCurrentTool}
              />
              <DepthEditorCanvas
                currentTool={editor.currentTool}
                depthImageUrl={depthImageUrl}
                onApplyTool={editor.applyTool}
                onDepthPick={handleDepthPick}
                onInit={editor.initEngine}
                toolSettings={editor.toolSettings}
              />
            </div>

            <aside className="w-64 border-l border-zinc-700 p-4 overflow-y-auto bg-zinc-800/30">
              <DepthEditorSettings
                currentTool={editor.currentTool}
                onSettingChange={editor.setToolSetting}
                settings={editor.toolSettings}
              />

              <div className="mt-4 space-y-2">
                <button
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  disabled={!editor.isInitialized}
                  onClick={handleApply}
                  type="button"
                >
                  应用更改
                </button>
                <button
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-700 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors"
                  onClick={onClose}
                  type="button"
                >
                  取消
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }
);

DepthEditorPanel.displayName = 'DepthEditorPanel';
