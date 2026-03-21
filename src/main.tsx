import ReactDOM from 'react-dom/client';

import '@/app/styles/global.css';
import { bootstrap } from '@/app/bootstrap';
import { ServiceProvider } from '@/core/contexts/ServiceContext';
import { createLogger } from '@/core/Logger';
import { initializeSentry } from '@/core/monitoring/initSentry';
import { projectService } from '@/core/services/ProjectService';
import { ErrorBoundaryWithRecovery } from '@/shared/components/ErrorBoundaryWithRecovery';
import { useAppStore } from '@/stores/sharedStore';

import { App } from './App';

const logger = createLogger({ module: 'Main' });

if (import.meta.env.PROD) {
  void initializeSentry();
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const initAndRender = async () => {
  let kernel = null;

  try {
    kernel = await bootstrap();
  } catch (error) {
    logger.error('应用内核启动失败', { error });
  }

  if (!kernel) {
    logger.warn('应用将以降级模式渲染：内核未完成初始化');
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <ErrorBoundaryWithRecovery>
      <ServiceProvider kernel={kernel}>
        <App />
      </ServiceProvider>
    </ErrorBoundaryWithRecovery>
  );

  if (typeof window !== 'undefined' && window.__TEST_MODE__ === true) {
    window.__IMMERSA_TEST_API__ = {
      exportProjectData: () => projectService.exportProjectData(),
      importProjectData: async (projectData) => {
        await projectService.importProjectData(projectData);
      },
      resetSession: () => {
        useAppStore.getState().resetSession();
      },
      getSessionSummary: () => {
        const state = useAppStore.getState();
        const lastDownload = window.__IMMERSA_LAST_DOWNLOAD__;

        return {
          hasResult: Boolean(state.result),
          hasVideo: state.currentAsset?.type === 'video',
          status: state.status,
          ...(lastDownload ? { lastDownload } : {}),
        };
      },
    };
  }

  // Immediate loader removal after mount attempt
  const loader = document.getElementById('boot-loader');

  if (loader) {
    loader.style.transition = 'opacity 0.5s ease-out';
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }
};

void initAndRender();
