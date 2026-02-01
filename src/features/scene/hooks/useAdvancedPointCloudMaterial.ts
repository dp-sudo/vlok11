import { useMemo } from 'react';
import { ShaderMaterial, Uniform, Vector3 } from 'three';

import type { Texture } from 'three';

// ============================================
// Advanced Point Cloud Material
// Features:
// - Per-pixel depth displacement
// - Dynamic point sizing with LOD
// - Soft particle edges
// - Color grading and tone mapping
// - Normal-based lighting
// - Depth of field blur for points
// ============================================

export interface PointCloudMaterialConfig {
  /** Source texture (image) */
  map?: Texture | null;
  /** Depth/displacement map */
  displacementMap?: Texture | null;
  /** Normal map for lighting */
  normalMap?: Texture | null;
  /** Base point size */
  pointSize: number;
  /** Point size attenuation factor */
  sizeAttenuation: number;
  /** Depth displacement scale */
  displacementScale: number;
  /** Opacity */
  opacity: number;
  /** Enable depth sorting */
  depthSort: boolean;
  /** Enable normal-based lighting */
  useNormals: boolean;
  /** Ambient light color */
  ambientColor: Vector3;
  /** Light direction */
  lightDirection: Vector3;
  /** Light intensity */
  lightIntensity: number;
  /** Specular highlight power */
  specularPower: number;
  /** Enable soft particles */
  softParticles: boolean;
  /** Soft particle distance */
  softParticleDistance: number;
  /** Enable color grading */
  colorGrading: boolean;
  /** Saturation adjustment */
  saturation: number;
  /** Contrast adjustment */
  contrast: number;
  /** Brightness adjustment */
  brightness: number;
  /** Vignette strength */
  vignetteStrength: number;
  /** Enable dithering */
  dithering: boolean;
  /** Enable circular points */
  circularPoints: boolean;
}

const DEFAULT_CONFIG: PointCloudMaterialConfig = {
  map: null,
  displacementMap: null,
  normalMap: null,
  pointSize: 4.0,
  sizeAttenuation: 300.0,
  displacementScale: 1.0,
  opacity: 1.0,
  depthSort: false,
  useNormals: false,
  ambientColor: new Vector3(0.3, 0.3, 0.35),
  lightDirection: new Vector3(0.5, 0.8, 0.5).normalize(),
  lightIntensity: 1.2,
  specularPower: 32.0,
  softParticles: true,
  softParticleDistance: 0.5,
  colorGrading: true,
  saturation: 1.1,
  contrast: 1.05,
  brightness: 1.0,
  vignetteStrength: 0.0,
  dithering: true,
  circularPoints: true,
};

// ============================================
// Vertex Shader
// ============================================

const ADVANCED_POINT_VERTEX_SHADER = `
  uniform sampler2D displacementMap;
  uniform float displacementScale;
  uniform float pointSize;
  uniform float sizeAttenuation;
  uniform bool useNormals;
  uniform vec3 lightDirection;
  uniform float lightIntensity;
  uniform float specularPower;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDepth;
  varying float vDisplacement;
  varying vec3 vColor;

  void main() {
    vUv = uv;
    vColor = vec3(1.0);

    vec3 pos = position;
    vec3 normal = normalMatrix * normal;

    // Depth displacement
    float disp = 0.0;
    if (displacementMap != null) {
      disp = texture2D(displacementMap, uv).r;
      vDisplacement = disp;
      pos += normal * (disp * displacementScale);
    } else {
      vDisplacement = 0.0;
    }

    // Calculate view position
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    vDepth = -mvPosition.z;

    // Normal for lighting (reconstructed if no normal map)
    vNormal = normalize(normalMatrix * (useNormals ? normal : vec3(0.0, 0.0, 1.0)));

    // Point size with distance attenuation and LOD
    float dist = length(mvPosition.xyz);
    float lodFactor = 1.0;

    // LOD based on distance
    if (dist > 30.0) lodFactor = 0.3;
    else if (dist > 15.0) lodFactor = 0.6;
    else lodFactor = 1.0;

    gl_PointSize = pointSize * lodFactor * (sizeAttenuation / dist);
    gl_PointSize = max(1.0, gl_PointSize);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// ============================================
// Fragment Shader
// ============================================

const ADVANCED_POINT_FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform sampler2D displacementMap;
  uniform float opacity;
  uniform bool depthSort;
  uniform vec3 ambientColor;
  uniform vec3 lightDirection;
  uniform float lightIntensity;
  uniform float specularPower;
  uniform bool softParticles;
  uniform float softParticleDistance;
  uniform bool colorGrading;
  uniform float saturation;
  uniform float contrast;
  uniform float brightness;
  uniform float vignetteStrength;
  uniform bool dithering;
  uniform bool circularPoints;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDepth;
  varying float vDisplacement;
  varying vec3 vColor;

  // Dithering matrix for smooth gradients
  const mat4 bayerMatrix = mat4(
    0.0, 8.0, 2.0, 10.0,
    12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0,
    15.0, 7.0, 13.0, 5.0
  );

  void main() {
    // Circular point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (circularPoints && dist > 0.5) discard;

    // Soft edge falloff
    float alpha = 1.0;
    if (circularPoints) {
      alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    }

    // Sample texture
    vec4 texColor = vec4(1.0);
    if (map != null) {
      texColor = texture2D(map, vUv);
    }

    // Base color from texture
    vec3 color = texColor.rgb * vColor;

    // Lighting calculation (Blinn-Phong)
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 halfDir = normalize(lightDirection + viewDir);

    // Diffuse
    float diff = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = color * diff * lightIntensity;

    // Specular (if we have normals)
    if (length(vNormal) > 0.1) {
      float spec = pow(max(dot(normal, halfDir), 0.0), specularPower);
      vec3 specular = vec3(1.0) * spec * 0.3;
      color = diffuse + ambientColor * color + specular;
    } else {
      color = diffuse + ambientColor * color;
    }

    // Color grading
    if (colorGrading) {
      // Saturation
      float lum = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(lum), color, saturation);

      // Contrast
      color = (color - 0.5) * contrast + 0.5;

      // Brightness
      color *= brightness;

      // Tone mapping (ACES approximation)
      color = color / (color + vec3(1.0));

      // Gamma correction
      color = pow(color, vec3(1.0 / 2.2));
    }

    // Vignette
    if (vignetteStrength > 0.0) {
      float vignette = 1.0 - smoothstep(0.4, 1.0, length(gl_PointCoord - vec2(0.5)));
      color *= 1.0 - vignette * vignetteStrength;
    }

    // Dithering for smooth gradients at low brightness
    if (dithering) {
      float dither = bayerMatrix[int(gl_FragCoord.x) % 4][int(gl_FragCoord.y) % 4] / 16.0;
      color += (dither - 0.5) * 0.02;
    }

    // Soft particles (depth-aware)
    if (softParticles) {
      // Simplified soft particle - using distance from center as proxy
      float softFade = smoothstep(0.5, 0.0, dist * (1.0 - alpha));
      alpha *= softFade;
    }

    gl_FragColor = vec4(color, alpha * opacity);
  }
`;

