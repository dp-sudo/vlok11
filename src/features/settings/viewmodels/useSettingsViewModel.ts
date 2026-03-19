import { useCallback } from 'react';
import { useStore } from 'zustand';

import { getSettingsService } from '@/core/services/SettingsService';

export function useSettingsViewModel() {
  const settingsService = getSettingsService();
  const settings = useStore(settingsService.store);

  return {
    // 原有设置
    geminiApiKey: settings.geminiApiKey,
    performanceMode: settings.performanceMode,
    useLocalAi: settings.useLocalAi,

    // 主题设置
    themeMode: settings.themeMode,
    setThemeMode: settings.setThemeMode,

    // 音频设置
    audioEnabled: settings.audioEnabled,
    audioVolume: settings.audioVolume,
    setAudioEnabled: settings.setAudioEnabled,
    setAudioVolume: settings.setAudioVolume,

    // 导出设置
    exportFormat: settings.exportFormat,
    exportFps: settings.exportFps,
    exportResolution: settings.exportResolution,
    exportCodec: settings.exportCodec,
    setExportFormat: settings.setExportFormat,
    setExportFps: settings.setExportFps,
    setExportResolution: settings.setExportResolution,
    setExportCodec: settings.setExportCodec,

    // 预设管理
    savedPresets: settings.savedPresets,
    savePreset: useCallback(
      (name: string, config: unknown) => settings.savePreset(name, config),
      [settings.savePreset]
    ),
    loadPreset: settings.loadPreset,
    deletePreset: settings.deletePreset,

    // 方法
    setApiKey: settings.setApiKey,
    setPerformanceMode: settings.setPerformanceMode,
    toggleLocalAi: settings.toggleLocalAi,

    hasApiKey: !!settings.geminiApiKey,
    isQualityMode: settings.performanceMode === 'quality',
  };
}
