import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Pause,
  Play,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { formatTime } from '../constants';

const PERCENT = 100;
const BUFFER_OFFSET = 15;

interface VideoControlsProps {
  isLooping: boolean;
  onDragEnd: () => void;
  onDragStart: () => void;
  onSeek?: (time: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSliderChange: (value: number) => void;
  onToggleLoop: () => void;
  onToggleMute: () => void;
  onTogglePlay?: () => void;
  playbackRate: number;
  sliderValue: number;
  videoMuted: boolean;
  videoState: { currentTime: number; duration: number; isPlaying: boolean };
}

interface PlayButtonProps {
  isPlaying: boolean;
  onClick?: () => void;
}

const PlayButton = memo<PlayButtonProps>(({ isPlaying, onClick }) => (
  <button
    className="relative w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95 transition-all duration-200 ease-out group"
    onClick={onClick}
    title={isPlaying ? '暂停' : '播放'}
  >
    <div className="absolute inset-0 rounded-full bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    {isPlaying ? (
      <Pause className="w-5 h-5 text-cyan-400 fill-cyan-400 relative z-10" />
    ) : (
      <Play className="w-5 h-5 text-cyan-400 fill-cyan-400 ml-1 relative z-10" />
    )}
  </button>
));

PlayButton.displayName = 'PlayButton';

interface IconButtonProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  label?: string;
  onClick: () => void;
  title: string;
}

const IconButton = memo<IconButtonProps>(({ icon: Icon, onClick, title, active, label }) => (
  <button
    className={`relative p-2 rounded-lg transition-all duration-200 group flex items-center gap-2 ${
      active
        ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
        : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-500/30 border border-transparent'
    }`}
    onClick={onClick}
    title={title}
  >
    <Icon className="w-4 h-4" />
    {label && <span className="text-[10px] font-mono font-medium">{label}</span>}
  </button>
));

IconButton.displayName = 'IconButton';

interface TimeTooltipProps {
  duration: number;
  hoverTime: number;
  isVisible: boolean;
}

const TimeTooltip = memo<TimeTooltipProps>(({ hoverTime, duration, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className="absolute -top-10 transform -translate-x-1/2 px-3 py-1.5 rounded-sm bg-zinc-950/95 backdrop-blur-md text-[10px] text-cyan-400 font-mono tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-cyan-500/30 pointer-events-none z-20 animate-in fade-in duration-150"
      style={{ left: `${(hoverTime / (duration || 1)) * PERCENT}%` }}
    >
      {formatTime(hoverTime)}
      <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-950 border-r border-b border-cyan-500/30" />
    </div>
  );
});

TimeTooltip.displayName = 'TimeTooltip';

interface ProgressTrackProps {
  bufferPercent: number;
  isDragging: boolean;
  isHovering: boolean;
  progressPercent: number;
}

