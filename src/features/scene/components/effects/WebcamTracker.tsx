import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs';
import { useEffect, useRef, useState } from 'react';

import { getEventBus } from '@/core/EventBus';
import { TrackingEvents } from '@/core/EventTypes';
import { createLogger } from '@/core/Logger';
import { FONT_SIZE, OPACITY, RADII, SPACING, Z_INDEX } from '@/shared/constants/ui';

import { COORDINATE_TRANSFORM, WEBCAM } from './constants';

const logger = createLogger({ module: 'WebcamTracker' });
const useFaceModel = (enabled: boolean) => {
  const [model, setModel] = useState<faceDetection.FaceDetector | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).__TEST_MODE__ === true) {
      return;
    }

    if (!enabled) return;

    const initModel = async () => {
      try {
        await tf.ready();
        const modelType = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig: faceDetection.MediaPipeFaceDetectorMediaPipeModelConfig = {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        };

        const detector = await faceDetection.createDetector(modelType, detectorConfig);

        setModel(detector);
        logger.info('Face detection model loaded');
      } catch (error) {
        logger.warn('Failed to load face detection model (Head tracking disabled)', { error });
      }
    };

    void initModel();
  }, [enabled]);

  return model;
};
const useWebcamStream = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).__TEST_MODE__ === true) {
      return;
    }

    const startWebcam = async () => {
      // Check if browser supports media devices
      if (!navigator.mediaDevices?.getUserMedia) {
        logger.warn('Webcam not supported or permission denied');

        return;
      }

      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: WEBCAM.DEFAULT_RESOLUTION.WIDTH,
              height: WEBCAM.DEFAULT_RESOLUTION.HEIGHT,
              facingMode: WEBCAM.FACING_MODE,
            },
          });

          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            void videoRef.current?.play();
            setIsTracking(true);
          };
        } catch (error) {
           // Provide a cleaner warning for common "Device not found" vs generic errors
           if ((error as Error).name === 'NotFoundError' || (error as Error).name === 'NotAllowedError') {
              logger.warn('Webcam access failed (Device not found or denied)', { reason: (error as Error).message });
           } else {
              logger.error('Failed to access webcam', { error });
           }
        }
      }
    };

    void startWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;

        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef]);

  return isTracking;
};

export const WebcamTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isTracking = useWebcamStream(videoRef);
  const model = useFaceModel(isTracking); // Only load model if tracking is active

  useEffect(() => {
    let animationFrameId: number;
    let isCancelled = false;

    const trackFaces = async () => {
      if (
        model &&
        videoRef.current &&
        isTracking &&
        videoRef.current.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA
      ) {
        try {
          const faces = await model.estimateFaces(videoRef.current, { flipHorizontal: false });

          if (faces.length > 0 && !isCancelled) {
            const face = faces[0];

            if (!face) return;

            const { box } = face;

            const { videoWidth, videoHeight } = videoRef.current;

            if (!videoWidth || !videoHeight) return;

            const centerX = box.xMin + box.width / 2;
            const centerY = box.yMin + box.height / 2;

            const x =
              (centerX / videoWidth) * COORDINATE_TRANSFORM.NORMALIZATION_FACTOR -
              COORDINATE_TRANSFORM.NORMALIZATION_OFFSET;
            const y =
              -(centerY / videoHeight) * COORDINATE_TRANSFORM.NORMALIZATION_FACTOR +
              COORDINATE_TRANSFORM.NORMALIZATION_OFFSET;

            const widthRatio = box.width / videoWidth;
            const z = (1 - widthRatio) * COORDINATE_TRANSFORM.DEPTH_SCALE_FACTOR;

            getEventBus().emit(TrackingEvents.POINT_3D, {
              x,
              y,
              z,
              confidence: 1,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          logger.warn('Face tracking error', { error });
        }
        if (!isCancelled) {
          animationFrameId = requestAnimationFrame(() => void trackFaces());
        }
      }
    };

    if (isTracking && model) {
      void trackFaces();
    }

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;

        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [model, isTracking]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).__TEST_MODE__ === true) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: SPACING.LG,
        left: SPACING.LG,
        width: WEBCAM.TRACKER_WIDTH,
        zIndex: Z_INDEX.WEBCAM_TRACKER,
        opacity: OPACITY.TRACKER_OVERLAY,
      }}
    >
      <video
        muted
        playsInline
        ref={videoRef}
        style={{ width: '100%', borderRadius: RADII.MD, transform: 'scaleX(-1)' }}
      />
      <div
        style={{
          fontSize: FONT_SIZE.TINY,
          color: 'white',
          background: 'rgba(0,0,0,0.5)',
          padding: SPACING.XS,
        }}
      >
        Webcam Tracking Active
      </div>
    </div>
  );
};
