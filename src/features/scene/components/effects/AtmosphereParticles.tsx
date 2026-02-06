import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import type { Points } from 'three';
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, PointsMaterial } from 'three';
import { ANIMATION, PARTICLE, PARTICLE_COLORS, STAR, STAR_COUNT } from './constants';

export type ParticleType = 'dust' | 'snow' | 'stars' | 'firefly' | 'rain' | 'leaves';

interface AtmosphereParticlesProps {
  enabled?: boolean;
  particleType?: ParticleType;
  density?: number;
  color?: string;
  speedFactor?: number;
}

interface ParticleData {
  colors: Float32Array;
  geometry: BufferGeometry;
  phases: Float32Array;
  positions: Float32Array;
  scales: Float32Array; // Renamed from sizes to avoid conflict with PointsMaterial size
  velocities: Float32Array;
}

const createParticleData = (
  count: number,
  type: ParticleType,
  density: number,
  overrideColor?: string
): ParticleData => {
  const finalCount = Math.floor(count * density);
  const positions = new Float32Array(finalCount * ANIMATION.BUFFER_STRIDE_3);
  const velocities = new Float32Array(finalCount * ANIMATION.BUFFER_STRIDE_3);
  const colors = new Float32Array(finalCount * ANIMATION.BUFFER_STRIDE_3);
  const scales = new Float32Array(finalCount);
  const phases = new Float32Array(finalCount);
  const geometry = new BufferGeometry();

  const spread =
    type === 'stars' ? PARTICLE.SPREAD * PARTICLE.STARS_SPREAD_MULTIPLIER : PARTICLE.SPREAD;

  for (let i = 0; i < finalCount; i++) {
    const i3 = i * ANIMATION.BUFFER_STRIDE_3;

    positions[i3] = (Math.random() - ANIMATION.HALF) * spread;
    positions[i3 + 1] = (Math.random() - ANIMATION.HALF) * spread;
    positions[i3 + 2] = (Math.random() - ANIMATION.HALF) * spread;

    phases[i] = Math.random() * Math.PI * ANIMATION.PHASE_TWO_PI;

    initializeParticle(type, i, i3, velocities, colors, scales, overrideColor);
  }

  geometry.setAttribute('position', new BufferAttribute(positions, ANIMATION.BUFFER_STRIDE_3));
  geometry.setAttribute('color', new BufferAttribute(colors, ANIMATION.BUFFER_STRIDE_3));
  geometry.setAttribute('scales', new BufferAttribute(scales, ANIMATION.BUFFER_STRIDE_1));

  return { geometry, positions, velocities, colors, scales, phases };
};

const initDust = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array,
  overrideColor?: string
): void => {
  const color = new Color();

  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.DUST_BROWNIAN_STRENGTH;
  velocities[i3 + 1] = Math.random() * ANIMATION.DUST_BROWNIAN_STRENGTH;
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.DUST_BROWNIAN_STRENGTH;

  if (overrideColor) {
    color.set(overrideColor);
  } else {
    color.set(
      Math.random() > ANIMATION.HALF ? PARTICLE_COLORS.DUST.BASE : PARTICLE_COLORS.DUST.VARIANT1
    );
  }
  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
  scales[index] = ANIMATION.DUST_SIZE_BASE + Math.random() * ANIMATION.DUST_SIZE_RANGE;
};

const initSnow = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
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
  scales[index] = ANIMATION.SNOW_SIZE_BASE + Math.random() * ANIMATION.SNOW_SIZE_VARIATION;
};

const initStars = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
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

  // Power-law distribution for sizes: Many small stars, few large ones
  // Math.pow(Math.random(), 4.0) produces more values near 0, creating accurate star field look
  scales[index] = STAR.SIZE_MIN + Math.pow(Math.random(), 4.0) * STAR.SIZE_RANGE * 1.5;
};

const initFirefly = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
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
  scales[index] = ANIMATION.FIREFLY_SIZE_BASE + Math.random() * ANIMATION.FIREFLY_SIZE_RANGE;
};

const initRain = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
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
  scales[index] = ANIMATION.RAIN_SIZE_BASE + Math.random() * ANIMATION.RAIN_SIZE_RANGE;
};

const initLeaves = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
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
  scales[index] = ANIMATION.LEAVES_SIZE_BASE + Math.random() * ANIMATION.LEAVES_SIZE_RANGE;
};

