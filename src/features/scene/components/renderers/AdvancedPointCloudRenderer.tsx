import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three';

import type { Points, Texture } from 'three';

// ============================================
// Advanced Point Cloud Rendering Configuration
// ============================================

export interface PointCloudConfig {
  /** Base point size */
  pointSize: number;
  /** Maximum number of points */
  maxPoints: number;
  /** Enable LOD (Level of Detail) */
  enableLOD: boolean;
  /** LOD distance thresholds */
  lodDistances: number[];
  /** LOD point size multipliers */
  lodSizes: number[];
  /** Enable soft particles (depth-aware) */
  enableSoftParticles: boolean;
  /** Soft particle fade distance */
  softParticleDistance: number;
  /** Enable color grading */
  enableColorGrading: boolean;
  /** Point opacity */
  opacity: number;
  /** Enable depth displacement */
  enableDepthDisplacement: boolean;
  /** Depth map texture */
  depthMap?: Texture | null;
  /** Source image texture */
  sourceImage?: Texture | null;
  /** Depth displacement scale */
  displacementScale: number;
}

const DEFAULT_CONFIG: PointCloudConfig = {
  pointSize: 4.0,
  maxPoints: 16384,
  enableLOD: true,
  lodDistances: [5, 15, 30],
  lodSizes: [1.0, 0.6, 0.3],
  enableSoftParticles: true,
  softParticleDistance: 0.5,
  enableColorGrading: true,
  opacity: 1.0,
  enableDepthDisplacement: true,
  depthMap: null,
  sourceImage: null,
  displacementScale: 1.0,
};

// ============================================
// GPU Compute Shaders for Particle Animation
// ============================================

