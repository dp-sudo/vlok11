import type React from 'react';
import { memo } from 'react';

import { TABS, type TabType } from '../constants';

interface ControlPanelTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ControlPanelTabBar: React.FC<ControlPanelTabBarProps> = memo(
  ({ activeTab, onTabChange }) => (
    <div className="flex border-b border-slate-700/50 bg-gradient-to-b from-slate-800 to-slate-900 relative">
      {/* 顶部微光效果 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />

      {TABS.map((t) => {
        const isActive = activeTab === t.key;

        return (
          <button
            type="button"
            className={`
              flex-1 py-3 flex flex-col items-center gap-1.5
              transition-all duration-200 relative
              ${isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5'}
            `}
            key={t.key}
            onClick={() => onTabChange(t.key)}
          >
            <div
              className={`
              p-2 rounded-xl transition-all duration-300
              ${isActive ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-110 ring-1 ring-cyan-500/30' : 'text-slate-400 hover:text-slate-300'}
            `}
            >
              {t.icon}
            </div>

            <span
              className={`text-[12px] font-bold tracking-wide transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}
            >
              {t.label}
            </span>

            {isActive && (
              <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            )}
          </button>
        );
      })}
    </div>
  )
);

ControlPanelTabBar.displayName = 'ControlPanelTabBar';

export type { ControlPanelTabBarProps, TabType };
