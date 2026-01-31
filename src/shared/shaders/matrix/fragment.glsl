precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform float uFallSpeed;
uniform float uCharDensity;
uniform float uGlowIntensity;
uniform float uTrailLength;
uniform vec3 uMatrixColor;
uniform float uCharSize;
uniform float uShowOriginal;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 neonGlow(vec3 baseColor, vec3 glowColor, float intensity) {
  float lum = getLuminance(baseColor);
  float glow = smoothstep(0.3, 0.8, lum);
  return baseColor + glowColor * glow * intensity;
}

void main() {
  vec4 texColor = texture2D(uMap, vUv);
  vec3 originalColor = texColor.rgb;
  float lum = getLuminance(originalColor);
  
  vec3 neonPink = vec3(1.0, 0.2, 0.6);
  vec3 neonCyan = vec3(0.0, 1.0, 0.9);
  vec3 neonPurple = vec3(0.6, 0.2, 1.0);
  
  float t = uTime * uFallSpeed * 0.3;
  float scanline1 = sin(vUv.y * 200.0 + t * 3.0) * 0.5 + 0.5;
  float scanline2 = sin(vUv.y * 80.0 - t * 1.5) * 0.5 + 0.5;
  float scanlines = scanline1 * 0.3 + scanline2 * 0.2;
  
  float gridX = smoothstep(0.9, 1.0, fract(vUv.x * 50.0 * uCharDensity));
  float gridY = smoothstep(0.9, 1.0, fract(vUv.y * 50.0 * uCharDensity));
  float grid = max(gridX, gridY) * uTrailLength * 0.5;
  
  float rgbOffset = uCharSize * 0.001;
  float r = texture2D(uMap, vUv + vec2(rgbOffset, 0.0)).r;
  float g = texture2D(uMap, vUv).g;
  float b = texture2D(uMap, vUv - vec2(rgbOffset, 0.0)).b;
  vec3 chromaColor = vec3(r, g, b);
  
  vec3 color = mix(originalColor, chromaColor, uGlowIntensity * 0.4);
  
  float colorMix = sin(vUv.x * 3.0 + uTime * 0.5) * 0.5 + 0.5;
  vec3 neonMix = mix(neonCyan, neonPink, colorMix);
  neonMix = mix(neonMix, neonPurple, sin(vUv.y * 2.0 + uTime * 0.3) * 0.3 + 0.3);
  
  float edgeGlow = smoothstep(0.5, 0.9, lum);
  color = mix(color, neonGlow(color, neonMix, uGlowIntensity), edgeGlow * 0.6);
  
  color += uMatrixColor * grid * uGlowIntensity * 0.5;
  
  color *= 1.0 - scanlines * 0.15;
  
  float flicker = noise(vec2(uTime * 10.0, 0.0)) * 0.05;
  color *= 0.95 + flicker;
  
  float glitch = step(0.995, hash(vec2(floor(uTime * 20.0), floor(vUv.y * 30.0))));
  if (glitch > 0.5) {
    color = mix(color, neonPink, 0.5);
    color.r = texture2D(uMap, vUv + vec2(0.02, 0.0)).r;
  }
  
  color = mix(color * vec3(0.1, 0.1, 0.15), color, uShowOriginal + 0.5);
  
  float bloom = max(0.0, lum - 0.6) * uGlowIntensity * 0.3;
  color += neonMix * bloom;
  
  color += uMatrixColor * 0.03;
  
  vec2 vignetteUV = vUv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.25;
  color *= vignette;
  
  gl_FragColor = vec4(color, texColor.a);
}
