import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import type { Points } from 'three';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, PointsMaterial } from 'three';
import { ANIMATION, PARTICLE, PARTICLE_COLORS, STAR } from './constants';

export type ParticleType = 'dust' | 'snow' | 'stars' | 'firefly' | 'rain' | 'leaves';

interface AtmosphereParticlesProps {
  enabled?: boolean;
  particleType?: ParticleType;
}

interface ParticleData {
  colors: Float32Array;
  geometry: BufferGeometry;
  phases: Float32Array;
  positions: Float32Array;
  sizes: Float32Array;
  velocities: Float32Array;
}

const createParticleData = (count: number, type: ParticleType): ParticleData => {
  const positions = new Float32Array(count * ANIMATION.BUFFER_STRIDE_3);
  const velocities = new Float32Array(count * ANIMATION.BUFFER_STRIDE_3);
  const colors = new Float32Array(count * ANIMATION.BUFFER_STRIDE_3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const geometry = new BufferGeometry();

  const spread =
    type === 'stars' ? PARTICLE.SPREAD * PARTICLE.STARS_SPREAD_MULTIPLIER : PARTICLE.SPREAD;

  for (let i = 0; i < count; i++) {
    const i3 = i * ANIMATION.BUFFER_STRIDE_3;

    positions[i3] = (Math.random() - ANIMATION.HALF) * spread;
    positions[i3 + 1] = (Math.random() - ANIMATION.HALF) * spread;
    positions[i3 + 2] = (Math.random() - ANIMATION.HALF) * spread;

    phases[i] = Math.random() * Math.PI * ANIMATION.PHASE_TWO_PI;

    initializeParticle(type, i, i3, velocities, colors, sizes);
  }

  geometry.setAttribute('position', new BufferAttribute(positions, ANIMATION.BUFFER_STRIDE_3));
  geometry.setAttribute('color', new BufferAttribute(colors, ANIMATION.BUFFER_STRIDE_3));
  geometry.setAttribute('size', new BufferAttribute(sizes, ANIMATION.BUFFER_STRIDE_1));

  return { geometry, positions, velocities, colors, sizes, phases };
};

const initDust = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
): void => {
  const color = new Color();

  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.DUST_BROWNIAN_STRENGTH;
  velocities[i3 + 1] = Math.random() * ANIMATION.DUST_BROWNIAN_STRENGTH;
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.DUST_BROWNIAN_STRENGTH;
  color.set(
    Math.random() > ANIMATION.HALF ? PARTICLE_COLORS.DUST.BASE : PARTICLE_COLORS.DUST.VARIANT1
  );
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
  sizes[index] = ANIMATION.DUST_SIZE_BASE + Math.random() * ANIMATION.DUST_SIZE_RANGE;
};

const initSnow = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
): void => {
  const color = new Color();

  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.SNOW_WIND_STRENGTH;
  velocities[i3 + 1] = -(ANIMATION.SNOW_FALL_BASE + Math.random() * ANIMATION.SNOW_FALL_RANGE);
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.SNOW_WIND_STRENGTH;
  color.set(
    Math.random() > ANIMATION.SNOW_WHITE_THRESHOLD
      ? PARTICLE_COLORS.SNOW.BASE
      : PARTICLE_COLORS.SNOW.SHADOW
  );
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
  sizes[index] = ANIMATION.SNOW_SIZE_BASE + Math.random() * ANIMATION.SNOW_SIZE_VARIATION;
};

const initStars = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
): void => {
  const color = new Color();

  velocities[i3] = 0;
  velocities[i3 + 1] = 0;
  velocities[i3 + 2] = 0;
  const colorRand = Math.random();

  if (colorRand < ANIMATION.STAR_COLOR_BLUE_THRESHOLD) color.set(PARTICLE_COLORS.STAR.WHITE);
  else if (colorRand < ANIMATION.STAR_COLOR_WARM_THRESHOLD) color.set(PARTICLE_COLORS.STAR.BLUE);
  else color.set(PARTICLE_COLORS.STAR.WARM);
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
  sizes[index] = STAR.SIZE_MIN + Math.random() * STAR.SIZE_RANGE;
};

const initFirefly = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
): void => {
  const color = new Color();

  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.FIREFLY_DRIFT;
  velocities[i3 + 1] = (Math.random() - ANIMATION.HALF) * ANIMATION.FIREFLY_DRIFT;
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.FIREFLY_DRIFT;
  color.set(
    Math.random() > ANIMATION.FIREFLY_CORE_THRESHOLD
      ? PARTICLE_COLORS.FIREFLY.GLOW
      : PARTICLE_COLORS.FIREFLY.TRAIL
  );
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
  sizes[index] = ANIMATION.FIREFLY_SIZE_BASE + Math.random() * ANIMATION.FIREFLY_SIZE_RANGE;
};

