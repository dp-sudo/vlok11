import { Moon, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { useSettingsViewModel } from '@/features/settings/viewmodels/useSettingsViewModel';
import { useSceneStore } from '@/stores/sharedStore';

interface SettingsModalProps {
  onClose: () => void;
}

const EXPORT_FORMATS = [
  { value: 'webm', label: 'WebM' },
  { value: 'mp4', label: 'MP4' },
  { value: 'gif', label: 'GIF' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
] as const;

const RESOLUTIONS = [
  { value: '1920x1080', label: '1080p (1920x1080)' },
  { value: '2560x1440', label: '1440p (2560x1440)' },
  { value: '3840x2160', label: '4K (3840x2160)' },
  { value: '1280x720', label: '720p (1280x720)' },
] as const;

const FPS_OPTIONS = [15, 30, 60, 90, 120] as const;

export const SettingsModal = memo(({ onClose }: SettingsModalProps) => {
  const {
    geminiApiKey,
    isQualityMode,
    setApiKey,
    setPerformanceMode,
    toggleLocalAi,
    useLocalAi,
    // 主题
    themeMode,
    setThemeMode,
    // 音频
    audioEnabled,
    audioVolume,
    setAudioEnabled,
    setAudioVolume,
    // 导出
    exportFormat,
    exportFps,
    exportResolution,
    exportCodec,
    setExportFormat,
    setExportFps,
    setExportResolution,
    setExportCodec,
    // 预设
    savedPresets,
    savePreset,
    loadPreset,
    deletePreset,
  } = useSettingsViewModel();

  const [activeSection, setActiveSection] = useState<string>('ai');
  const [presetName, setPresetName] = useState('');

  const sections = [
    { id: 'ai', label: 'AI 设置' },
    { id: 'theme', label: '主题' },
    { id: 'audio', label: '音频' },
    { id: 'export', label: '导出' },
    { id: 'presets', label: '预设' },
  ];

  const handleSavePreset = () => {
    const trimmedName = presetName.trim();
    // 验证：长度限制和存在性检查
    if (!trimmedName) return;
    if (trimmedName.length > 50) {
      alert('预设名称不能超过50个字符');
      return;
    }
    if ((savedPresets as { name: string }[]).some((p) => p.name === trimmedName)) {
      alert('预设名称已存在，请使用其他名称');
      return;
    }
    // 获取当前场景配置并序列化保存
    const sceneStore = useSceneStore.getState();
    const currentConfig = sceneStore.getConfig();
    savePreset(trimmedName, currentConfig);
    setPresetName('');
  };

  // 加载预设并应用到场景
  const handleLoadPreset = (name: string) => {
    const config = loadPreset(name);
    if (config) {
      const sceneStore = useSceneStore.getState();
      sceneStore.setConfig(config);
    }
  };

  // API Key 输入验证
  const handleApiKeyChange = useCallback((value: string) => {
    // 基本格式验证：Google API Key 通常以 AIzaSy 开头，长度在 30-50 字符之间
    if (value && !value.startsWith('AIzaSy')) {
      // 仍然允许输入，只是不做严格验证
    }
    setApiKey(value);
  }, [setApiKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-white">设置</h2>
          <button
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签导航 */}
        <div className="flex border-b border-zinc-800">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-zinc-800/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* AI 设置 */}
          {activeSection === 'ai' && (
            <>
              <div className="space-y-3">
                <label htmlFor="gemini-api-key" className="block text-sm font-medium text-zinc-300">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    id="gemini-api-key"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="AIzaSy..."
                    type="password"
                    value={geminiApiKey}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  配置 API Key 以启用云端高精度 AI 生成。
                  <a
                    className="ml-1 text-indigo-400 hover:text-indigo-300 underline"
                    href="https://aistudio.google.com/app/apikey"
                    rel="noreferrer"
                    target="_blank"
                  >
                    获取 Key
                  </a>
                </p>
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-400">
                    安全提示: API Key 已加密存储在 sessionStorage 中，关闭浏览器标签页后会自动清除。
                    请勿在公共设备上保存 API Key。
                  </p>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              <div className="space-y-3">
                <span id="processing-mode-label" className="block text-sm font-medium text-zinc-300">
                  处理模式
                </span>
                <fieldset
                  aria-labelledby="processing-mode-label"
                  className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800"
                >
                  <legend className="sr-only">处理模式选择</legend>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      isQualityMode
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    onClick={() => setPerformanceMode('quality')}
                    type="button"
                  >
                    画质优先 (AI)
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      !isQualityMode
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    onClick={() => setPerformanceMode('speed')}
                    type="button"
                  >
                    速度优先 (Local)
                  </button>
                </fieldset>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-medium text-zinc-300">强制使用本地模型</span>
                  <button
                    className={`w-10 h-6 rounded-full p-1 transition-colors border-none cursor-pointer ${useLocalAi ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    onClick={() => toggleLocalAi(!useLocalAi)}
                    type="button"
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${useLocalAi ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </label>
                <p className="text-xs text-zinc-500">
                  即使配置了 API Key，也强制使用浏览器本地计算（适用于无网络环境）。
                </p>
              </div>
            </>
          )}

          {/* 主题设置 */}
          {activeSection === 'theme' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <span className="block text-sm font-medium text-zinc-300">主题模式</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      themeMode === 'dark'
                        ? 'bg-zinc-800 border-indigo-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    onClick={() => setThemeMode('dark')}
                    type="button"
                  >
                    <Moon className="w-6 h-6" />
                    <span className="text-sm">深色</span>
                  </button>
                  <button
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      themeMode === 'light'
                        ? 'bg-zinc-800 border-indigo-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    onClick={() => setThemeMode('light')}
                    type="button"
                  >
                    <Sun className="w-6 h-6" />
                    <span className="text-sm">浅色</span>
                  </button>
                  <button
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      themeMode === 'system'
                        ? 'bg-zinc-800 border-indigo-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    onClick={() => setThemeMode('system')}
                    type="button"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-lg">💻</div>
                    <span className="text-sm">跟随系统</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 音频设置 */}
          {activeSection === 'audio' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-medium text-zinc-300">启用音频</span>
                  <button
                    className={`w-10 h-6 rounded-full p-1 transition-colors border-none cursor-pointer ${audioEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    type="button"
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${audioEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </label>
              </div>

              {audioEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">音量</span>
                    <span className="text-xs text-zinc-500">{Math.round(audioVolume * 100)}%</span>
                  </div>
                  <input
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    max={1}
                    min={0}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    step={0.1}
                    type="range"
                    value={audioVolume}
                  />
                  <div className="flex items-center gap-2 text-zinc-500">
                    {audioVolume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span className="text-xs">
                      {audioVolume === 0 ? '静音' : audioVolume < 0.5 ? '低' : audioVolume < 0.8 ? '中' : '高'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 导出设置 */}
          {activeSection === 'export' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">导出格式</label>
                <select
                  className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  onChange={(e) => setExportFormat(e.target.value as 'webm' | 'mp4' | 'gif' | 'png' | 'jpg')}
                  value={exportFormat}
                >
                  {EXPORT_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">分辨率</label>
                <select
                  className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  onChange={(e) => setExportResolution(e.target.value)}
                  value={exportResolution}
                >
                  {RESOLUTIONS.map((res) => (
                    <option key={res.value} value={res.value}>
                      {res.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">帧率 (FPS)</label>
                <div className="grid grid-cols-5 gap-2">
                  {FPS_OPTIONS.map((fps) => (
                    <button
                      key={fps}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        exportFps === fps
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                      onClick={() => setExportFps(fps)}
                      type="button"
                    >
                      {fps}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">编码格式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      exportCodec === 'vp9'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    onClick={() => setExportCodec('vp9')}
                    type="button"
                  >
                    VP9
                  </button>
                  <button
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      exportCodec === 'h264'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    onClick={() => setExportCodec('h264')}
                    type="button"
                  >
                    H.264
                  </button>
                  <button
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      exportCodec === 'av1'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    onClick={() => setExportCodec('av1')}
                    type="button"
                  >
                    AV1
                  </button>
                  <button
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      exportCodec === 'gif'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    onClick={() => setExportCodec('gif')}
                    type="button"
                  >
                    GIF
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-800/50 rounded-lg">
                <div className="text-xs text-zinc-400">
                  <p className="font-medium text-zinc-300 mb-1">当前导出设置:</p>
                  <p>格式: {exportFormat.toUpperCase()} | 分辨率: {exportResolution} | 帧率: {exportFps}fps | 编码: {exportCodec}</p>
                </div>
              </div>
            </div>
          )}

          {/* 预设管理 */}
          {activeSection === 'presets' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">保存当前配置</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="预设名称..."
                    type="text"
                    value={presetName}
                  />
                  <button
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                    disabled={!presetName.trim()}
                    onClick={handleSavePreset}
                    type="button"
                  >
                    保存
                  </button>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              <div className="space-y-3">
                <span className="block text-sm font-medium text-zinc-300">已保存的预设</span>
                {savedPresets.length === 0 ? (
                  <p className="text-sm text-zinc-500">暂无保存的预设</p>
                ) : (
                  <div className="space-y-2">
                    {(savedPresets as { name: string; timestamp: number }[]).map((preset) => (
                      <div
                        key={preset.name}
                        className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{preset.name}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(preset.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            onClick={() => handleLoadPreset(preset.name)}
                            type="button"
                          >
                            加载
                          </button>
                          <button
                            className="px-3 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                            onClick={() => deletePreset(preset.name)}
                            type="button"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
          <button
            className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            onClick={onClose}
            type="button"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';
