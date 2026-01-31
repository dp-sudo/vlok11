import { useStore } from 'zustand';

import { getSettingsService } from '@/core/services/SettingsService';

export function useSettingsViewModel() {
  const settingsService = getSettingsService();
  const settings = useStore(settingsService.store);

  return {
    geminiApiKey: settings.geminiApiKey,
    performanceMode: settings.performanceMode,
    useLocalAi: settings.useLocalAi,

    setApiKey: settings.setApiKey,
    setPerformanceMode: settings.setPerformanceMode,
    toggleLocalAi: settings.toggleLocalAi,

    hasApiKey: !!settings.geminiApiKey,
    isQualityMode: settings.performanceMode === 'quality',
  };
}
