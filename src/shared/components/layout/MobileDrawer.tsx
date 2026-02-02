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
    <div
      aria-label="关闭控制面板"
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="button"
      tabIndex={isOpen ? 0 : -1}
    />

    <div
      className={`fixed bottom-0 left-0 right-0 z-50 h-[70vh] bg-zinc-950 border-t border-zinc-800 rounded-t-2xl shadow-2xl transform transition-transform duration-300 lg:hidden ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-sm font-bold text-zinc-100">控制面板</span>
        <button
          aria-label="关闭控制面板"
          className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="h-full overflow-y-auto pb-20">
        {children}
      </div>
    </div>

    <button
      aria-label="打开控制面板"
      className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-900/50 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 lg:hidden ${
        isOpen ? 'scale-0' : 'scale-100'
      }`}
      onClick={onOpen}
    >
      <Settings className="w-6 h-6" />
    </button>
  </>
));

MobileDrawer.displayName = 'MobileDrawer';
