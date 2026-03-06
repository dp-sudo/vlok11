import { Settings, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { memo } from 'react';

interface MobileDrawerProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const MobileDrawer = memo(({ isOpen, onClose, onOpen, children }: MobileDrawerProps) => (
  <>
    {/* Backdrop with smooth transition */}
    <button
      type="button"
      aria-label="关闭控制面板"
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      tabIndex={isOpen ? 0 : -1}
    />

    {/* Drawer panel with spring-like animation */}
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 h-[70vh] bg-zinc-950 border-t border-zinc-800 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ willChange: 'transform' }}
    >
      {/* Handle bar for visual affordance */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-zinc-700 rounded-full" />
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-sm font-bold text-zinc-100">控制面板</span>
        <button
          type="button"
          aria-label="关闭控制面板"
          className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100 transition-colors touch-optimized"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="h-full overflow-y-auto pb-20 custom-scrollbar">{children}</div>
    </div>

    {/* FAB button with enhanced touch feedback */}
    <button
      type="button"
      aria-label="打开控制面板"
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-900/50 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 md:hidden ${
        isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ willChange: 'transform, opacity' }}
      onClick={onOpen}
    >
      <Settings className="w-6 h-6" />
    </button>
  </>
));

MobileDrawer.displayName = 'MobileDrawer';