const initializeParticle = (
  type: ParticleType,
  index: number,
  i3: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array,
  overrideColor?: string
): void => {
  switch (type) {
    case 'dust':
      initDust(i3, index, velocities, colors, scales, overrideColor);
      break;
    case 'snow':
      initSnow(i3, index, velocities, colors, scales);
      break;
    case 'stars':
      initStars(i3, index, velocities, colors, scales);
      break;
    case 'firefly':
      initFirefly(i3, index, velocities, colors, scales);
      break;
    case 'rain':
      initRain(i3, index, velocities, colors, scales);
      break;
    case 'leaves':
      initLeaves(i3, index, velocities, colors, scales);
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
  const { positions, velocities, phases, scales } = data;
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
      scales,
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
  scales: Float32Array,
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

      // Simple Dust Twinkle
      {
         const baseSize = ANIMATION.DUST_SIZE_BASE + (phase / (Math.PI * ANIMATION.PHASE_TWO_PI)) * ANIMATION.DUST_SIZE_RANGE;
         const twinkle = 0.8 + 0.3 * Math.sin(time * 2.0 + phase) + 0.2 * Math.cos(time * 5.0 + phase * 2.0);

         scales[i] = baseSize * twinkle;
      }
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
        // Irregular Twinkle: Three sine waves with prime number frequencies + random phase
        const twinkle =
          0.7 + // Base brightness
          0.3 * Math.sin(time * 3.0 + phase) + // Slow breathe
          0.3 * Math.sin(time * 7.0 + phase * 2.0) + // Medium pulse
          0.1 * Math.sin(time * 13.0 + phase * 3.0); // Fast flutter

        // Re-calculate base size to avoid drift (deterministic from phase)
        const baseSizeProjection = Math.pow((phase / (Math.PI * ANIMATION.PHASE_TWO_PI)), 4.0);
        const baseSize = STAR.SIZE_MIN + baseSizeProjection * STAR.SIZE_RANGE * 1.5;

        scales[i] = baseSize * Math.max(0.2, twinkle); // Ensure it doesn't invert
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

        scales[i] =
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

// --- Soft Particle Texture Generation ---
const getSoftParticleTexture = (() => {
  let texture: CanvasTexture | null = null;

  return () => {
    if (texture) return texture;
    const canvas = document.createElement('canvas');

    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);

      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    texture = new CanvasTexture(canvas);

    return texture;
  };
})();

const RAIN_COUNT = 2500; // Increased base count allowing density scaling
const MATERIAL_SIZE_RAIN = 0.08;
const MATERIAL_SIZE_DEFAULT = 0.3; // Slightly larger for soft texture
const MATERIAL_OPACITY_RAIN = 0.8;
const MATERIAL_OPACITY_DEFAULT = 0.9;

const AtmosphereParticlesComponent = ({
  enabled = true,
  particleType = 'dust',
  density = 1.0,
  color,
  speedFactor = 0.5,
}: AtmosphereParticlesProps) => {
  const pointsRef = useRef<Points>(null);
  const count = particleType === 'rain' ? RAIN_COUNT : (particleType === 'stars' ? STAR_COUNT : PARTICLE.COUNT);
  const spread =
    particleType === 'stars' ? PARTICLE.SPREAD * PARTICLE.STARS_SPREAD_MULTIPLIER : PARTICLE.SPREAD;

  const particleData = useMemo(
    () => createParticleData(count, particleType, density, color),
    [count, particleType, density, color]
  );

  const material = useMemo(() => {
    const m = new PointsMaterial({
      size: (particleType === 'rain' ? MATERIAL_SIZE_RAIN : MATERIAL_SIZE_DEFAULT) * (1 + (speedFactor - 0.5) * 0.5),
      vertexColors: true,
      transparent: true,
      opacity: particleType === 'rain' ? MATERIAL_OPACITY_RAIN : MATERIAL_OPACITY_DEFAULT,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      map: getSoftParticleTexture(),
      alphaTest: 0.01,
    });

    // Custom Shader Injection for per-vertex scaling
    /* TEMPORARILY DISABLED FOR DEBUGGING
    m.onBeforeCompile = (shader) => {
      // Must manually declare custom attributes for PointsMaterial
      shader.vertexShader = `
        attribute float scales;
        ${shader.vertexShader}
      `;

      // Debug: Log original shader to match string
      // console.log('Original Vertex Shader:', shader.vertexShader);

      // Inject scale multiplication into point size calculation
      const originalPointSize = 'gl_PointSize = size;';
      const replacementPointSize = 'gl_PointSize = size * scales;';

      if (shader.vertexShader.includes(originalPointSize)) {
         shader.vertexShader = shader.vertexShader.replace(originalPointSize, replacementPointSize);
      } else {
         console.warn('AtmosphereParticles: Failed to inject scales into simple point size assignment');
      }

      const originalAttenuation = 'gl_PointSize = size * ( scale / - mvPosition.z );';
      const replacementAttenuation = 'gl_PointSize = size * scales * ( scale / - mvPosition.z );';

      if (shader.vertexShader.includes(originalAttenuation)) {
          shader.vertexShader = shader.vertexShader.replace(originalAttenuation, replacementAttenuation);
      } else {
          // This is expected if the simple replacement worked and attenuation is handled separately,
          // OR if the string format is different.
          // Let's print a part of shader to verify.
          // console.log('Shader check:', shader.vertexShader.substring(shader.vertexShader.indexOf('void main'), shader.vertexShader.length));
      }
    };
    */
    return m;
  }, [particleType, speedFactor]);

  useFrame(({ clock }) => {
    if (!enabled || !pointsRef.current) return;

    // Use speedFactor to modulate time/speed
    // e.g., speedFactor 0.5 is 1x speed. 1.0 is 2x speed.
    const dynamicSpeed = 0.5 + speedFactor;
    const time = clock.getElapsedTime() * dynamicSpeed;

    // We pass the actual count of particles created (which is scaled by density)
    // createParticleData returns arrays sized by finalCount, so we should allow updateParticles
    // to iterate up to the length of the arrays it created.
    updateParticles(particleData, particleData.phases.length, time, spread, particleType);

    const positionAttr = particleData.geometry.getAttribute('position');
    const scaleAttr = particleData.geometry.getAttribute('scales');

    if (positionAttr) positionAttr.needsUpdate = true;
    if (scaleAttr) scaleAttr.needsUpdate = true;
  });

  if (!enabled) return null;

  return <points geometry={particleData.geometry} material={material} ref={pointsRef} />;
};

export const AtmosphereParticles = memo(AtmosphereParticlesComponent);

AtmosphereParticles.displayName = 'AtmosphereParticles';
