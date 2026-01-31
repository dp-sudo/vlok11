precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform int uColorBands;
uniform float uOutlineThickness;
uniform vec3 uOutlineColor;
uniform vec3 uShadowColor;
uniform float uHalftoneSize;
uniform float uSpecularSize;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float sobelEdge(vec2 uv, float thickness) {
  float offset = thickness * 0.004;
  
  float tl = getLuminance(texture2D(uMap, uv + vec2(-offset, offset)).rgb);
  float t  = getLuminance(texture2D(uMap, uv + vec2(0.0, offset)).rgb);
  float tr = getLuminance(texture2D(uMap, uv + vec2(offset, offset)).rgb);
  float l  = getLuminance(texture2D(uMap, uv + vec2(-offset, 0.0)).rgb);
  float r  = getLuminance(texture2D(uMap, uv + vec2(offset, 0.0)).rgb);
  float bl = getLuminance(texture2D(uMap, uv + vec2(-offset, -offset)).rgb);
  float b  = getLuminance(texture2D(uMap, uv + vec2(0.0, -offset)).rgb);
  float br = getLuminance(texture2D(uMap, uv + vec2(offset, -offset)).rgb);
  
  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
  
  return length(vec2(gx, gy));
}

vec3 posterize(vec3 color, int bands) {
  float n = float(bands);
  return floor(color * n) / (n - 1.0);
}

float halftonePattern(vec2 uv, float size, float value) {
  if (size <= 0.0) return 0.0;
  
  float dotSpacing = size * 0.008;
  vec2 cell = floor(uv / dotSpacing);
  vec2 cellUV = fract(uv / dotSpacing) - 0.5;
  
  float dotRadius = (1.0 - value) * 0.45;
  float dist = length(cellUV);
  
  return 1.0 - smoothstep(dotRadius - 0.05, dotRadius + 0.05, dist);
}

void main() {
  vec4 texColor = texture2D(uMap, vUv);
  vec3 color = texColor.rgb;
  
  color = posterize(color, uColorBands);
  
  float lum = getLuminance(color);
  
  if (uHalftoneSize > 0.0) {
    float halftone = halftonePattern(vUv, uHalftoneSize, lum);
    float shadowStrength = smoothstep(0.5, 0.15, lum);
    color = mix(color, uShadowColor, halftone * shadowStrength * 0.4);
  }
  
  float specular = smoothstep(1.0 - uSpecularSize * 0.5, 1.0, lum);
  color = mix(color, vec3(1.0), specular * 0.6);
  
  float shadowZone = smoothstep(0.4, 0.2, lum);
  color = mix(color, mix(color, uShadowColor, 0.3), shadowZone);
  
  float edge = sobelEdge(vUv, uOutlineThickness);
  float outlineMask = smoothstep(0.15, 0.45, edge);
  color = mix(color, uOutlineColor, outlineMask);
  
  gl_FragColor = vec4(color, texColor.a);
}
