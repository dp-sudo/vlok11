import React from 'react';
import ReactDOM from 'react-dom/client';

import '@/app/styles/index.css';
import { bootstrap } from '@/app/bootstrap';
import { ServiceProvider } from '@/core/contexts/ServiceContext';
import { initializeSentry } from '@/core/monitoring/initSentry';
import { ErrorBoundaryWithRecovery } from '@/shared/components/ErrorBoundaryWithRecovery';

import { App } from './App';

if (import.meta.env.PROD) {
  void initializeSentry();
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const initAndRender = async () => {
  let aiService;

  try {
    aiService = await bootstrap();
  } catch (error) {
    console.error('Bootstrap failed via main.tsx:', error);
  }

  if (!aiService) {
    console.warn('Bootstrap returned no service (or failed). Rendering in degraded mode.');
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <ErrorBoundaryWithRecovery>
        <ServiceProvider services={{ aiService: aiService ?? null }}>
          <App />
        </ServiceProvider>
      </ErrorBoundaryWithRecovery>
    </React.StrictMode>
  );
};

void initAndRender();
