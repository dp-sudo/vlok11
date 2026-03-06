import ReactDOM from 'react-dom/client';

import '@/app/styles/global.css';
import { bootstrap } from '@/app/bootstrap';
import { ServiceProvider } from '@/core/contexts/ServiceContext';
import { createLogger } from '@/core/Logger';
import { initializeSentry } from '@/core/monitoring/initSentry';
import type { AIService } from '@/features/ai/services';
import { ErrorBoundaryWithRecovery } from '@/shared/components/ErrorBoundaryWithRecovery';

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
  let aiService: AIService | null = null;

  try {
    aiService = await bootstrap();
  } catch (error) {
    logger.error('Bootstrap failed', { error });
  }

  if (!aiService) {
    logger.warn('Bootstrap returned no service - rendering in degraded mode');
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <ErrorBoundaryWithRecovery>
      <ServiceProvider services={{ aiService }}>
        <App />
      </ServiceProvider>
    </ErrorBoundaryWithRecovery>
  );

  // Immediate loader removal after mount attempt
  const loader = document.getElementById('boot-loader');

  if (loader) {
    loader.style.transition = 'opacity 0.5s ease-out';
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }
};

void initAndRender();