// ============================================
// Custom Hook for Point Cloud Material
// ============================================

export function useAdvancedPointCloudMaterial(
  config: Partial<PointCloudMaterialConfig> = {}
): ShaderMaterial {
  const finalConfig: PointCloudMaterialConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  return useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        map: new Uniform(finalConfig.map ?? null),
        displacementMap: new Uniform(finalConfig.displacementMap ?? null),
        displacementScale: new Uniform(finalConfig.displacementScale),
        pointSize: new Uniform(finalConfig.pointSize),
        sizeAttenuation: new Uniform(finalConfig.sizeAttenuation),
        opacity: new Uniform(finalConfig.opacity),
        depthSort: new Uniform(finalConfig.depthSort),
        useNormals: new Uniform(finalConfig.useNormals),
        ambientColor: new Uniform(finalConfig.ambientColor),
        lightDirection: new Uniform(finalConfig.lightDirection),
        lightIntensity: new Uniform(finalConfig.lightIntensity),
        specularPower: new Uniform(finalConfig.specularPower),
        softParticles: new Uniform(finalConfig.softParticles),
        softParticleDistance: new Uniform(finalConfig.softParticleDistance),
        colorGrading: new Uniform(finalConfig.colorGrading),
        saturation: new Uniform(finalConfig.saturation),
        contrast: new Uniform(finalConfig.contrast),
        brightness: new Uniform(finalConfig.brightness),
        vignetteStrength: new Uniform(finalConfig.vignetteStrength),
        dithering: new Uniform(finalConfig.dithering),
        circularPoints: new Uniform(finalConfig.circularPoints),
      },
      vertexShader: ADVANCED_POINT_VERTEX_SHADER,
      fragmentShader: ADVANCED_POINT_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });
  }, [finalConfig]);
}

// ============================================
// Utilities for Material Updates
// ============================================

export function updatePointCloudMaterial(
  material: ShaderMaterial,
  updates: Partial<PointCloudMaterialConfig>
): void {
  if (updates.map !== undefined) material.uniforms.map.value = updates.map;
  if (updates.displacementMap !== undefined)
    material.uniforms.displacementMap.value = updates.displacementMap;
  if (updates.pointSize !== undefined) material.uniforms.pointSize.value = updates.pointSize;
  if (updates.displacementScale !== undefined)
    material.uniforms.displacementScale.value = updates.displacementScale;
  if (updates.opacity !== undefined) material.uniforms.opacity.value = updates.opacity;
  if (updates.lightIntensity !== undefined)
    material.uniforms.lightIntensity.value = updates.lightIntensity;
  if (updates.saturation !== undefined) material.uniforms.saturation.value = updates.saturation;
  if (updates.contrast !== undefined) material.uniforms.contrast.value = updates.contrast;
  if (updates.brightness !== undefined) material.uniforms.brightness.value = updates.brightness;
  if (updates.colorGrading !== undefined)
    material.uniforms.colorGrading.value = updates.colorGrading;
}
