import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';

import { getEventBus } from '@/core/EventBus';
import { TrackingEvents } from '@/core/EventTypes';
import { useSceneStore } from '@/stores/sharedStore';

import { PARALLAX } from './constants';

import type { ReactNode } from 'react';
import type { Group } from 'three';

interface ParallaxRigProps {
  children?: ReactNode;
  enabled?: boolean;
}

interface TrackingPoint {
  x: number;
  y: number;
  z: number;
}

const PARALLAX_DEFAULTS = {
  TRANSLATION_SCALE: 3.0,
  ROTATION_SCALE: 0.2,
  DEPTH_SCALE: 2.0,
} as const;

const ParallaxRigComponent = ({ children, enabled = true }: ParallaxRigProps) => {
  const groupRef = useRef<Group>(null);
  const targetPosition = useRef(new Vector3(0, 0, 0));
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentPosition = useRef(new Vector3(0, 0, 0));
  const currentRotation = useRef({ x: 0, y: 0 });
  const lastTrackingPoint = useRef<TrackingPoint | null>(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  const parallaxScale = useSceneStore((s) => s.config.parallaxScale);
  const effectiveScale = useMemo(() => parallaxScale ?? 1, [parallaxScale]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      mousePosition.current = { x, y };

      const translationScale = PARALLAX_DEFAULTS.TRANSLATION_SCALE * effectiveScale;
      const rotationScale = PARALLAX_DEFAULTS.ROTATION_SCALE * effectiveScale;

      targetPosition.current.set(-x * translationScale, -y * translationScale, 0);

      targetRotation.current = {
        x: y * rotationScale,
        y: -x * rotationScale,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const bus = getEventBus();
    const handleTracking = (payload: unknown) => {
      const p = payload as TrackingPoint | null;

      if (!p || typeof p.x !== 'number') return;

      lastTrackingPoint.current = p;

      const translationScale = PARALLAX_DEFAULTS.TRANSLATION_SCALE * effectiveScale;
      const rotationScale = PARALLAX_DEFAULTS.ROTATION_SCALE * effectiveScale;

      targetPosition.current.set(
        -p.x * translationScale,
        -p.y * translationScale,
        p.z * PARALLAX_DEFAULTS.DEPTH_SCALE
      );

      targetRotation.current = {
        x: p.y * rotationScale,
        y: -p.x * rotationScale,
      };
    };

    const off = bus.on(TrackingEvents.POINT_3D, handleTracking);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      off();
    };
  }, [enabled, effectiveScale]);

  useFrame(() => {
    if (!enabled || !groupRef.current) return;

    const lerpFactor = lastTrackingPoint.current
      ? PARALLAX.ACTIVE_LERP_FACTOR
      : PARALLAX.LERP_FACTOR;

    currentPosition.current.lerp(targetPosition.current, lerpFactor);
    currentRotation.current.x +=
      (targetRotation.current.x - currentRotation.current.x) * lerpFactor;
    currentRotation.current.y +=
      (targetRotation.current.y - currentRotation.current.y) * lerpFactor;

    groupRef.current.position.copy(currentPosition.current);
    groupRef.current.rotation.x = currentRotation.current.x;
    groupRef.current.rotation.y = currentRotation.current.y;
  });

  useEffect(() => {
    if (!enabled && groupRef.current) {
      targetPosition.current.set(0, 0, 0);
      targetRotation.current = { x: 0, y: 0 };
    }
  }, [enabled]);

  if (!enabled) {
    return children ?? null;
  }

  return <group ref={groupRef}>{children}</group>;
};

export const ParallaxRig = memo(ParallaxRigComponent);

ParallaxRig.displayName = 'ParallaxRig';
