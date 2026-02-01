/**
 * Weather Atmosphere Effects
 * 天气氛围效果 shader 定义
 */

export type WeatherEffect = 'none' | 'rain' | 'fog' | 'snow' | 'sunny';

export interface WeatherConfig {
  effect: WeatherEffect;
  intensity: number; // 0-1
  color?: string;
}

// 天气效果 shader 字典
export const WEATHER_SHADERS: Record<WeatherEffect, string> = {
  none: '',

  rain: `
    uniform float uTime;
    uniform vec3 uRainColor;
    uniform float uIntensity;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      uv.y += uTime * 3.0;
      float rain = step(0.97, random(floor(uv * 150.0)));
      vec3 color = mix(vec3(0.0), uRainColor, rain * uIntensity * 0.4);
      gl_FragColor = vec4(color, 1.0);
    }
  `,

  fog: `
    uniform float uTime;
    uniform vec3 uFogColor;
    uniform float uIntensity;
    varying vec2 vUv;

    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      float fog = noise(vUv * 8.0 + uTime * 0.2) * uIntensity * 0.6;
      gl_FragColor = vec4(uFogColor, fog);
    }
  `,

  snow: `
    uniform float uTime;
    uniform vec3 uSnowColor;
    uniform float uIntensity;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      uv.y += uTime * 1.5;
      uv.x += sin(uTime * 0.5 + uv.y * 10.0) * 0.01;
      float snow = step(0.98, random(floor(uv * 100.0)));
      vec3 color = mix(vec3(0.0), uSnowColor, snow * uIntensity * 0.3);
      gl_FragColor = vec4(color, 1.0);
    }
  `,

  sunny: `
    uniform vec3 uSunColor;
    uniform float uIntensity;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float glow = exp(-dist * 2.5) * uIntensity * 0.4;
      gl_FragColor = vec4(uSunColor, glow);
    }
  `,
};

// 天气效果默认配置
export const WEATHER_CONFIGS: Record<WeatherEffect, Partial<WeatherConfig>> = {
  none: { intensity: 0 },
  rain: { intensity: 0.5, color: '#6699CC' },
  fog: { intensity: 0.4, color: '#CCCCCC' },
  snow: { intensity: 0.4, color: '#FFFFFF' },
  sunny: { intensity: 0.6, color: '#FFDD99' },
};
