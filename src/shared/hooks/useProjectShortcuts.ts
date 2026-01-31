import { useEffect } from 'react';

import { projectService } from '@/core/services/ProjectService';

export const useProjectShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Command (Mac)
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            void projectService.saveProject();
            break;
          case 'o':
            e.preventDefault();
            void projectService.openProject();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};