const GPU_PARTICLE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSpread;
  uniform vec3 uVelocity;
  uniform float uPhase;
  uniform int uParticleType;
  uniform float uSize;

  attribute float aPhase;
  attribute float aSize;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vDepth;

  // Simplex noise for organic movement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vColor = aColor;

    vec3 pos = position;

    // GPU-based particle animation based on particle type
    float t = uTime * uSpeed;

    if (uParticleType == 0) { // Dust - Brownian motion with noise
      float noiseX = snoise(vec3(pos.x * 0.1 + t * 0.1, pos.y * 0.1, pos.z * 0.1));
      float noiseY = snoise(vec3(pos.x * 0.1, pos.y * 0.1 + t * 0.1, pos.z * 0.1));
      float noiseZ = snoise(vec3(pos.x * 0.1, pos.y * 0.1, pos.z * 0.1 + t * 0.1));
      pos += vec3(noiseX, noiseY, noiseZ) * 0.1;
    }
    else if (uParticleType == 1) { // Snow - Falling with wind
      pos.y -= mod(t * 0.5 + aPhase * 0.1, uSpread);
      pos.x += sin(t * 0.3 + aPhase) * 0.05;
      pos.z += cos(t * 0.3 + aPhase) * 0.05;
    }
    else if (uParticleType == 2) { // Stars - Twinkling
      float twinkle = 0.5 + 0.5 * sin(t * 3.0 + aPhase * 10.0);
      vAlpha = 0.3 + 0.7 * twinkle;
    }
    else if (uParticleType == 3) { // Firefly - Pulsing with organic movement
      float pulse = 0.5 + 0.5 * sin(t * 2.0 + aPhase * 5.0);
      vAlpha = 0.3 + 0.7 * pulse;
      float noiseX = snoise(vec3(pos.x * 0.5 + t * 0.2, pos.y * 0.5, pos.z * 0.5));
      float noiseY = snoise(vec3(pos.x * 0.5, pos.y * 0.5 + t * 0.2, pos.z * 0.5));
      pos += vec3(noiseX, noiseY, 0.0) * 0.02;
    }
    else if (uParticleType == 4) { // Rain - Fast falling
      pos.y -= mod(t * 3.0 + aPhase * 0.5, uSpread);
    }
    else if (uParticleType == 5) { // Leaves - Chaotic falling
      pos.y -= mod(t * 0.3 + aPhase * 0.05, uSpread * 0.5);
      pos.x += sin(t + aPhase) * 0.1;
      pos.z += cos(t * 0.7 + aPhase) * 0.1;
      // Rotation simulation
      float rot = t * 2.0 + aPhase;
      pos.x += sin(rot) * 0.05;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mvPosition.z;

    // Size attenuation with LOD
    float dist = -mvPosition.z;
    float lodFactor = 1.0;

    // Apply LOD based on distance
    if (dist > 30.0) lodFactor = 0.3;
    else if (dist > 15.0) lodFactor = 0.6;
    else lodFactor = 1.0;

    gl_PointSize = uSize * aSize * lodFactor * (300.0 / dist);
    gl_PointSize = max(1.0, gl_PointSize);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const GPU_PARTICLE_FRAGMENT_SHADER = `
  uniform sampler2D uSourceImage;
  uniform sampler2D uDepthMap;
  uniform float uOpacity;
  uniform float uDisplacementScale;
  uniform bool uEnableSoftParticles;
  uniform float uSoftParticleDistance;
  uniform bool uEnableColorGrading;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vDepth;

  void main() {
    // Circular point sprite with soft edges
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) discard;

    // Soft edge with smooth falloff
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

    // Depth-aware soft particles
    if (uEnableSoftParticles) {
      float depthSample = texture2D(uDepthMap, gl_FragCoord.xy / vec2(1920.0, 1080.0)).r;
      float depthDiff = abs(vDepth - depthSample * 100.0);
      float softFade = smoothstep(0.0, uSoftParticleDistance, depthDiff);
      alpha *= softFade;
    }

    vec3 color = vColor;

    // Color grading (simple contrast/saturation boost)
    if (uEnableColorGrading) {
      // Luminance
      float lum = dot(color, vec3(0.299, 0.587, 0.114));
      // Boost saturation
      color = mix(vec3(lum), color, 1.2);
      // Subtle contrast
      color = (color - 0.5) * 1.1 + 0.5;
    }

    gl_FragColor = vec4(color, alpha * uOpacity * vAlpha);
  }
`;

// ============================================
// Advanced Point Cloud Renderer Component
// ============================================

interface AdvancedPointCloudRendererProps {
  config?: Partial<PointCloudConfig>;
  particleType?: 'dust' | 'snow' | 'stars' | 'firefly' | 'rain' | 'leaves';
  enabled?: boolean;
}

export function AdvancedPointCloudRenderer({
  config: userConfig = {},
  particleType = 'dust',
  enabled = true,
}: AdvancedPointCloudRendererProps) {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const config: PointCloudConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );

  // Generate point cloud data
  const { geometry, material } = useMemo(() => {
    const count = config.maxPoints;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const spread = 45;
    const particleTypeNum = getParticleTypeNum(particleType);

    // Color palette based on particle type
    const colorPalette = getColorPalette(particleType);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random position in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * spread;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      // Random color from palette
      const colorIndex = Math.floor(Math.random() * colorPalette.length);
      const color = colorPalette[colorIndex];

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Random size
      sizes[i] = 0.5 + Math.random() * 1.5;

      // Random phase
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new BufferGeometry();

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

    // Create shader material
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 1.0 },
        uSpread: { value: spread },
        uVelocity: { value: new Vector3(0, -1, 0) },
        uPhase: { value: 0 },
        uParticleType: { value: particleTypeNum },
        uSize: { value: config.pointSize },
        uOpacity: { value: config.opacity },
        uSourceImage: { value: config.sourceImage },
        uDepthMap: { value: config.depthMap },
        uDisplacementScale: { value: config.displacementScale },
        uEnableSoftParticles: { value: config.enableSoftParticles },
        uSoftParticleDistance: { value: config.softParticleDistance },
        uEnableColorGrading: { value: config.enableColorGrading },
      },
      vertexShader: GPU_PARTICLE_VERTEX_SHADER,
      fragmentShader: GPU_PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: 1, // AdditiveBlending
    });

    return { geometry: geo, material: mat };
  }, [config, particleType]);

  // Update uniforms
  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  // Update on config change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSize.value = config.pointSize;
      materialRef.current.uniforms.uOpacity.value = config.opacity;
      materialRef.current.uniforms.uDisplacementScale.value = config.displacementScale;
      materialRef.current.uniforms.uEnableSoftParticles.value = config.enableSoftParticles;
      materialRef.current.uniforms.uSoftParticleDistance.value = config.softParticleDistance;
      materialRef.current.uniforms.uEnableColorGrading.value = config.enableColorGrading;
    }
  }, [config]);

  if (!enabled) return null;

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled>
      {/* GPU particles don't need additional resources */}
    </points>
  );
}