const ProgressTrack = memo<ProgressTrackProps>(
  ({ progressPercent, bufferPercent, isHovering, isDragging }) => {
    // 生成刻度标记
    const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

    return (
      <>
        {/* Background Track with ticks */}
        <div className="absolute left-0 right-0 h-3 bg-zinc-800 border border-zinc-700 rounded-full overflow-hidden shadow-inner">
          {/* 刻度标记 */}
          <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
            {ticks.map((tick) => (
              <div
                key={tick}
                className={`w-px ${tick % 50 === 0 ? 'h-1.5 bg-zinc-500' : 'h-1 bg-zinc-600/50'}`}
              />
            ))}
          </div>

          {/* Buffer Bar */}
          <div
            className="absolute left-0 top-0 h-full bg-zinc-700/80 rounded-full transition-all duration-300"
            style={{ width: `${bufferPercent}%` }}
          />

          {/* Progress Bar - brighter and more visible */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)] transition-all duration-75 ease-out"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </div>

        {/* Thumb - larger and easier to grab */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full cursor-grab active:cursor-grabbing bg-zinc-900 border-[3px] border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)] transition-all duration-150 ease-out ${
            isHovering || isDragging ? 'scale-125' : 'scale-100'
          } group-hover/slider:scale-115`}
          style={{ left: `${progressPercent}%` }}
        >
          {/* Inner glow */}
          <div
            className={`absolute inset-0.5 rounded-full shadow-[inset_0_0_8px_rgba(255,255,255,0.5)] ${isDragging ? 'bg-cyan-300' : 'bg-cyan-400'}`}
          />
          {/* Center dot */}
          <div
            className={`absolute inset-2 rounded-full ${isDragging ? 'bg-cyan-200' : 'bg-white'}`}
          />
        </div>

        {/* Percentage tooltip when hovering */}
        {isHovering && !isDragging && (
          <div
            className="absolute -top-6 transform -translate-x-1/2 text-[10px] text-cyan-400 font-mono bg-zinc-900/90 px-1.5 py-0.5 rounded border border-cyan-500/30"
            style={{ left: `${progressPercent}%` }}
          >
            {Math.round(progressPercent)}%
          </div>
        )}
      </>
    );
  }
);

ProgressTrack.displayName = 'ProgressTrack';

export const VideoControls: React.FC<VideoControlsProps> = memo(
  ({
    videoState,
    sliderValue,
    videoMuted,
    isLooping,
    playbackRate,
    onTogglePlay,
    onSeek,
    onSliderChange,
    onDragStart,
    onDragEnd,
    onToggleMute,
    onToggleLoop,
    onSetPlaybackRate,
  }) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverTime, setHoverTime] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const progressPercent = (sliderValue / (videoState.duration || 1)) * PERCENT;
    const bufferPercent = Math.min(progressPercent + BUFFER_OFFSET, PERCENT);

    // Calculate time from mouse/touch position
    const calculateTimeFromPosition = useCallback(
      (clientX: number) => {
        if (!trackRef.current) return 0;
        const rect = trackRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));

        return percent * (videoState.duration || 0);
      },
      [videoState.duration]
    );

    // Handle mouse hover for tooltip
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const time = calculateTimeFromPosition(e.clientX);

        setHoverTime(time);
      },
      [calculateTimeFromPosition]
    );

    // Start dragging
    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        onDragStart();

        const time = calculateTimeFromPosition(e.clientX);

        onSliderChange(time);
        onSeek?.(time);
      },
      [calculateTimeFromPosition, onDragStart, onSliderChange, onSeek]
    );

    // Handle drag movement
    useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        const time = calculateTimeFromPosition(e.clientX);

        onSliderChange(time);
        onSeek?.(time);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        onDragEnd();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, calculateTimeFromPosition, onSliderChange, onSeek, onDragEnd]);

    // Touch start
    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        onDragStart();

        const touch = e.touches[0];
        const time = calculateTimeFromPosition(touch.clientX);

        onSliderChange(time);
        onSeek?.(time);
      },
      [calculateTimeFromPosition, onDragStart, onSliderChange, onSeek]
    );

    // Touch drag
    useEffect(() => {
      if (!isDragging) return;

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const time = calculateTimeFromPosition(touch.clientX);

        onSliderChange(time);
        onSeek?.(time);
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        onDragEnd();
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [isDragging, calculateTimeFromPosition, onSliderChange, onSeek, onDragEnd]);

    const handleFrameStep = useCallback(
      (direction: 'prev' | 'next') => {
        const step = 1 / 30; // Assuming 30fps
        const newTime = sliderValue + (direction === 'next' ? step : -step);

        onSeek?.(Math.max(0, Math.min(newTime, videoState.duration)));
      },
      [sliderValue, videoState.duration, onSeek]
    );

    const toggleSpeed = useCallback(() => {
      const rates = [0.5, 1.0, 2.0];
      const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;

      onSetPlaybackRate(rates[nextIdx]);
    }, [playbackRate, onSetPlaybackRate]);

    return (
      <div className="px-4 py-4 border-b border-cyan-500/20 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 backdrop-blur-md select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        {/* Top Controls: Play/Pause/Seek + Volume */}
        <div className="flex items-center gap-4 mb-3">
          <PlayButton isPlaying={videoState.isPlaying} onClick={onTogglePlay} />

          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-cyan-400 transition-colors"
              onClick={() => handleFrameStep('prev')}
              title="上一帧"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-cyan-400 transition-colors"
              onClick={() => handleFrameStep('next')}
              title="下一帧"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 px-2">
            {/* Metadata */}
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
              <span className="text-cyan-400 font-bold">{formatTime(sliderValue)}</span>
              <span>{formatTime(videoState.duration)}</span>
            </div>

            {/* Custom Slider Track - supports real-time dragging */}
            <div
              ref={trackRef}
              className="relative h-8 flex items-center cursor-pointer group/slider"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => !isDragging && setIsHovering(false)}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <TimeTooltip
                duration={videoState.duration}
                hoverTime={hoverTime}
                isVisible={isHovering && !isDragging}
              />

              <ProgressTrack
                bufferPercent={bufferPercent}
                isDragging={isDragging}
                isHovering={isHovering}
                progressPercent={progressPercent}
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar: Settings */}
        <div className="flex items-center justify-between pl-16 pr-2">
          <div className="flex items-center gap-1">
            <IconButton
              active={isLooping}
              icon={Repeat}
              label={isLooping ? 'LOOP' : ''}
              onClick={onToggleLoop}
              title="循环播放"
            />
            <IconButton
              active={playbackRate !== 1.0}
              icon={Gauge}
              label={`${playbackRate}x`}
              onClick={toggleSpeed}
              title="播放速度"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-zinc-800 mx-2" />
            <IconButton
              active={videoMuted}
              icon={videoMuted ? VolumeX : Volume2}
              onClick={onToggleMute}
              title={videoMuted ? '取消静音' : '静音'}
            />
          </div>
        </div>
      </div>
    );
  }
);

VideoControls.displayName = 'VideoControls';
