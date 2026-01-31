import React, { memo } from 'react';

import { TABS, type TabType } from '../constants';

interface ControlPanelTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ControlPanelTabBar: React.FC<ControlPanelTabBarProps> = memo(
  ({ activeTab, onTabChange }) => (
    <div className="flex border-b border-zinc-800/60 bg-zinc-900/30">
      {TABS.map((t) => (
        <button
          className={`flex-1 py-3 flex flex-col items-center gap-1.5 text-xs transition-all relative ${
            activeTab === t.key
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
          }`}
          key={t.key}
          onClick={() => onTabChange(t.key)}
        >
          <div
            className={`p-1.5 rounded-lg transition-colors ${activeTab === t.key ? 'bg-indigo-600/20' : ''}`}
          >
            {t.icon}
          </div>
          <span className="font-medium">{t.label}</span>
          {activeTab === t.key ? (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          ) : null}
        </button>
      ))}
    </div>
  )
);

ControlPanelTabBar.displayName = 'ControlPanelTabBar';

export type { ControlPanelTabBarProps, TabType };
