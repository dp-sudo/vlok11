import { useThree } from '@react-three/fiber';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import type { VideoTexture } from 'three';
import { createLogger } from '@/core/Logger';
import {
  downloadBlob as sharedDownloadBlob,
  downloadDataUrl as sharedDownloadDataUrl,
} from '@/shared/utils';

export interface RecordingRef {
  captureVideoFrame: () => void;
  startRecording: (withAudio?: boolean) => void;
  stopRecording: () => void;
}

export type RecordingQuality = 'high' | 'medium' | 'low';

export interface SceneRecorderProps {
  videoTexture: VideoTexture | null;
  recordingQuality?: RecordingQuality;
}

// 录制质量配置
export const RECORDING_QUALITY = {
  high: { fps: 60, bitrate: 8000000 }, // 8Mbps, 60fps - 高质量
  medium: { fps: 30, bitrate: 4000000 }, // 4Mbps, 30fps - 标准
  low: { fps: 30, bitrate: 2000000 }, // 2Mbps, 30fps - 压缩
} as const;

const downloadBlob = (blob: Blob, filename: string): void => {
  sharedDownloadBlob(blob, filename);
};

const getSupportedMimeType = (): string => {
  const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

  return mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? 'video/webm';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 预估文件大小
export const estimateRecordingSize = (
  quality: RecordingQuality,
  durationSeconds: number
): string => {
  const { bitrate } = RECORDING_QUALITY[quality];
  const bytes = (bitrate * durationSeconds) / 8;

  return formatFileSize(bytes);
};

const logger = createLogger({ module: 'SceneRecorder' });

export const SceneRecorder = memo(
  forwardRef<RecordingRef, SceneRecorderProps>(
    ({ videoTexture, recordingQuality = 'medium' }, ref) => {
      const { gl } = useThree();
      const mediaRecorderRef = useRef<MediaRecorder | null>(null);
      const mediaStreamRef = useRef<MediaStream | null>(null);
      const recordedChunksRef = useRef<Blob[]>([]);
      const wasMutedRef = useRef(false);
      const recordingQualityRef = useRef(recordingQuality);

      // 更新录制质量配置
      useEffect(() => {
        recordingQualityRef.current = recordingQuality;
      }, [recordingQuality]);

      useEffect(
        () => () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
              mediaRecorderRef.current.stop();
            } catch (err) {
              logger.warn('Failed to stop media recorder', { error: String(err) });
            }
          }
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch (err) {
                logger.warn('Failed to stop track', { error: String(err) });
              }
            });
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
          recordedChunksRef.current = [];
        },
        []
      );

      const getVideoElement = () => videoTexture?.image;

      const startRecording = (withAudio = false) => {
        if (mediaRecorderRef.current?.state === 'recording') {
          logger.warn('Recording already in progress, ignoring duplicate start');

          return;
        }

        const canvas = gl.domElement;

        if (!canvas) return;

        // 使用当前配置的质量设置
        const quality = recordingQualityRef.current;
        const { fps, bitrate } = RECORDING_QUALITY[quality];

        const canvasStream = canvas.captureStream(fps);
        const tracks = [...canvasStream.getVideoTracks()];

        if (withAudio && videoTexture) {
          const video = getVideoElement();

          if (video) {
            const audioTrack = tryGetAudioTrack(video, wasMutedRef);

            if (audioTrack) tracks.push(audioTrack);
          }
        }

        const combinedStream = new MediaStream(tracks);

        mediaStreamRef.current = combinedStream;

        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: bitrate,
        });

        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });

          downloadBlob(blob, `recording_${quality}_${Date.now()}.webm`);

          const video = getVideoElement();

          if (wasMutedRef.current && video) video.muted = true;

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => {
              track.stop();
            });
            mediaStreamRef.current = null;
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
      };

      const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

      const captureVideoFrame = () => {
        const video = getVideoElement();

        if (!video) {
          return;
        }

        const canvas = document.createElement('canvas');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const url = canvas.toDataURL('image/png', 1.0);

          sharedDownloadDataUrl(url, `frame_${video.currentTime.toFixed(2)}s.png`);
        }
      };

      useImperativeHandle(ref, () => ({ startRecording, stopRecording, captureVideoFrame }));

      return null;
    }
  )
);
const tryGetAudioTrack = (
  video: HTMLVideoElement,
  wasMutedRef: React.RefObject<boolean>
): MediaStreamTrack | null => {
  wasMutedRef.current = video.muted;
  if (video.muted) video.muted = false;

  try {
    const videoWithCapture = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const videoStream =
      videoWithCapture.captureStream?.() ?? videoWithCapture.mozCaptureStream?.() ?? null;
    const audioTrack = videoStream?.getAudioTracks()[0] ?? null;

    if (!audioTrack && wasMutedRef.current) video.muted = true;

    return audioTrack;
  } catch (e) {
    logger.warn('Audio capture failed', { error: String(e) });
    if (wasMutedRef.current) video.muted = true;

    return null;
  }
};

SceneRecorder.displayName = 'SceneRecorder';