const initRain = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
): void => {
  const color = new Color();

  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.RAIN_WIND_STRENGTH;
  velocities[i3 + 1] = -(ANIMATION.RAIN_FALL_BASE + Math.random() * ANIMATION.RAIN_FALL_RANGE);
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.RAIN_WIND_STRENGTH;
  color.set(
    Math.random() > ANIMATION.HALF ? PARTICLE_COLORS.RAIN.BASE : PARTICLE_COLORS.RAIN.LIGHT
  );
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
  sizes[index] = ANIMATION.RAIN_SIZE_BASE + Math.random() * ANIMATION.RAIN_SIZE_RANGE;
};

const initLeaves = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
): void => {
  const color = new Color();

  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.LEAVES_WIND_STRENGTH;
  velocities[i3 + 1] = -(ANIMATION.LEAVES_FALL_BASE + Math.random() * ANIMATION.LEAVES_FALL_RANGE);
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.LEAVES_WIND_STRENGTH;
  const leafRand = Math.random();

  if (leafRand < ANIMATION.LEAVES_GREEN_THRESHOLD) color.set(PARTICLE_COLORS.LEAVES.GREEN);
  else if (leafRand < ANIMATION.LEAVES_YELLOW_THRESHOLD) color.set(PARTICLE_COLORS.LEAVES.YELLOW);
  else if (leafRand < ANIMATION.LEAVES_ORANGE_THRESHOLD) color.set(PARTICLE_COLORS.LEAVES.ORANGE);
  else color.set(PARTICLE_COLORS.LEAVES.RED);
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
  sizes[index] = ANIMATION.LEAVES_SIZE_BASE + Math.random() * ANIMATION.LEAVES_SIZE_RANGE;
};

const initializeParticle = (
  type: ParticleType,
  index: number,
  i3: number,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
): void => {
  switch (type) {
    case 'dust':
      initDust(i3, index, velocities, colors, sizes);
      break;
    case 'snow':
      initSnow(i3, index, velocities, colors, sizes);
      break;
    case 'stars':
      initStars(i3, index, velocities, colors, sizes);
      break;
    case 'firefly':
      initFirefly(i3, index, velocities, colors, sizes);
      break;
    case 'rain':
      initRain(i3, index, velocities, colors, sizes);
      break;
    case 'leaves':
      initLeaves(i3, index, velocities, colors, sizes);
      break;
  }
};

const updateParticles = (
  data: ParticleData,
  count: number,
  time: number,
  spread: number,
  type: ParticleType
): void => {
  const { positions, velocities, phases, sizes } = data;
  const halfSpread = spread / ANIMATION.PHASE_TWO_PI;

  for (let i = 0; i < count; i++) {
    const i3 = i * ANIMATION.BUFFER_STRIDE_3;
    const phase = phases[i] ?? 0;

    let posX = positions[i3] ?? 0;
    let posY = positions[i3 + 1] ?? 0;
    let posZ = positions[i3 + 2] ?? 0;
    const velX = velocities[i3] ?? 0;
    const velY = velocities[i3 + 1] ?? 0;
    const velZ = velocities[i3 + 2] ?? 0;

    updateParticleByType(
      type,
      time,
      phase,
      velX,
      velY,
      velZ,
      sizes,
      i,
      { posX, posY, posZ },
      (p) => {
        ({ posX, posY, posZ } = p);
      }
    );

    posX = wrapPosition(posX, halfSpread);
    posZ = wrapPosition(posZ, halfSpread);
    if (posY < -halfSpread) {
      posY = halfSpread;
      posX = (Math.random() - ANIMATION.HALF) * spread;
      posZ = (Math.random() - ANIMATION.HALF) * spread;
    }
    if (posY > halfSpread) posY = -halfSpread;

    positions[i3] = posX;
    positions[i3 + 1] = posY;
    positions[i3 + 2] = posZ;
  }
};

const wrapPosition = (pos: number, half: number): number => {
  if (pos > half) return -half;
  if (pos < -half) return half;

  return pos;
};

