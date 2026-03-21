import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { AppKernel } from '@/app/AppKernel';
import type { AIService } from '@/features/ai/services/AIService';

interface ServiceContextType {
  aiService: AIService | null;
  kernel: AppKernel | null;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider = ({
  children,
  kernel,
}: {
  children: ReactNode;
  kernel: AppKernel | null;
}) => {
  const services = useMemo(
    () => ({
      kernel,
      aiService: kernel?.getServices().aiService ?? null,
    }),
    [kernel]
  );

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
};

export const useServices = () => {
  const context = useContext(ServiceContext);

  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }

  return context;
};

// Specialized hooks for convenience
export const useAIService = () => {
  const { aiService } = useServices();

  if (!aiService) {
    throw new Error('AIService is not initialized');
  }

  return aiService;
};

export const useAppKernel = () => {
  const { kernel } = useServices();

  if (!kernel) {
    throw new Error('应用内核尚未初始化');
  }

  return kernel;
};
