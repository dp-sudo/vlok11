import type { ModelInfo } from '../services/ModelRegistry';

interface ModelCardProps {
  isSelected: boolean;
  model: ModelInfo;
  onFormatBytes: (bytes: number) => string;
  onSelect: (model: ModelInfo) => void;
}

const getStatusColor = (status: ModelInfo['status']): string => {
  switch (status) {
    case 'loaded':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'loading':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'available':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'error':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

export const ModelCard = ({ isSelected, model, onFormatBytes, onSelect }: ModelCardProps) => (
  <button
    className={`w-full p-3 rounded-lg border text-left transition-colors ${isSelected ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-100 border-slate-300 hover:bg-slate-800'}`}
    onClick={() => onSelect(model)}
    type="button"
  >
    <div className="flex items-start justify-between mb-2">
      <h3 className="text-slate-800 font-medium text-sm">{model.name}</h3>
      <span className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(model.status)}`}>
        {model.status}
      </span>
    </div>
    <p className="text-slate-400 text-xs mb-1">{model.description}</p>
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span>{model.provider}</span>
      <span>·</span>
      <span>{onFormatBytes(model.size)}</span>
    </div>
  </button>
);
