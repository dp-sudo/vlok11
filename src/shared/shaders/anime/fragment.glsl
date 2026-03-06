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

// Enhanced uniforms for improved anime style
uniform float uShadowSoftness;
uniform float uColorShift;
uniform float uDitherStrength;
uniform float uAmbientOcclusion;
uniform vec3 uShadowTint;
uniform vec3 uHighlightTint;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// Noise functions for dithering and effects
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// Enhanced Sobel edge detection with multiple scales
float sobelEdge(vec2 uv, float width) {
  float offset = width * 0.003;

  // Sample 3x3 neighborhood
  float tl = getLuminance(texture2D(uMap, uv + vec2(-offset, offset)).rgb);
  float t  = getLuminance(texture2D(uMap, uv + vec2(0.0, offset)).rgb);
  float tr = getLuminance(texture2D(uMap, uv + vec2(offset, offset)).rgb);
  float l  = getLuminance(texture2D(uMap, uv + vec2(-offset, 0.0)).rgb);
  float c  = getLuminance(texture2D(uMap, uv).rgb);
  float r  = getLuminance(texture2D(uMap, uv + vec2(offset, 0.0)).rgb);
  float bl = getLuminance(texture2D(uMap, uv + vec2(-offset, -offset)).rgb);
  float b  = getLuminance(texture2D(uMap, uv + vec2(0.0, -offset)).rgb);
  float br = getLuminance(texture2D(uMap, uv + vec2(offset, -offset)).rgb);

  // Sobel kernels
  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

  return length(vec2(gx, gy));
}

// Depth-aware edge detection
float depthEdge(vec2 uv, float width) {
  float offset = width * 0.005;

  float tl = texture2D(uMap, uv + vec2(-offset, offset)).a;
  float t  = texture2D(uMap, uv + vec2(0.0, offset)).a;
  float tr = texture2D(uMap, uv + vec2(offset, offset)).a;
  float l  = texture2D(uMap, uv + vec2(-offset, 0.0)).a;
  float r  = texture2D(uMap, uv + vec2(offset, 0.0)).a;
  float bl = texture2D(uMap, uv + vec2(-offset, -offset)).a;
  float b  = texture2D(uMap, uv + vec2(0.0, -offset)).a;
  float br = texture2D(uMap, uv + vec2(offset, -offset)).a;

  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

  return length(vec2(gx, gy));
}

// Improved color quantization with smooth transitions
vec3 quantizeColor(vec3 color, int steps) {
  float n = float(steps);
  return floor(color * n + 0.5) / n;
}

// Soft shadow quantization for anime look
float animeShadow(float luminance, float threshold, float softness) {
  // Create smooth band transitions
  float shadow = smoothstep(threshold - softness, threshold + softness, luminance);

  // Add secondary shadow band for depth
  float deepShadow = smoothstep(threshold * 0.5 - softness * 0.5, threshold * 0.5 + softness * 0.5, luminance);

  return shadow;
}

// Skin tone detection and enhancement
vec3 enhanceSkinTone(vec3 color, float boost) {
  if (boost <= 0.0) return color;

  // Detect skin tone using YCbCr color space
  float r = color.r;
  float g = color.g;
  float b = color.b;

  // YCbCr conversion
  float y = 0.299 * r + 0.587 * g + 0.114 * b;
  float cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 0.5;
  float cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 0.5;

  // Skin tone range in YCbCr
  float skinMask = 1.0;
  skinMask *= smoothstep(0.35, 0.45, y);    // Luminance
  skinMask *= smoothstep(0.55, 0.45, cb);   // Blue difference
  skinMask *= smoothstep(0.35, 0.45, cr);   // Red difference

  skinMask = clamp(skinMask, 0.0, 1.0);

  // Apply warm tone enhancement
  vec3 warmShift = vec3(1.08, 1.02, 0.95);
  color = mix(color, color * warmShift, skinMask * boost);

  return color;
}

// Dithering for smooth color transitions
vec3 applyDither(vec3 color, vec2 uv, float strength) {
  if (strength <= 0.0) return color;

  float dither = random(uv + fract(uTime * 0.01)) * 2.0 - 1.0;
  dither *= strength * 0.02;

  return color + dither;
}

// Color shift effect for anime look
vec3 applyColorShift(vec3 color, vec2 uv, float shift) {
  if (shift <= 0.0) return color;

  // Subtle chromatic shift based on position
  float offset = shift * 0.002;
  float r = texture2D(uMap, uv + vec2(offset, 0.0)).r;
  float g = color.g;
  float b = texture2D(uMap, uv - vec2(offset, 0.0)).b;

  return vec3(r, g, b);
}

void main() {
  vec4 texColor = texture2D(uMap, vUv);
  vec3 color = texColor.rgb;

  // Apply color shift first
  color = applyColorShift(color, vUv, uColorShift);

  // Calculate luminance
  float lum = getLuminance(color);

  // Enhanced shadow quantization with softness
  float shadow = animeShadow(lum, uShadowThreshold, uShadowSoftness);

  // Primary color quantization for anime look
  vec3 quantized = quantizeColor(color, uShadowSteps);

  // Apply shadow with soft transition
  vec3 shadowColor = color * uShadowTint;
  vec3 litColor = color;

  // Blend between shadow and lit colors
  color = mix(shadowColor, litColor, shadow);

  // Apply quantized bands to maintain anime look
  color = mix(color, quantized, 0.7);

  // Highlight processing with soft edges
  float highlightStart = 0.65 + (1.0 - uHighlightSharpness) * 0.15;
  float highlight = smoothstep(highlightStart, highlightStart + 0.15, lum);
  vec3 highlightColor = mix(color * uHighlightTint, vec3(1.0), 0.4);
  color = mix(color, highlightColor, highlight * 0.5);

  // Apply skin tone enhancement
  color = enhanceSkinTone(color, uSkinToneBoost);

  // Apply dithering for smooth gradients
  color = applyDither(color, vUv, uDitherStrength);

  // Ambient occlusion simulation based on luminance
  float ao = mix(1.0, lum, uAmbientOcclusion * 0.3);
  color *= ao;

  // Multi-scale edge detection for outline
  float edge1 = sobelEdge(vUv, uOutlineWidth);
  float edge2 = sobelEdge(vUv, uOutlineWidth * 1.5);
  float depth = depthEdge(vUv, uOutlineWidth);

  // Combine edges for better detection
  float edge = max(max(edge1, edge2), depth * 0.5);

  // Soft outline with smooth falloff
  float outlineMask = smoothstep(0.08, 0.35, edge);
  outlineMask = pow(outlineMask, 1.5); // Sharpen the edge

  // Mix outline color smoothly
  color = mix(color, uOutlineColor, outlineMask);

  // Add subtle rim lighting effect
  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
  rim = smoothstep(0.6, 1.0, rim);
  color += vec3(0.05, 0.08, 0.12) * rim * 0.3;

  gl_FragColor = vec4(color, texColor.a);
}
