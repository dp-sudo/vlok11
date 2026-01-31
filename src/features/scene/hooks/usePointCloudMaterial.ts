import { useMemo } from 'react';
import { ShaderMaterial } from 'three';

const POINT_CLOUD_VERTEX_SHADER = `
  uniform sampler2D displacementMap;
  uniform float displacementScale;
  uniform float size;
  uniform float scale;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float disp = texture2D(displacementMap, uv).r;
    vec3 displaced = pos + normal * (disp * displacementScale);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * (scale / -mvPosition.z);
    gl_PointSize = max(1.0, gl_PointSize);
  }
`;

const POINT_CLOUD_FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    vec4 diff = texture2D(map, vUv);
    if (diff.a < 0.1) discard;
    gl_FragColor = vec4(diff.rgb, diff.a * opacity);
  }
`;

const POINT_CLOUD_DEFAULTS = {
  DISPLACEMENT_SCALE: 1.0,
  POINT_SIZE: 3.5,
  OPACITY: 1.0,
  SCALE_DIVISOR: 2.0,
} as const;

export function usePointCloudMaterial(): ShaderMaterial {
  return useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        map: { value: null },
        displacementMap: { value: null },
        displacementScale: { value: POINT_CLOUD_DEFAULTS.DISPLACEMENT_SCALE },
        size: { value: POINT_CLOUD_DEFAULTS.POINT_SIZE },
        scale: { value: window.innerHeight / POINT_CLOUD_DEFAULTS.SCALE_DIVISOR },
        opacity: { value: POINT_CLOUD_DEFAULTS.OPACITY },
      },
      vertexShader: POINT_CLOUD_VERTEX_SHADER,
      fragmentShader: POINT_CLOUD_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });
  }, []);
}
