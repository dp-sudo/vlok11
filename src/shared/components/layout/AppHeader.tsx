import { Box, Settings } from 'lucide-react';
import { memo, useState } from 'react';

import { SettingsModal } from '@/features/settings/components/SettingsModal';

export const AppHeader = memo(() => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between px-6 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Box className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight m-0">Immersa 3D</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs text-zinc-400">由 Gemini & WebGL 驱动</span>
          <button
            className="text-zinc-400 hover:text-white transition-colors"
            onClick={() => setShowSettings(true)}
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            className="text-sm text-zinc-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            onClick={() => window.open('https://github.com/google/gemini-api-cookbook', '_blank')}
          >
            文档
          </button>
        </div>
      </header>
      {showSettings ? <SettingsModal onClose={() => setShowSettings(false)} /> : null}
    </>
  );
});

AppHeader.displayName = 'AppHeader';
