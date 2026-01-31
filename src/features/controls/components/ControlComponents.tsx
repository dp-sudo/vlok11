import { Check, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

interface BtnProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  small?: boolean;
}
interface CardBtnProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  small?: boolean;
}
interface CollapsibleSectionProps {
  badge?: string | number;
  children: React.ReactNode;
  expanded?: boolean;
  icon?: React.ReactNode;
  onToggle?: () => void;
  title: string;
}
interface SliderProps {
  label: string;
  max: number;
  min: number;
  onChange: (v: number) => void;
  presets?: number[];
  showPresets?: boolean;
  step: number;
  value: number;
}
interface ToggleProps {
  checked: boolean;
  compact?: boolean;
  description?: string;
  label: string;
  onChange: (v: boolean) => void;
}

export const Btn: React.FC<BtnProps> = ({ active, onClick, children, small }) => (
  <button
    className={`
      ${small ? 'py-1 px-2 text-[10px]' : 'py-1.5 px-3 text-[11px]'} 
      rounded-lg border-2 transition-all duration-200 font-medium
      ${
        active
          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/40'
          : 'bg-zinc-800/50 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60'
      }
    `}
    onClick={onClick}
  >
    {children}
  </button>
);

export const CardBtn: React.FC<CardBtnProps> = ({
  active,
  onClick,
  children,
  small,
  onMouseEnter,
  onMouseLeave,
}) => (
  <button
    className={`
      ${small ? 'py-1.5 px-1' : 'py-3 px-2.5'} 
      text-[11px] rounded-xl border-2 transition-all duration-300 
      flex flex-col items-center justify-center gap-1.5 relative overflow-hidden
      transform active:scale-[0.96]
      ${
        active
          ? `
          bg-emerald-600
          border-emerald-400 
          text-white 
          shadow-xl shadow-emerald-500/40
          scale-[1.02]
        `
          : `
          bg-zinc-800/50 
          border-zinc-700/30 
          text-zinc-400 
          hover:border-zinc-500 
          hover:text-zinc-200 
          hover:bg-zinc-700/60
        `
      }
    `}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {active ? (
      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
      </div>
    ) : null}

    <div className={`relative z-10 flex flex-col items-center gap-1 ${active ? 'text-white' : ''}`}>
      {children}
    </div>
  </button>
);

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  expanded = true,
  onToggle,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(expanded);
  const handleToggle = onToggle ?? (() => setIsOpen(!isOpen));
  const open = onToggle ? expanded : isOpen;

  return (
    <div
      className={`
      rounded-xl overflow-hidden transition-all duration-200
      ${
        open
          ? 'bg-zinc-800/40 border border-zinc-700/50 shadow-sm'
          : 'bg-zinc-800/20 border border-zinc-800/40 hover:bg-zinc-800/30'
      }
    `}
    >
      <button
        className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-zinc-700/20 transition-colors group"
        onClick={handleToggle}
      >
        <div className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-400" />
        </div>
        {icon ? (
          <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">{icon}</span>
        ) : null}
        <span className="text-xs font-medium text-zinc-300 flex-1">{title}</span>
        {badge !== undefined ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {badge}
          </span>
        ) : null}
      </button>
      <div
        className={`
        transition-all duration-200 ease-out overflow-hidden
        ${open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
      `}
      >
        <div className="px-3 pb-3 space-y-2">{children}</div>
      </div>
    </div>
  );
};

const DECIMAL_PRECISION_THRESHOLD = 0.1;
const PERCENTAGE_MULTIPLIER = 100;

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  showPresets,
  presets,
}) => {
  const percentage = max !== min ? ((value - min) / (max - min)) * PERCENTAGE_MULTIPLIER : 0;
  const [isDragging, setIsDragging] = useState(false);

  const getDisplayValue = () => {
    if (typeof value !== 'number') return value;
    if (Number.isInteger(step)) return value;
    const precision = step < DECIMAL_PRECISION_THRESHOLD ? 2 : 1;

    return value.toFixed(precision);
  };

  const displayValue = getDisplayValue();

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-zinc-500">{label}</span>
        <span
          className={`
          text-[11px] font-mono px-2 py-0.5 rounded-md transition-all duration-150
          ${
            isDragging
              ? 'bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/50 scale-105'
              : 'bg-zinc-800/60 text-zinc-300'
          }
        `}
        >
          {displayValue}
        </span>
      </div>
      <div className="relative group">
        <input
          className="w-full h-2 rounded-full appearance-none cursor-pointer relative z-10 slider-thumb"
          max={max}
          min={min}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          step={step}
          style={{
            background: `linear-gradient(to right, 
              #6366f1 0%, 
              #8b5cf6 ${percentage}%, 
              #3f3f46 ${percentage}%, 
              #3f3f46 100%)`,
          }}
          type="range"
          value={value}
        />
        {isDragging ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-400/50 blur-md pointer-events-none"
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        ) : null}
      </div>
      {showPresets && presets ? (
        <div className="flex gap-1 mt-1">
          {presets.map((p) => (
            <button
              className={`
                flex-1 py-1 text-[9px] rounded-md transition-all duration-150
                ${
                  Math.abs(value - p) < step
                    ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/70'
                }
              `}
              key={p}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  compact,
  description,
}) => {
  const getTogglePosition = () => {
    if (!checked) return 'left-0.5';

    return compact ? 'left-[calc(100%-0.75rem)]' : 'left-[calc(100%-1.125rem)]';
  };

  return (
    <button
      className={`
        flex items-center justify-between ${compact ? 'py-1.5 flex-1' : 'py-2 w-full'} 
        text-left group rounded-lg px-2 -mx-2
        transition-all duration-200
        ${checked ? 'bg-gradient-to-r from-indigo-500/10 to-transparent' : 'hover:bg-zinc-800/30'}
      `}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {checked ? (
            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-green-500" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full border border-zinc-600" />
          )}
          <span
            className={`
              ${compact ? 'text-[10px]' : 'text-[11px]'} 
              transition-colors duration-200
              ${checked ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}
            `}
          >
            {label}
          </span>
          {checked && !compact ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium animate-in fade-in duration-200">
              已启用
            </span>
          ) : null}
        </div>
        {description ? <span className="text-[10px] text-zinc-500 ml-6">{description}</span> : null}
      </div>

      <div
        className={`
          ${compact ? 'w-8 h-4' : 'w-10 h-5'} 
          rounded-full transition-all duration-300 relative
          ${
            checked
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30'
              : 'bg-zinc-700 hover:bg-zinc-600'
          }
        `}
      >
        <div
          className={`
            ${compact ? 'w-3 h-3' : 'w-4 h-4'} 
            rounded-full bg-white absolute top-0.5 
            transition-all duration-300 shadow-sm
            ${getTogglePosition()}
            ${checked ? 'shadow-indigo-500/50' : ''}
          `}
        />
        {checked ? (
          <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
        ) : null}
      </div>
    </button>
  );
};
