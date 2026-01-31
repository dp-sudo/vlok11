precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform int uShadowSteps;
uniform float uShadowThreshold;
uniform float uHighlightSharpness;
uniform float uOutlineWidth;
uniform vec3 uOutlineColor;
uniform float uSkinToneBoost;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float sobelEdge(vec2 uv, float width) {
  float offset = width * 0.003;
  
  float tl = getLuminance(texture2D(uMap, uv + vec2(-offset, offset)).rgb);
  float t  = getLuminance(texture2D(uMap, uv + vec2(0.0, offset)).rgb);
  float tr = getLuminance(texture2D(uMap, uv + vec2(offset, offset)).rgb);
  float l  = getLuminance(texture2D(uMap, uv + vec2(-offset, 0.0)).rgb);
  float c  = getLuminance(texture2D(uMap, uv).rgb);
  float r  = getLuminance(texture2D(uMap, uv + vec2(offset, 0.0)).rgb);
  float bl = getLuminance(texture2D(uMap, uv + vec2(-offset, -offset)).rgb);
  float b  = getLuminance(texture2D(uMap, uv + vec2(0.0, -offset)).rgb);
  float br = getLuminance(texture2D(uMap, uv + vec2(offset, -offset)).rgb);
  
  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
  
  return length(vec2(gx, gy));
}

vec3 quantizeColor(vec3 color, int steps) {
  float n = float(steps);
  return floor(color * n + 0.5) / n;
}

void main() {
  vec4 texColor = texture2D(uMap, vUv);
  vec3 color = texColor.rgb;
  
  float lum = getLuminance(color);
  
  vec3 quantized = quantizeColor(color, uShadowSteps);
  
  float shadowFactor = smoothstep(uShadowThreshold - 0.15, uShadowThreshold + 0.15, lum);
  vec3 shadowedColor = quantized * 0.7;
  vec3 litColor = quantized;
  color = mix(shadowedColor, litColor, shadowFactor);
  
  float highlightStart = 0.6 + (1.0 - uHighlightSharpness) * 0.2;
  float highlight = smoothstep(highlightStart, highlightStart + 0.2, lum);
  color = mix(color, min(color * 1.25 + vec3(0.1), vec3(1.0)), highlight * 0.5);
  
  if (uSkinToneBoost > 0.0) {
    float r = color.r;
    float g = color.g;
    float b = color.b;
    float skinMask = step(0.3, r) * step(g, r) * step(b, g) * step(0.0, r - g) * step(r - g, 0.4);
    color.r = mix(color.r, min(color.r * 1.1, 1.0), skinMask * uSkinToneBoost);
    color.g = mix(color.g, color.g * 1.02, skinMask * uSkinToneBoost * 0.5);
    color = mix(color, color * vec3(1.0, 0.98, 0.95), skinMask * uSkinToneBoost * 0.3);
  }
  
  float edge = sobelEdge(vUv, uOutlineWidth);
  float outlineMask = smoothstep(0.1, 0.35, edge);
  color = mix(color, uOutlineColor, outlineMask);
  
  gl_FragColor = vec4(color, texColor.a);
}
