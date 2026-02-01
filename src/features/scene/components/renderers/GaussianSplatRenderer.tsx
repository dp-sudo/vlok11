import type React from 'react';
import type { Material, Mesh, Points as PointsType, Texture, Vector3 } from 'three';
import { BufferGeometry, Float32BufferAttribute } from 'three';

interface GaussianSplatProps {
  density: number;
  height: number;
  material: Material;
  meshRef: React.RefObject<Mesh | PointsType>;
  width: number;
}

/**
 * Enhanced Gaussian Splat Renderer
 * Uses instanced geometry with view-dependent point sizing
 * Supports LOD and advanced shading
 */
/**
 * Creates geometry for Gaussian splat rendering
 */
function createSplatGeometry(width: number, height: number, density: number): BufferGeometry {
  const pointCount = density * density;
  const positions = new Float32Array(pointCount * 3);
  const uvs = new Float32Array(pointCount * 2);
  const randoms = new Float32Array(pointCount * 3);

  for (let y = 0; y < density; y++) {
    for (let x = 0; x < density; x++) {
      const i = y * density + x;
      const u = x / (density - 1);
      const v = y / (density - 1);

      positions[i * 3] = (u - 0.5) * width;
      positions[i * 3 + 1] = (v - 0.5) * height;
      positions[i * 3 + 2] = 0;

      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;

      randoms[i * 3] = Math.random() - 0.5;
      randoms[i * 3 + 1] = Math.random() - 0.5;
      randoms[i * 3 + 2] = Math.random() - 0.5;
    }
  }

  const geo = new BufferGeometry();

  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aRandom', new Float32BufferAttribute(randoms, 3));

  return geo;
}

export const renderGaussianSplat = ({
  meshRef,
  width,
  height,
  density,
  material,
}: GaussianSplatProps) => {
  const geometry = createSplatGeometry(width, height, density);

  return (
    <points
      key="SPLAT"
      material={material}
      name="ScenePoints"
      ref={meshRef as React.RefObject<PointsType>}
    >
      <bufferGeometry attach="geometry" {...geometry} />
    </points>
  );
};

/**
 * High-Performance Point Cloud Renderer
 * Uses GPU for particle animation and LOD
 */
export interface HighPerfPointCloudProps {
  width: number;
  height: number;
  pointCount: number;
  sourceTexture: Texture | null;
  depthTexture: Texture | null;
  displacementScale: number;
  pointSize?: number;
  opacity?: number;
  particleType?: 'dust' | 'snow' | 'stars' | 'firefly' | 'rain' | 'leaves';
  enabled?: boolean;
}

/**
 * Creates a high-performance point cloud geometry
 * with GPU-based animation support
 */
export function createHighPerfPointCloud({
  width,
  height,
  pointCount,
}: {
  width: number;
  height: number;
  pointCount: number;
}): BufferGeometry {
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);
  const sizes = new Float32Array(pointCount);
  const phases = new Float32Array(pointCount);

  const spread = Math.max(width, height) * 0.5;

  for (let i = 0; i < pointCount; i++) {
    // Random position in sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * spread;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Random color (warm tones)
    colors[i * 3] = 0.8 + Math.random() * 0.2;
    colors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
    colors[i * 3 + 2] = 0.4 + Math.random() * 0.3;

    // Random size
    sizes[i] = 0.5 + Math.random() * 1.5;

    // Random phase for animation
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

  return geometry;
}

/**
 * LOD Point Cloud Configuration
 */
export interface LODPointCloudConfig {
  levels: {
    distance: number;
    count: number;
    size: number;
  }[];
  globalPointSize: number;
  globalOpacity: number;
}

/**
 * Get LOD level based on camera distance
 */
export function getLODLevel(
  cameraPosition: Vector3,
  targetPosition: Vector3,
  config: LODPointCloudConfig
): number {
  const distance = cameraPosition.distanceTo(targetPosition);

  for (let i = config.levels.length - 1; i >= 0; i--) {
    if (distance >= config.levels[i].distance) {
      return i;
    }
  }

  return 0;
}

export type { GaussianSplatProps };
