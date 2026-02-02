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
              ${isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}
            `}
            key={t.key}
            onClick={() => onTabChange(t.key)}
          >
            <div
              className={`
              p-2 rounded-xl transition-all duration-200
              ${isActive ? 'bg-amber-100 text-amber-600 shadow-sm' : 'text-slate-500'}
            `}
            >
              {t.icon}
            </div>

            <span
              className={`text-[13px] font-bold tracking-wide ${isActive ? 'text-slate-800' : ''}`}
            >
              {t.label}
            </span>

            {isActive && (
              <div className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  )
);

ControlPanelTabBar.displayName = 'ControlPanelTabBar';

export type { ControlPanelTabBarProps, TabType };
