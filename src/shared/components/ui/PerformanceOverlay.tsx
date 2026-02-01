import { Activity } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { PerformanceMetrics } from '@/core/PerformanceMonitor';
import { getPerformanceMonitor } from '@/core/PerformanceMonitor';
import { BYTES_PER_KB } from '@/shared/constants';

interface PerformanceOverlayProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  visible?: boolean;
}

const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const formatMemory = (bytes?: number): string => {
  if (!bytes) return 'N/A';
  const mb = bytes / BYTES_PER_MB;

  return `${mb.toFixed(1)} MB`;
};
const FPS_THRESHOLDS = {
  GOOD: 55,
  FAIR: 30,
} as const;
const getFpsColorHex = (fps: number): string => {
  if (fps >= FPS_THRESHOLDS.GOOD) return '#34d399';
  if (fps >= FPS_THRESHOLDS.FAIR) return '#facc15';

  return '#f87171';
};
const getMemoryBarColor = (percent: number): string => {
  if (percent > MEMORY_THRESHOLDS.HIGH) return '#ef4444';
  if (percent > MEMORY_THRESHOLDS.MEDIUM) return '#eab308';

  return '#10b981';
};
const getPositionStyles = (pos: string): React.CSSProperties => {
  switch (pos) {
    case 'top-left':
      return { top: '1rem', left: '1rem' };
    case 'top-right':
      return { top: '1rem', right: '1rem' };
    case 'bottom-left':
      return { bottom: '1rem', left: '1rem' };
    case 'bottom-right':
      return { bottom: '1rem', right: '1rem' };
    default:
      return { bottom: '1rem', left: '1rem' };
  }
};
const MEMORY_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  PERCENT_MULTIPLIER: 100,
} as const;
const METRICS_UPDATE_INTERVAL_MS = 500;

export const PerformanceOverlay = memo(
  ({ visible = true, position = 'bottom-left' }: PerformanceOverlayProps) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({ fps: 0, frameTime: 0 });
    const [isExpanded, setIsExpanded] = useState(false);
    const monitorRef = useRef(getPerformanceMonitor());
    const isStartedRef = useRef(false);

    useEffect(() => {
      const monitor = monitorRef.current;

      if (visible && !isStartedRef.current) {
        monitor.start();
        isStartedRef.current = true;
      }

      if (!visible) return;

      const interval = setInterval(() => {
        setMetrics(monitor.getMetrics());
      }, METRICS_UPDATE_INTERVAL_MS);

      return () => {
        clearInterval(interval);
      };
    }, [visible]);

    useEffect(
      () => () => {
        if (isStartedRef.current) {
          monitorRef.current.stop();
          isStartedRef.current = false;
        }
      },
      []
    );

    const toggleExpanded = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    if (!visible) return null;

    const memoryPercent =
      metrics.memoryUsed && metrics.memoryTotal
        ? (metrics.memoryUsed / metrics.memoryTotal) * MEMORY_THRESHOLDS.PERCENT_MULTIPLIER
        : null;

    return (
      <div
        aria-label="切换性能面板详情"
        onClick={toggleExpanded}
        onKeyDown={(e) => e.key === 'Enter' && toggleExpanded()}
        role="button"
        style={{
          position: 'absolute',
          zIndex: 50,
          userSelect: 'none',
          ...getPositionStyles(position),
        }}
        tabIndex={0}
      >
        <div
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)')}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)')}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            cursor: 'pointer',
            transition: 'all 200ms',
            minWidth: isExpanded ? '140px' : '70px',
          }}
        >
          <div
            style={{
              padding: '0.375rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Activity style={{ width: '0.75rem', height: '0.75rem', color: '#a1a1aa' }} />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: getFpsColorHex(metrics.fps),
              }}
            >
              {metrics.fps}
            </span>
            <span style={{ color: '#71717a', fontSize: '0.625rem' }}>FPS</span>
          </div>

          {isExpanded ? (
            <div
              style={{
                padding: '0 0.5rem 0.5rem',
                borderTop: '1px solid rgba(63, 63, 70, 0.5)',
                paddingTop: '0.375rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem' }}
              >
                <span style={{ color: '#71717a' }}>Frame</span>
                <span style={{ color: '#d4d4d8', fontFamily: 'monospace' }}>
                  {metrics.frameTime.toFixed(1)}ms
                </span>
              </div>

              {metrics.memoryUsed ? (
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem' }}
                >
                  <span style={{ color: '#71717a' }}>Memory</span>
                  <span style={{ color: '#d4d4d8', fontFamily: 'monospace' }}>
                    {formatMemory(metrics.memoryUsed)}
                  </span>
                </div>
              ) : null}

              {memoryPercent !== null && (
                <div
                  style={{
                    height: '0.25rem',
                    backgroundColor: '#27272a',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      transition: 'all 300ms',
                      backgroundColor: getMemoryBarColor(memoryPercent),
                      width: `${Math.min(memoryPercent, MEMORY_THRESHOLDS.PERCENT_MULTIPLIER)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

PerformanceOverlay.displayName = 'PerformanceOverlay';
