import type { ReactNode } from 'react';
import { memo } from 'react';
import { ErrorBoundary } from '@/shared/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = memo(({ children }: AppProvidersProps) => (
  <ErrorBoundary>{children}</ErrorBoundary>
));

AppProviders.displayName = 'AppProviders';
