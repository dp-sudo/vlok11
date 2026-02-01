import React, { memo } from 'react';

import { TABS, type TabType } from '../constants';

interface ControlPanelTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ControlPanelTabBar: React.FC<ControlPanelTabBarProps> = memo(
  ({ activeTab, onTabChange }) => (
    <div className="flex border-b border-zinc-800 bg-zinc-950/80">
      {TABS.map((t) => {
        const isActive = activeTab === t.key;
        const isImmersive = t.key === 'immersive';

        const getIconClasses = () => {
          if (isActive && isImmersive) {
            return 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]';
          }
          if (isActive) {
            return 'bg-blue-500/20 text-blue-400';
          }
          if (isImmersive) {
            return 'text-zinc-500';
          }

          return '';
        };

        const getIndicatorColor = () => {
          return isImmersive ? 'bg-cyan-400' : 'bg-blue-500';
        };

        return (
          <button
            className={`
              flex-1 py-2.5 flex flex-col items-center gap-1 text-xs
              transition-all duration-200 relative
              ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}
            `}
            key={t.key}
            onClick={() => onTabChange(t.key)}
          >
            <div className={`p-1.5 rounded-lg transition-all duration-200 ${getIconClasses()}`}>
              {t.icon}
            </div>

            <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{t.label}</span>

            {isActive && (
              <div
                className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)] ${getIndicatorColor()}`}
              />
            )}
          </button>
        );
      })}
    </div>
  )
);

ControlPanelTabBar.displayName = 'ControlPanelTabBar';

export type { ControlPanelTabBarProps, TabType };