// ============================================
// Helper Functions
// ============================================

function getParticleTypeNum(type: string): number {
  const types: Record<string, number> = {
    dust: 0,
    snow: 1,
    stars: 2,
    firefly: 3,
    rain: 4,
    leaves: 5,
  };

  return types[type] ?? 0;
}

function getColorPalette(type: string): { r: number; g: number; b: number }[] {
  const palettes: Record<string, { r: number; g: number; b: number }[]> = {
    dust: [
      { r: 0.8, g: 0.7, b: 0.5 },
      { r: 0.9, g: 0.8, b: 0.6 },
      { r: 0.7, g: 0.6, b: 0.4 },
    ],
    snow: [
      { r: 1.0, g: 1.0, b: 1.0 },
      { r: 0.95, g: 0.95, b: 1.0 },
      { r: 0.9, g: 0.9, b: 0.95 },
    ],
    stars: [
      { r: 1.0, g: 1.0, b: 1.0 },
      { r: 0.8, g: 0.9, b: 1.0 },
      { r: 1.0, g: 0.95, b: 0.8 },
      { r: 0.9, g: 0.9, b: 1.0 },
    ],
    firefly: [
      { r: 0.9, g: 1.0, b: 0.3 },
      { r: 1.0, g: 0.9, b: 0.2 },
      { r: 0.8, g: 1.0, b: 0.4 },
    ],
    rain: [
      { r: 0.6, g: 0.7, b: 0.9 },
      { r: 0.7, g: 0.8, b: 1.0 },
    ],
    leaves: [
      { r: 0.4, g: 0.7, b: 0.2 },
      { r: 0.6, g: 0.8, b: 0.3 },
      { r: 0.8, g: 0.6, b: 0.2 },
      { r: 0.9, g: 0.4, b: 0.1 },
      { r: 0.7, g: 0.3, b: 0.1 },
    ],
  };

  return palettes[type] ?? palettes.dust;
}

// ============================================
// High-Performance Point Cloud with LOD
// ============================================

export interface LODPointCloudConfig extends PointCloudConfig {
  /** LOD levels configuration */
  levels: {
    distance: number;
    density: number;
    size: number;
  }[];
}

export function LODPointCloudRenderer({
  config,
  enabled = true,
}: {
  config?: Partial<LODPointCloudConfig>;
  enabled?: boolean;
}) {
  const fullConfig: LODPointCloudConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      enableLOD: true,
      levels: [
        { distance: 0, density: 16384, size: 4.0 },
        { distance: 10, density: 8192, size: 3.0 },
        { distance: 20, density: 4096, size: 2.0 },
        { distance: 40, density: 2048, size: 1.5 },
      ],
      ...config,
    }),
    [config]
  );

  // Implementation would switch between LOD levels based on camera distance
  // For simplicity, using the max LOD level
  const particleConfig: Partial<PointCloudConfig> = {
    pointSize: fullConfig.levels[0]?.size ?? 4.0,
    maxPoints: fullConfig.levels[0]?.density ?? 16384,
    enableLOD: true,
    opacity: fullConfig.opacity,
    enableDepthDisplacement: fullConfig.enableDepthDisplacement,
    displacementScale: fullConfig.displacementScale,
    enableSoftParticles: fullConfig.enableSoftParticles,
    softParticleDistance: fullConfig.softParticleDistance,
    enableColorGrading: fullConfig.enableColorGrading,
  };

  return (
    <AdvancedPointCloudRenderer
      config={particleConfig}
      enabled={enabled}
    />
  );
}
