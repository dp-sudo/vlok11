import { Check, ChevronDown } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

interface BtnProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  small?: boolean;
  disabled?: boolean;
}
interface CardBtnProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  small?: boolean;
  disabled?: boolean;
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

export const Btn: React.FC<BtnProps> = ({ active, onClick, children, small, disabled }) => {
  const getBtnStateClasses = () => {
    if (disabled) {
      return 'bg-zinc-800/50 border-zinc-700/50 text-zinc-600 cursor-not-allowed opacity-50';
    }
    if (active) {
      return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
    }

    return 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-cyan-500/30 hover:text-cyan-300 hover:bg-white/5';
  };

  return (
    <button
      className={`
      ${small ? 'py-1.5 px-3 text-[12px]' : 'py-2.5 px-4 text-[13px]'}
      rounded-lg border font-semibold tracking-wide transition-all duration-200 whitespace-nowrap
      ${getBtnStateClasses()}
      active:scale-[0.96]
      disabled:cursor-not-allowed
    `}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

export const CardBtn: React.FC<CardBtnProps> = ({
  active,
  onClick,
  children,
  small,
  onMouseEnter,
  onMouseLeave,
  disabled,
}) => {
  const getCardBtnStateClasses = () => {
    if (disabled) {
      return 'bg-zinc-900/20 border-zinc-800 text-zinc-700 opacity-60 cursor-not-allowed';
    }
    if (active) {
      return 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.02]';
    }

    return 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-cyan-500/30 hover:bg-white/5 hover:shadow-lg hover:-translate-y-0.5';
  };

  return (
    <button
      className={`
      ${small ? 'py-2.5 px-2 min-h-[4.5rem]' : 'py-3 px-2.5 min-h-[6rem]'}
      rounded-xl border-2 transition-all duration-300
      flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group whitespace-nowrap
      ${getCardBtnStateClasses()}
      active:scale-[0.98] active:translate-y-0
    `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      type="button"
    >
      {active && (
        <>
          {/* Active Indicator Dot */}
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] flex items-center justify-center z-10 animate-in fade-in zoom-in duration-200">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 opacity-80" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center w-full">{children}</div>
    </button>
  );
};

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
          ? 'bg-zinc-800/50 border border-white/5 shadow-sm'
          : 'bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/50'
      }
    `}
    >
      <button
        className="w-full flex items-center justify-between p-3 bg-zinc-900/30 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-lg transition-colors group"
        onClick={handleToggle}
        type="button"
      >
        <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-300 group-hover:text-cyan-400">
          {icon ? (
            <span className="text-zinc-500 group-hover:text-cyan-500/70 transition-colors">
              {icon}
            </span>
          ) : null}
          {title}
        </div>
        {badge !== undefined ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-violet-100 text-violet-700 border border-violet-300">
            {badge}
          </span>
        ) : null}
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
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
        <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
        <span
          className={`
          text-[11px] font-mono px-2 py-0.5 rounded-md transition-all duration-150 font-bold
          ${
            isDragging
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 scale-105 shadow-sm'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }
        `}
        >
          {displayValue}
        </span>
      </div>
      <div className="relative group">
        <input
          className="w-full h-2 rounded-full appearance-none cursor-pointer relative z-10 slider-thumb bg-zinc-800"
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
            #06b6d4 0%,
            #2dd4bf ${percentage}%,
            #27272a ${percentage}%,
            #27272a 100%)`,
          }}
          type="range"
          value={value}
        />
        {isDragging ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-400/40 blur-md pointer-events-none transition-all duration-75"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        ) : null}
      </div>
      {showPresets && presets ? (
        <div className="flex gap-1.5 mt-2">
          {presets.map((p) => (
            <button
              className={`
                flex-1 py-1.5 text-[10px] rounded-lg transition-all duration-200 font-medium
                ${
                  Math.abs(value - p) < step
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20 scale-105'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600'
                }
              `}
              key={p}
              onClick={() => onChange(p)}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/**
 * Toggle Switch Component - Redesigned
 *
 * 设计特点：
 * 1. 启用/关闭状态颜色对比鲜明
 * 2. 渐变背景和发光效果
 * 3. 更现代的开关设计
 * 4. 清晰的状态指示
 */

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  compact,
  description,
}) => {
  return (
    <button
      className={`
        flex items-center justify-between ${compact ? 'py-2.5 flex-1' : 'py-3 w-full'}
        text-left group rounded-xl px-4 -mx-3
        transition-all duration-300 ease-out
        ${
          checked
            ? 'bg-gradient-to-r from-cyan-600/20 to-teal-600/10 border border-cyan-500/40'
            : 'bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50'
        }
      `}
      onClick={() => onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
      style={checked ? { boxShadow: '0 0 20px rgba(8, 145, 178, 0.25)' } : undefined}
    >
      <div className="flex items-center gap-3">
        {/* 状态指示器 - 启用时青色，禁用时灰色 */}
        <div
          className={`
            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
            transition-all duration-300
            ${
              checked
                ? 'bg-gradient-to-br from-cyan-400 to-teal-500'
                : 'bg-slate-700 border-2 border-slate-600 group-hover:border-slate-500'
            }
          `}
          style={checked ? { boxShadow: '0 0 12px rgba(34, 211, 238, 0.5)' } : undefined}
        >
          <Check
            className={`w-4 h-4 transition-all duration-300 ${checked ? 'text-slate-900 scale-100' : 'text-slate-500 scale-0'}`}
            strokeWidth={3}
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`
                ${compact ? 'text-xs' : 'text-sm'}
                font-semibold transition-all duration-300
                ${checked ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-300'}
              `}
            >
              {label}
            </span>

            {/* 状态标签 - 启用时青色，禁用时灰色 */}
            <span
              className={`
                text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300
                ${
                  checked
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-700 text-slate-500 border border-slate-600'
                }
              `}
            >
              {checked ? '已启用' : '已关闭'}
            </span>
          </div>

          {description && (
            <span
              className={`text-xs mt-0.5 transition-colors duration-300 ${checked ? 'text-cyan-400/80' : 'text-slate-500'}`}
            >
              {description}
            </span>
          )}
        </div>
      </div>

      {/* 开关滑块 - 启用时青色渐变，禁用时灰色 */}
      <div
        className={`
          relative w-12 h-7 rounded-full flex-shrink-0 p-0.5
          transition-all duration-300
          ${
            checked
              ? 'bg-gradient-to-r from-cyan-600 to-teal-500'
              : 'bg-slate-700 border border-slate-600'
          }
        `}
        style={checked ? { boxShadow: '0 0 15px rgba(8, 145, 178, 0.4)' } : undefined}
      >
        {/* 滑块按钮 */}
        <div
          className={`
            relative w-6 h-6 rounded-full shadow-lg
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${checked ? 'translate-x-5 bg-slate-100' : 'translate-x-0 bg-slate-400'}
          `}
        >
          {/* 滑块内部指示 */}
          <div
            className={`
              absolute inset-1 rounded-full transition-all duration-300
              ${checked ? 'bg-cyan-400/30' : 'bg-slate-600'}
            `}
          />
        </div>

        {/* 启用时的光效 */}
        {checked && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-transparent animate-pulse" />
        )}
      </div>
    </button>
  );
};
