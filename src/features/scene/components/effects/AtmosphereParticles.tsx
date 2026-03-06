import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef } from 'react';
import type { Points } from 'three';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  PointsMaterial,
} from 'three';

import { createLogger } from '@/core/Logger';
import { ANIMATION, PARTICLE, PARTICLE_COLORS, STAR, STAR_COUNT } from './constants';

const logger = createLogger({ module: 'AtmosphereParticles' });

// 优化2: 模块级 Color 对象池，避免每个粒子初始化时 new Color()
const sharedColor = new Color();

// Helper: 将颜色从sharedColor复制到颜色缓冲区 (减少重复代码)
const copyColorToBuffer = (colors: Float32Array, i3: number): void => {
  colors[i3] = sharedColor.r;
  colors[i3 + 1] = sharedColor.g;
  colors[i3 + 2] = sharedColor.b;
};

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
  scales: Float32Array;
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
  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.DUST_BROWNIAN_STRENGTH;
  velocities[i3 + 1] = Math.random() * ANIMATION.DUST_BROWNIAN_STRENGTH;
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.DUST_BROWNIAN_STRENGTH;

  if (overrideColor) {
    sharedColor.set(overrideColor);
  } else {
    sharedColor.set(
      Math.random() > ANIMATION.HALF ? PARTICLE_COLORS.DUST.BASE : PARTICLE_COLORS.DUST.VARIANT1
    );
  }
  copyColorToBuffer(colors, i3);
  scales[index] = ANIMATION.DUST_SIZE_BASE + Math.random() * ANIMATION.DUST_SIZE_RANGE;
};

const initSnow = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
): void => {
  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.SNOW_WIND_STRENGTH;
  velocities[i3 + 1] = -(ANIMATION.SNOW_FALL_BASE + Math.random() * ANIMATION.SNOW_FALL_RANGE);
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.SNOW_WIND_STRENGTH;
  sharedColor.set(
    Math.random() > ANIMATION.SNOW_WHITE_THRESHOLD
      ? PARTICLE_COLORS.SNOW.BASE
      : PARTICLE_COLORS.SNOW.SHADOW
  );
  copyColorToBuffer(colors, i3);
  scales[index] = ANIMATION.SNOW_SIZE_BASE + Math.random() * ANIMATION.SNOW_SIZE_VARIATION;
};

const initStars = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
): void => {
  velocities[i3] = 0;
  velocities[i3 + 1] = 0;
  velocities[i3 + 2] = 0;
  const colorRand = Math.random();

  if (colorRand < ANIMATION.STAR_COLOR_BLUE_THRESHOLD) sharedColor.set(PARTICLE_COLORS.STAR.WHITE);
  else if (colorRand < ANIMATION.STAR_COLOR_WARM_THRESHOLD)
    sharedColor.set(PARTICLE_COLORS.STAR.BLUE);
  else sharedColor.set(PARTICLE_COLORS.STAR.WARM);
  copyColorToBuffer(colors, i3);

  // Power-law distribution for sizes: Many small stars, few large ones
  scales[index] = STAR.SIZE_MIN + Math.random() ** 4.0 * STAR.SIZE_RANGE * 1.5;
};

const initFirefly = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
): void => {
  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.FIREFLY_DRIFT;
  velocities[i3 + 1] = (Math.random() - ANIMATION.HALF) * ANIMATION.FIREFLY_DRIFT;
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.FIREFLY_DRIFT;
  sharedColor.set(
    Math.random() > ANIMATION.FIREFLY_CORE_THRESHOLD
      ? PARTICLE_COLORS.FIREFLY.GLOW
      : PARTICLE_COLORS.FIREFLY.TRAIL
  );
  copyColorToBuffer(colors, i3);
  scales[index] = ANIMATION.FIREFLY_SIZE_BASE + Math.random() * ANIMATION.FIREFLY_SIZE_RANGE;
};