const updateParticleByType = (
  type: ParticleType,
  time: number,
  phase: number,
  velX: number,
  velY: number,
  velZ: number,
  sizes: Float32Array,
  i: number,
  pos: { posX: number; posY: number; posZ: number },
  setPos: (p: { posX: number; posY: number; posZ: number }) => void
): void => {
  let { posX, posY, posZ } = pos;

  switch (type) {
    case 'dust':
      posX += velX + Math.sin(time + phase) * ANIMATION.DUST_BROWNIAN_STRENGTH;
      posY +=
        velY +
        Math.cos(time * ANIMATION.DUST_TIME_FACTOR_Y + phase) * ANIMATION.DUST_BROWNIAN_STRENGTH;
      posZ +=
        velZ +
        Math.sin(time * ANIMATION.DUST_TIME_FACTOR_Z + phase) * ANIMATION.DUST_BROWNIAN_STRENGTH;
      break;
    case 'snow':
      posX += velX + Math.sin(time * ANIMATION.DUST_TIME_FACTOR_Z + phase) * ANIMATION.SNOW_DRIFT;
      posY += velY;
      posZ +=
        velZ +
        Math.cos(time * ANIMATION.FIREFLY_PULSE_MIN + phase) *
          ANIMATION.SNOW_DRIFT *
          ANIMATION.HALF;
      break;
    case 'stars':
      {
        const twinkle =
          STAR.TWINKLE_BASE +
          STAR.TWINKLE_AMPLITUDE * Math.sin(time * (1 + phase * ANIMATION.HALF) + phase);

        sizes[i] =
          (STAR.SIZE_MIN + (phase / (Math.PI * ANIMATION.PHASE_TWO_PI)) * STAR.SIZE_RANGE) *
          (STAR.SIZE_BASE_FACTOR + STAR.SIZE_TWINKLE_FACTOR * twinkle);
      }
      break;
    case 'firefly':
      {
        const isPaused =
          Math.sin(
            time * ANIMATION.FIREFLY_PULSE_MIN + phase * ANIMATION.FIREFLY_PAUSE_PHASE_MULT
          ) > ANIMATION.SNOW_WHITE_THRESHOLD;

        if (!isPaused) {
          posX += velX;
          posY +=
            velY +
            Math.sin(time * ANIMATION.FIREFLY_TIME_MULTIPLIER + phase) *
              ANIMATION.FIREFLY_VERTICAL_WAVE;
          posZ += velZ;
        }
        const pulse =
          ANIMATION.FIREFLY_PULSE_MIN +
          ANIMATION.SNOW_WHITE_THRESHOLD *
            (ANIMATION.HALF +
              ANIMATION.HALF * Math.sin(time * ANIMATION.FIREFLY_PULSE_SPEED + phase));

        sizes[i] =
          (ANIMATION.FIREFLY_SIZE_BASE + Math.random() * ANIMATION.FIREFLY_SIZE_JITTER) * pulse;
      }
      break;
    case 'rain':
      posX +=
        velX + Math.sin(time * ANIMATION.RAIN_WAVE_SPEED + phase) * ANIMATION.RAIN_WAVE_STRENGTH;
      posY += velY;
      posZ += velZ;
      break;
    case 'leaves':
      posX +=
        velX + Math.sin(time * ANIMATION.LEAVES_SWAY_SPEED_X + phase) * ANIMATION.LEAVES_SWAY_X;
      posY +=
        velY +
        Math.sin(time * ANIMATION.LEAVES_SWAY_SPEED_Y + phase * ANIMATION.PHASE_TWO_PI) *
          ANIMATION.LEAVES_SWAY_Y;
      posZ +=
        velZ + Math.cos(time * ANIMATION.LEAVES_SWAY_SPEED_Z + phase) * ANIMATION.LEAVES_SWAY_Z;
      break;
  }
  setPos({ posX, posY, posZ });
};

const RAIN_COUNT = 600;
const MATERIAL_SIZE_RAIN = 0.08;
const MATERIAL_SIZE_DEFAULT = 0.2;
const MATERIAL_OPACITY_RAIN = 0.6;
const MATERIAL_OPACITY_DEFAULT = 0.8;

const AtmosphereParticlesComponent = ({
  enabled = true,
  particleType = 'dust',
}: AtmosphereParticlesProps) => {
  const pointsRef = useRef<Points>(null);
  const count = particleType === 'rain' ? RAIN_COUNT : PARTICLE.COUNT;
  const spread =
    particleType === 'stars' ? PARTICLE.SPREAD * PARTICLE.STARS_SPREAD_MULTIPLIER : PARTICLE.SPREAD;

  const particleData = useMemo(
    () => createParticleData(count, particleType),
    [count, particleType]
  );

  const material = useMemo(() => {
    return new PointsMaterial({
      size: particleType === 'rain' ? MATERIAL_SIZE_RAIN : MATERIAL_SIZE_DEFAULT,
      vertexColors: true,
      transparent: true,
      opacity: particleType === 'rain' ? MATERIAL_OPACITY_RAIN : MATERIAL_OPACITY_DEFAULT,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, [particleType]);

  useFrame(({ clock }) => {
    if (!enabled || !pointsRef.current) return;

    const time = clock.getElapsedTime();

    updateParticles(particleData, count, time, spread, particleType);

    const positionAttr = particleData.geometry.getAttribute('position');
    const sizeAttr = particleData.geometry.getAttribute('size');

    if (positionAttr) positionAttr.needsUpdate = true;
    if (sizeAttr) sizeAttr.needsUpdate = true;
  });

  if (!enabled) return null;

  return <points geometry={particleData.geometry} material={material} ref={pointsRef} />;
};

export const AtmosphereParticles = memo(AtmosphereParticlesComponent);

AtmosphereParticles.displayName = 'AtmosphereParticles';
