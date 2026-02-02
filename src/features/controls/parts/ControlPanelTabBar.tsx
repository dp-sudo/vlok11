import type React from 'react';
import { memo } from 'react';

import { TABS, type TabType } from '../constants';

interface ControlPanelTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ControlPanelTabBar: React.FC<ControlPanelTabBarProps> = memo(
  ({ activeTab, onTabChange }) => (
    <div className="flex border-b border-slate-200 bg-white">
      {TABS.map((t) => {
        const isActive = activeTab === t.key;

        return (
          <button
            type="button"
            className={`
              flex-1 py-3 flex flex-col items-center gap-1.5
              transition-all duration-200 relative
              ${isActive ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
            `}
            key={t.key}
            onClick={() => onTabChange(t.key)}
          >
            <div
              className={`
              p-2 rounded-xl transition-all duration-300
              ${isActive ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}
            `}
            >
              {t.icon}
            </div>

            <span
              className={`text-[12px] font-bold tracking-wide transition-colors ${isActive ? 'text-cyan-400' : ''}`}
            >
              {t.label}
            </span>

            {isActive && (
              <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}
          </button>
        );
      })}
    </div>
  )
);

ControlPanelTabBar.displayName = 'ControlPanelTabBar';

export type { ControlPanelTabBarProps, TabType };
