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

export const Btn: React.FC<BtnProps> = ({ active, onClick, children, small, disabled }) => (
  <button
    className={`
      ${small ? 'py-1.5 px-2.5 text-[10px]' : 'py-2 px-3 text-xs'}
      rounded-lg border font-medium transition-all duration-200
      ${
        active
          ? 'bg-gradient-to-b from-amber-400 to-orange-600 border-amber-400 text-black'
          : disabled
            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
            : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-500 hover:text-white hover:bg-zinc-700'
      }
      active:scale-[0.96]
      disabled:cursor-not-allowed
    `}
    onClick={onClick}
    disabled={disabled}
    style={
      active
        ? {
            boxShadow:
              '0 0 30px rgba(251, 191, 36, 0.9), 0 0 60px rgba(251, 191, 36, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          }
        : undefined
    }
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
  disabled,
}) => (
  <button
    className={`
      ${small ? 'py-2.5 px-2 min-h-[4rem]' : 'py-3.5 px-2.5 min-h-[5rem]'}
      text-xs rounded-xl border-2 transition-all duration-200
      flex flex-col items-center justify-center gap-2 relative overflow-hidden
      ${
        active
          ? 'bg-gradient-to-b from-amber-500/40 to-orange-600/30 border-amber-400 text-white scale-[1.03]'
          : disabled
            ? 'bg-zinc-800/50 border-zinc-700 text-zinc-500 opacity-50 cursor-not-allowed'
            : 'bg-zinc-800/80 border-zinc-600 text-zinc-300 hover:bg-zinc-700/80 hover:border-zinc-500 hover:text-white hover:scale-[1.02]'
      }
      active:scale-[0.98]
      disabled:cursor-not-allowed disabled:hover:scale-100
    `}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    disabled={disabled}
    style={
      active
        ? {
            boxShadow:
              '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.2)',
          }
        : undefined
    }
  >
    {active && (
      <>
        {/* 激活状态指示点 - 琥珀色高亮 */}
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md flex items-center justify-center z-10 animate-pulse">
          <Check className="w-3 h-3 text-black" strokeWidth={3} />
        </div>
        {/* 顶部发光条 - 琥珀色渐变 */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-white/50 to-amber-400" />
      </>
    )}

    <div className="relative z-10 flex flex-col items-center gap-1.5">{children}</div>
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
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
              ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/50 scale-105'
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
            #f59e0b 0%, 
            #f97316 ${percentage}%, 
            #3f3f46 ${percentage}%, 
            #3f3f46 100%)`,
          }}
          type="range"
          value={value}
        />
        {isDragging ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400/50 blur-md pointer-events-none"
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
                    ? 'bg-amber-600/30 text-amber-300 ring-1 ring-amber-500/50'
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
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/50'
            : 'bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800/60 hover:border-zinc-600/50'
        }
      `}
      onClick={() => onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
      style={checked ? { boxShadow: '0 0 25px rgba(251, 191, 36, 0.3)' } : undefined}
    >
      <div className="flex items-center gap-3">
        {/* 状态指示器 - 启用时琥珀色，禁用时灰色 */}
        <div
          className={`
            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
            transition-all duration-300
            ${
              checked
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : 'bg-zinc-700 border-2 border-zinc-600 group-hover:border-zinc-500'
            }
          `}
          style={checked ? { boxShadow: '0 0 15px rgba(251, 191, 36, 0.8)' } : undefined}
        >
          <Check
            className={`w-4 h-4 transition-all duration-300 ${checked ? 'text-black scale-100' : 'text-zinc-500 scale-0'}`}
            strokeWidth={3}
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`
                ${compact ? 'text-xs' : 'text-sm'}
                font-semibold transition-all duration-300
                ${checked ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}
              `}
            >
              {label}
            </span>

            {/* 状态标签 - 启用时琥珀色，禁用时灰色 */}
            <span
              className={`
                text-[10px] px-2 py-0.5 rounded-full font-bold transition-all duration-300
                ${
                  checked
                    ? 'bg-amber-400 text-black'
                    : 'bg-zinc-700 text-zinc-500 border border-zinc-600'
                }
              `}
              style={checked ? { boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)' } : undefined}
            >
              {checked ? '已启用' : '已关闭'}
            </span>
          </div>

          {description && (
            <span
              className={`text-xs mt-0.5 transition-colors duration-300 ${checked ? 'text-amber-300/90' : 'text-zinc-500'}`}
            >
              {description}
            </span>
          )}
        </div>
      </div>

      {/* 开关滑块 - 启用时琥珀色渐变，禁用时灰色 */}
      <div
        className={`
          relative w-12 h-7 rounded-full flex-shrink-0 p-0.5
          transition-all duration-300
          ${
            checked
              ? 'bg-gradient-to-r from-amber-500 to-orange-400'
              : 'bg-zinc-700 border border-zinc-600'
          }
        `}
        style={checked ? { boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)' } : undefined}
      >
        {/* 滑块按钮 */}
        <div
          className={`
            relative w-6 h-6 rounded-full shadow-lg
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-zinc-400'}
          `}
        >
          {/* 滑块内部指示 */}
          <div
            className={`
              absolute inset-1 rounded-full transition-all duration-300
              ${checked ? 'bg-amber-400/40' : 'bg-zinc-600'}
            `}
          />
        </div>

        {/* 启用时的光效 */}
        {checked && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/30 to-transparent animate-pulse" />
        )}
      </div>
    </button>
  );
};
