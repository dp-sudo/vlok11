import { createContext, type ReactNode, useContext } from 'react';

import type { AIService } from '@/features/ai/services/AIService';

interface ServiceContextType {
  aiService: AIService | null;
}

const ServiceContext = createContext<ServiceContextType>({
  aiService: null,
});

export const ServiceProvider = ({
  children,
  services,
}: {
  children: ReactNode;
  services: ServiceContextType;
}) => {
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