const initRain = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
): void => {
  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.RAIN_WIND_STRENGTH;
  velocities[i3 + 1] = -(ANIMATION.RAIN_FALL_BASE + Math.random() * ANIMATION.RAIN_FALL_RANGE);
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.RAIN_WIND_STRENGTH;
  // 雨滴颜色：更丰富的蓝白色谱
  const rainRand = Math.random();

  if (rainRand < 0.3) sharedColor.set('#cceeff');
  else if (rainRand < 0.6) sharedColor.set(PARTICLE_COLORS.RAIN.LIGHT);
  else sharedColor.set(PARTICLE_COLORS.RAIN.BASE);
  copyColorToBuffer(colors, i3);
  // 雨丝尺寸：更大的基础值 + 更宽的变化范围
  scales[index] = ANIMATION.RAIN_SIZE_BASE + Math.random() * ANIMATION.RAIN_SIZE_RANGE;
};

const initLeaves = (
  i3: number,
  index: number,
  velocities: Float32Array,
  colors: Float32Array,
  scales: Float32Array
): void => {
  velocities[i3] = (Math.random() - ANIMATION.HALF) * ANIMATION.LEAVES_WIND_STRENGTH;
  velocities[i3 + 1] = -(ANIMATION.LEAVES_FALL_BASE + Math.random() * ANIMATION.LEAVES_FALL_RANGE);
  velocities[i3 + 2] = (Math.random() - ANIMATION.HALF) * ANIMATION.LEAVES_WIND_STRENGTH;
  const leafRand = Math.random();

  if (leafRand < ANIMATION.LEAVES_GREEN_THRESHOLD) sharedColor.set(PARTICLE_COLORS.LEAVES.GREEN);
  else if (leafRand < ANIMATION.LEAVES_YELLOW_THRESHOLD)
    sharedColor.set(PARTICLE_COLORS.LEAVES.YELLOW);
  else if (leafRand < ANIMATION.LEAVES_ORANGE_THRESHOLD)
    sharedColor.set(PARTICLE_COLORS.LEAVES.ORANGE);
  else sharedColor.set(PARTICLE_COLORS.LEAVES.RED);
  copyColorToBuffer(colors, i3);
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

// 优化1: 内联 updateParticleByType 到主循环，消除每帧 N 次的临时对象分配和闭包回调
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
    const phase = phases[i]!;

    let posX = positions[i3]!;
    let posY = positions[i3 + 1]!;
    let posZ = positions[i3 + 2]!;
    const velX = velocities[i3]!;
    const velY = velocities[i3 + 1]!;
    const velZ = velocities[i3 + 2]!;

    switch (type) {
      case 'dust':
        posX += velX + Math.sin(time + phase) * ANIMATION.DUST_BROWNIAN_STRENGTH;
        posY +=
          velY +
          Math.cos(time * ANIMATION.DUST_TIME_FACTOR_Y + phase) * ANIMATION.DUST_BROWNIAN_STRENGTH;
        posZ +=
          velZ +
          Math.sin(time * ANIMATION.DUST_TIME_FACTOR_Z + phase) * ANIMATION.DUST_BROWNIAN_STRENGTH;
        {
          const baseSize =
            ANIMATION.DUST_SIZE_BASE +
            (phase / (Math.PI * ANIMATION.PHASE_TWO_PI)) * ANIMATION.DUST_SIZE_RANGE;
          const twinkle =
            0.8 + 0.3 * Math.sin(time * 2.0 + phase) + 0.2 * Math.cos(time * 5.0 + phase * 2.0);

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
          const twinkle =
            0.7 +
            0.3 * Math.sin(time * 3.0 + phase) +
            0.3 * Math.sin(time * 7.0 + phase * 2.0) +
            0.1 * Math.sin(time * 13.0 + phase * 3.0);
          const baseSizeProjection = (phase / (Math.PI * ANIMATION.PHASE_TWO_PI)) ** 4.0;
          const baseSize = STAR.SIZE_MIN + baseSizeProjection * STAR.SIZE_RANGE * 1.5;

          scales[i] = baseSize * Math.max(0.2, twinkle);
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
        posZ += velZ + Math.cos(time * 1.5 + phase) * 0.001;
        // 雨丝拉伸效果：基于下落速度的动态缩放抖动
        {
          const baseRainScale =
            ANIMATION.RAIN_SIZE_BASE +
            (phase / (Math.PI * ANIMATION.PHASE_TWO_PI)) * ANIMATION.RAIN_SIZE_RANGE;
          const streak = 1.0 + 0.5 * Math.abs(Math.sin(time * 4.0 + phase * 3.0));

          scales[i] = baseRainScale * streak;
        }
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

// 优化3: 柔光粒子纹理 64x64 + 中间渐变停止点
const getSoftParticleTexture = (() => {
  let texture: CanvasTexture | null = null;

  return () => {
    if (texture) return texture;
    const canvas = document.createElement('canvas');

    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    texture = new CanvasTexture(canvas);

    return texture;
  };
})();

const RAIN_COUNT = 5000;
const MATERIAL_SIZE_RAIN = 0.18;
const MATERIAL_SIZE_DEFAULT = 0.4;
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
  const count = (() => {
    if (particleType === 'rain') return RAIN_COUNT;
    if (particleType === 'stars') return STAR_COUNT;

    return PARTICLE.COUNT;
  })();
  const spread =
    particleType === 'stars' ? PARTICLE.SPREAD * PARTICLE.STARS_SPREAD_MULTIPLIER : PARTICLE.SPREAD;

  const particleData = useMemo(
    () => createParticleData(count, particleType, density, color),
    [count, particleType, density, color]
  );

  const material = useMemo(() => {
    const m = new PointsMaterial({
      size:
        (particleType === 'rain' ? MATERIAL_SIZE_RAIN : MATERIAL_SIZE_DEFAULT) *
        (1 + (speedFactor - 0.5) * 0.5),
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

    m.onBeforeCompile = (shader) => {
      // Must manually declare custom attributes for PointsMaterial
      shader.vertexShader = `
        attribute float scales;
        ${shader.vertexShader}
      `;

      // Inject scale multiplication into point size calculation
      const originalPointSize = 'gl_PointSize = size;';
      const replacementPointSize = 'gl_PointSize = size * scales;';

      if (shader.vertexShader.includes(originalPointSize)) {
        shader.vertexShader = shader.vertexShader.replace(originalPointSize, replacementPointSize);
      } else {
        logger.warn('Failed to inject scales into simple point size assignment');
      }

      const originalAttenuation = 'gl_PointSize = size * ( scale / - mvPosition.z );';
      const replacementAttenuation = 'gl_PointSize = size * scales * ( scale / - mvPosition.z );';

      if (shader.vertexShader.includes(originalAttenuation)) {
        shader.vertexShader = shader.vertexShader.replace(
          originalAttenuation,
          replacementAttenuation
        );
      }
    };

    return m;
  }, [particleType, speedFactor]);

  useFrame(({ clock }) => {
    if (!enabled || !pointsRef.current) return;

    const dynamicSpeed = 0.5 + speedFactor;
    const time = clock.getElapsedTime() * dynamicSpeed;

    updateParticles(particleData, particleData.phases.length, time, spread, particleType);

    const positionAttr = particleData.geometry.getAttribute('position');
    const scaleAttr = particleData.geometry.getAttribute('scales');

    if (positionAttr) positionAttr.needsUpdate = true;
    if (scaleAttr) scaleAttr.needsUpdate = true;
  });

  // 清理 WebGL 资源：组件卸载时释放 geometry 和 material
  useEffect(() => {
    return () => {
      particleData.geometry.dispose();
      material.dispose();
    };
  }, [particleData, material]);

  if (!enabled) return null;

  // 优化5: frustumCulled={false} 避免大范围粒子被视锥裁剪
  return (
    <points
      frustumCulled={false}
      geometry={particleData.geometry}
      material={material}
      ref={pointsRef}
    />
  );
};

export const AtmosphereParticles = memo(AtmosphereParticlesComponent);

AtmosphereParticles.displayName = 'AtmosphereParticles';
