import { Settings, X } from 'lucide-react';
import { memo } from 'react';

import type { ReactNode } from 'react';

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
      className={`mobile-drawer-backdrop desktop-hidden ${isOpen ? 'mobile-drawer-backdrop--visible' : ''}`}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="button"
      tabIndex={isOpen ? 0 : -1}
    />

    <div className={`mobile-drawer desktop-hidden ${isOpen ? 'mobile-drawer--open' : ''}`}>
      <button aria-label="关闭控制面板" className="mobile-drawer-close" onClick={onClose}>
        <X style={{ width: '1rem', height: '1rem' }} />
      </button>
      {children}
    </div>

    <button aria-label="打开控制面板" className="mobile-fab desktop-hidden" onClick={onOpen}>
      <Settings style={{ width: '1.5rem', height: '1.5rem' }} />
    </button>
  </>
));

MobileDrawer.displayName = 'MobileDrawer';
