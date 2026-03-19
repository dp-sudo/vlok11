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

// Enhanced cel shading uniforms
uniform float uSpecularThreshold;
uniform float uSpecularIntensity;
uniform float uShadowIntensity;
uniform float uEdgeSoftness;
uniform float uRimLightIntensity;
uniform vec3 uRimLightColor;
uniform float uToonContrast;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// Enhanced Sobel edge detection
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

// Color-aware edge detection
float colorEdge(vec2 uv, float thickness) {
  float offset = thickness * 0.005;

  vec3 c = texture2D(uMap, uv).rgb;
  vec3 l = texture2D(uMap, uv + vec2(-offset, 0.0)).rgb;
  vec3 r = texture2D(uMap, uv + vec2(offset, 0.0)).rgb;
  vec3 t = texture2D(uMap, uv + vec2(0.0, offset)).rgb;
  vec3 b = texture2D(uMap, uv + vec2(0.0, -offset)).rgb;

  float colorDiff = length(c - l) + length(c - r) + length(c - t) + length(c - b);

  return colorDiff * 0.5;
}

// Enhanced posterization with smooth toon contrast
vec3 posterize(vec3 color, int bands, float contrast) {
  float n = float(bands);

  // 使用平滑的色阶量化而非硬切割
  vec3 quantized = floor(color * n + 0.5) / n;

  // 保留原始颜色与量化颜色的混合，过渡更自然
  float blendFactor = 0.6; // 60% 量化 + 40% 原始
  vec3 posterized = mix(color, quantized, blendFactor);

  // 柔和的对比度调整
  posterized = (posterized - 0.5) * contrast + 0.5;

  return clamp(posterized, 0.0, 1.0);
}

// Multi-level shadow system - 更平滑的过渡
float toonShadow(float luminance, float intensity) {
  // 使用平滑过渡替代硬边缘
  float shadow = 1.0;

  // 深阴影区域
  if (luminance < 0.2) {
    shadow = mix(0.25, 0.4, smoothstep(0.0, 0.2, luminance));
  }
  // 中等阴影区域
  else if (luminance < 0.4) {
    shadow = mix(0.4, 0.65, smoothstep(0.2, 0.4, luminance));
  }
  // 浅阴影区域
  else if (luminance < 0.65) {
    shadow = mix(0.65, 0.9, smoothstep(0.4, 0.65, luminance));
  }
  // 高光区域
  else {
    shadow = mix(0.9, 1.0, smoothstep(0.65, 0.85, luminance));
  }

  return mix(1.0, shadow, intensity);
}

// Enhanced halftone pattern with multiple sizes
float halftonePattern(vec2 uv, float size, float value) {
  if (size <= 0.0) return 0.0;

  // Use multiple dot sizes for visual interest
  float dotSpacing = size * 0.008;
  vec2 cell = floor(uv / dotSpacing);
  vec2 cellUV = fract(uv / dotSpacing) - 0.5;

  // Vary dot size based on position
  float sizeVariation = random(cell) * 0.3 + 0.85;
  float dotRadius = (1.0 - value) * 0.45 * sizeVariation;

  float dist = length(cellUV);

  // Add some noise variation
  float noise = random(cell + fract(uTime * 0.1)) * 0.1;

  return 1.0 - smoothstep(dotRadius - 0.08, dotRadius + 0.05 + noise, dist);
}

// Cartoon specular highlight
float toonSpecular(vec3 normal, vec3 lightDir, vec3 viewDir, float threshold, float size) {
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = max(dot(normal, halfDir), 0.0);

  // Sharp specular highlight
  spec = smoothstep(1.0 - size, 1.0, spec);

  // Apply threshold
  spec = step(threshold, spec);

  return spec;
}

// Rim lighting for cartoon effect
float rimLight(vec3 normal, vec3 viewDir, float power) {
  float rim = 1.0 - max(dot(viewDir, normal), 0.0);
  rim = pow(rim, power);
  return rim;
}

void main() {
  vec4 texColor = texture2D(uMap, vUv);
  vec3 color = texColor.rgb;

  // Calculate luminance
  float lum = getLuminance(color);

  // Apply toon contrast
  color = posterize(color, uColorBands, uToonContrast);

  // Multi-level toon shadow
  float shadow = toonShadow(lum, uShadowIntensity);

  // Apply shadow with color
  vec3 shadowColorAdjusted = mix(color, uShadowColor, 0.4);
  color = mix(shadowColorAdjusted, color, shadow);

  // Halftone effect in shadows
  if (uHalftoneSize > 0.0) {
    float halftone = halftonePattern(vUv, uHalftoneSize, lum);
    float shadowStrength = smoothstep(0.65, 0.2, lum);
    color = mix(color, uShadowColor, halftone * shadowStrength * 0.5);
  }

  // Enhanced specular highlight
  if (uSpecularSize > 0.0) {
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    vec3 viewDir = normalize(vViewPosition);
    float spec = toonSpecular(vNormal, lightDir, viewDir, uSpecularThreshold, uSpecularSize);
    color = mix(color, vec3(1.0), spec * uSpecularIntensity);
  }

  // Rim lighting
  if (uRimLightIntensity > 0.0) {
    vec3 viewDir = normalize(vViewPosition);
    float rim = rimLight(vNormal, viewDir, 2.5);
    rim = smoothstep(0.4, 0.8, rim);
    color = mix(color, uRimLightColor, rim * uRimLightIntensity);
  }

  // Combined edge detection
  float edge1 = sobelEdge(vUv, uOutlineThickness);
  float edge2 = colorEdge(vUv, uOutlineThickness);
  float edge = max(edge1, edge2 * 0.7);

  // Apply outline with soft falloff
  float outlineMask = smoothstep(0.12 - uEdgeSoftness * 0.05, 0.4 + uEdgeSoftness * 0.1, edge);
  outlineMask = pow(outlineMask, 1.2);
  color = mix(color, uOutlineColor, outlineMask);

  // Add subtle light direction shading
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
  float lightShade = max(dot(vNormal, lightDir), 0.0);
  lightShade = step(0.3, lightShade) * 0.15 + 0.85;
  color *= lightShade;

  gl_FragColor = vec4(color, texColor.a);
}
