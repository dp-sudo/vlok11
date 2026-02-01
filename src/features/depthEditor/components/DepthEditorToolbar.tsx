import { memo } from 'react';
import type { ToolType } from '../types';
import { TOOL_ICONS, TOOL_LABELS } from '../types';

const TOOLS: ToolType[] = ['brush', 'eraser', 'blur', 'sharpen', 'fill', 'eyedropper'];

interface DepthEditorToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const DepthEditorToolbar = memo<DepthEditorToolbarProps>(({ currentTool, onToolChange }) => {
  return (
    <div className="flex gap-1 p-2 bg-zinc-800/50 rounded-lg">
      {TOOLS.map((tool) => (
        <button
          className={`
            w-10 h-10 flex items-center justify-center rounded-lg text-lg
            transition-all duration-200
            ${
              currentTool === tool
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50'
            }
          `}
          key={tool}
          onClick={() => onToolChange(tool)}
          title={TOOL_LABELS[tool]}
          type="button"
        >
          {TOOL_ICONS[tool]}
        </button>
      ))}
    </div>
  );
});

DepthEditorToolbar.displayName = 'DepthEditorToolbar';
