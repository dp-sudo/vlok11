import { RotateCw } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { getEventBus } from '@/core/EventBus';
import { createLogger } from '@/core/Logger';
import {
  getSectionViewService,
  type SectionAxis,
} from '../../scene/services/camera/SectionViewService';
import { Btn, CollapsibleSection, Slider, Toggle } from '../components/ControlComponents';

const logger = createLogger({ module: 'SectionViewPanel' });

interface SectionViewPanelProps {
  config: {
    sectionEnabled?: boolean;
    sectionAxis?: SectionAxis;
    sectionPosition?: number;
    sectionShowHelper?: boolean;
    sectionFlipNormal?: boolean;
  };
  set: <K extends string>(k: K, v: unknown) => void;
}

const SectionViewPanelComponent: React.FC<SectionViewPanelProps> = ({ config, set }) => {
  const eventBus = getEventBus();
  const service = getSectionViewService();
  const [isExpanded, setIsExpanded] = useState(true);

  const isEnabled = config.sectionEnabled ?? false;
  const currentAxis = config.sectionAxis ?? 'y';
  const currentPosition = config.sectionPosition ?? 0;
  const showHelper = config.sectionShowHelper ?? true;

  const handleEnable = useCallback(
    (axis: SectionAxis, position: number) => {
      set('sectionEnabled', true);
      set('sectionAxis', axis);
      set('sectionPosition', position);
      set('sectionShowHelper', true);

      const newConfig = service.createConfig(axis, position);
      service.applySection(newConfig);

      eventBus.emit('camera:section-enabled', { axis, position });
      logger.info(`剖面视图已启用: ${axis}轴 @ ${position}`);
    },
    [set, service, eventBus]
  );

  const handleDisable = useCallback(() => {
    set('sectionEnabled', false);
    service.clearSection();
    eventBus.emit('camera:section-disabled', {});
    logger.info('剖面视图已禁用');
  }, [set, service, eventBus]);

  const handlePositionChange = useCallback(
    (position: number) => {
      set('sectionPosition', position);
      const newConfig = service.createConfig(currentAxis, position, {
        enabled: true,
        showHelper,
      });
      service.applySection(newConfig);
      eventBus.emit('camera:section-position-changed', { position, axis: currentAxis });
    },
    [set, currentAxis, showHelper, service, eventBus]
  );

  const handleAxisChange = useCallback(
    (axis: SectionAxis) => {
      set('sectionAxis', axis);
      const newConfig = service.createConfig(axis, currentPosition, {
        enabled: true,
        showHelper,
      });
      service.applySection(newConfig);
      eventBus.emit('camera:section-axis-changed', { from: currentAxis, to: axis });
      logger.info(`剖面轴已切换: ${currentAxis} -> ${axis}`);
    },
    [set, currentAxis, currentPosition, showHelper, service, eventBus]
  );

  const handleFlipNormal = useCallback(() => {
    const newFlip = !config.sectionFlipNormal;
    set('sectionFlipNormal', newFlip);

    const newConfig = service.createConfig(currentAxis, currentPosition, {
      enabled: true,
      showHelper,
      flipNormal: newFlip,
    });
    service.applySection(newConfig);
    eventBus.emit('camera:section-flip-changed', { flipNormal: newFlip });
  }, [config.sectionFlipNormal, set, currentAxis, currentPosition, showHelper, service, eventBus]);

  const handleToggleHelper = useCallback(() => {
    const newShowHelper = !showHelper;
    set('sectionShowHelper', newShowHelper);

    const newConfig = service.createConfig(currentAxis, currentPosition, {
      enabled: true,
      showHelper: newShowHelper,
    });
    service.applySection(newConfig);
  }, [showHelper, set, currentAxis, currentPosition, service]);

  const presetPositions = service.getPresetPositions(currentAxis);

  return (
    <CollapsibleSection
      expanded={isExpanded}
      icon={<RotateCw className="w-3.5 h-3.5" />}
      onToggle={() => setIsExpanded(!isExpanded)}
      title="剖面视图"
    >
      {/* 启用开关 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-400">启用剖面</span>
        <Toggle
          checked={isEnabled}
          label=""
          onChange={(checked: boolean) => {
            if (checked) {
              handleEnable('y', 0);
            } else {
              handleDisable();
            }
          }}
        />
      </div>

      {isEnabled && (
        <>
          {/* 轴选择 */}
          <div className="space-y-1.5 mb-3">
            <span className="text-xs text-zinc-400">剖面轴</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['x', 'y', 'z'] as SectionAxis[]).map((axis) => (
                <Btn
                  key={axis}
                  active={currentAxis === axis}
                  onClick={() => handleAxisChange(axis)}
                  small
                >
                  {axis.toUpperCase()}轴
                </Btn>
              ))}
            </div>
          </div>

          {/* 位置滑块 */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">位置</span>
              <span className="text-xs text-zinc-500">{currentPosition.toFixed(1)}</span>
            </div>
            <Slider
              label=""
              max={50}
              min={-50}
              onChange={(v: number) => handlePositionChange(v)}
              step={0.1}
              value={currentPosition}
            />
          </div>

          {/* 翻转法线 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400">翻转方向</span>
            <Toggle
              checked={config.sectionFlipNormal ?? false}
              label=""
              onChange={handleFlipNormal}
            />
          </div>

          {/* 显示辅助平面 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400">显示辅助平面</span>
            <Toggle checked={showHelper} label="" onChange={handleToggleHelper} />
          </div>

          {/* 预设位置 */}
          <div className="space-y-1.5 mb-3">
            <span className="text-xs text-zinc-400">快速位置</span>
            <div className="grid grid-cols-5 gap-1">
              {presetPositions.map((pos) => (
                <Btn
                  key={pos}
                  active={Math.abs(currentPosition - pos) < 0.1}
                  onClick={() => handlePositionChange(pos)}
                  small
                >
                  {pos}
                </Btn>
              ))}
            </div>
          </div>

          {/* 禁用按钮 */}
          <Btn active={false} onClick={handleDisable}>
            禁用剖面
          </Btn>
        </>
      )}
    </CollapsibleSection>
  );
};

export const SectionViewPanel = memo(SectionViewPanelComponent);

export default SectionViewPanel;
