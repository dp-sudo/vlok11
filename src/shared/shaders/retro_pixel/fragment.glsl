precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform float uPixelSize;
uniform int uPaletteMode;
uniform float uDitherStrength;
uniform float uCRTEffect;
uniform int uColorDepth;
uniform float uScanlineBrightness;

varying vec2 vUv;
varying vec3 vNormal;

vec3 nesPalette[16];
vec3 snesPalette[16];
vec3 gbPalette[4];

void initPalettes() {
  nesPalette[0] = vec3(0.0);
  nesPalette[1] = vec3(0.0, 0.0, 0.67);
  nesPalette[2] = vec3(0.0, 0.0, 1.0);
  nesPalette[3] = vec3(0.4, 0.0, 0.67);
  nesPalette[4] = vec3(0.67, 0.0, 0.33);
  nesPalette[5] = vec3(0.83, 0.0, 0.0);
  nesPalette[6] = vec3(0.67, 0.2, 0.0);
  nesPalette[7] = vec3(0.47, 0.4, 0.0);
  nesPalette[8] = vec3(0.0, 0.47, 0.0);
  nesPalette[9] = vec3(0.0, 0.53, 0.0);
  nesPalette[10] = vec3(0.0, 0.47, 0.2);
  nesPalette[11] = vec3(0.0, 0.4, 0.4);
  nesPalette[12] = vec3(0.47, 0.47, 0.47);
  nesPalette[13] = vec3(0.73, 0.73, 0.73);
  nesPalette[14] = vec3(1.0, 1.0, 1.0);
  nesPalette[15] = vec3(1.0, 0.8, 0.6);
  
  snesPalette[0] = vec3(0.0);
  snesPalette[1] = vec3(0.13, 0.13, 0.4);
  snesPalette[2] = vec3(0.27, 0.27, 0.67);
  snesPalette[3] = vec3(0.4, 0.2, 0.6);
  snesPalette[4] = vec3(0.6, 0.2, 0.4);
  snesPalette[5] = vec3(0.8, 0.27, 0.27);
  snesPalette[6] = vec3(0.87, 0.53, 0.27);
  snesPalette[7] = vec3(0.93, 0.8, 0.4);
  snesPalette[8] = vec3(0.4, 0.73, 0.27);
  snesPalette[9] = vec3(0.27, 0.6, 0.4);
  snesPalette[10] = vec3(0.27, 0.73, 0.73);
  snesPalette[11] = vec3(0.53, 0.53, 0.87);
  snesPalette[12] = vec3(0.67, 0.67, 0.67);
  snesPalette[13] = vec3(0.87, 0.87, 0.87);
  snesPalette[14] = vec3(1.0, 1.0, 1.0);
  snesPalette[15] = vec3(1.0, 0.93, 0.8);
  
  gbPalette[0] = vec3(0.06, 0.22, 0.06);
  gbPalette[1] = vec3(0.19, 0.38, 0.19);
  gbPalette[2] = vec3(0.55, 0.67, 0.06);
  gbPalette[3] = vec3(0.61, 0.73, 0.06);
}

float dither4x4(vec2 pos) {
  int x = int(mod(pos.x, 4.0));
  int y = int(mod(pos.y, 4.0));
  
  float matrix[16];
  matrix[0] = 0.0;  matrix[1] = 8.0;  matrix[2] = 2.0;  matrix[3] = 10.0;
  matrix[4] = 12.0; matrix[5] = 4.0;  matrix[6] = 14.0; matrix[7] = 6.0;
  matrix[8] = 3.0;  matrix[9] = 11.0; matrix[10] = 1.0; matrix[11] = 9.0;
  matrix[12] = 15.0;matrix[13] = 7.0; matrix[14] = 13.0;matrix[15] = 5.0;
  
  int idx = x + y * 4;
  for (int i = 0; i < 16; i++) {
    if (i == idx) return (matrix[i] + 0.5) / 16.0;
  }
  return 0.5;
}

vec3 findNearestColor(vec3 color, int mode) {
  initPalettes();
  
  if (mode == 2) {
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    int idx = int(clamp(lum * 4.0, 0.0, 3.0));
    for (int i = 0; i < 4; i++) {
      if (i == idx) return gbPalette[i];
    }
    return gbPalette[0];
  }
  
  vec3 nearest = nesPalette[0];
  float minDist = 999.0;
  
  for (int i = 0; i < 16; i++) {
    vec3 pal = (mode == 1) ? snesPalette[i] : nesPalette[i];
    float dist = distance(color, pal);
    if (dist < minDist) {
      minDist = dist;
      nearest = pal;
    }
  }
  
  return nearest;
}

vec3 quantize(vec3 color, int depth) {
  float n = float(depth);
  return floor(color * n + 0.5) / n;
}

void main() {
  float pixelScale = max(uPixelSize, 1.0) * 0.008;
  vec2 pixelatedUV = floor(vUv / pixelScale + 0.5) * pixelScale;
  
  vec4 texColor = texture2D(uMap, pixelatedUV);
  vec3 color = texColor.rgb;
  
  if (uDitherStrength > 0.0) {
    vec2 ditherPos = floor(vUv / pixelScale);
    float dither = dither4x4(ditherPos);
    color += (dither - 0.5) * uDitherStrength * 0.15;
    color = clamp(color, 0.0, 1.0);
  }
  
  if (uPaletteMode < 3) {
    color = findNearestColor(color, uPaletteMode);
  } else {
    color = quantize(color, uColorDepth);
  }
  
  if (uCRTEffect > 0.0) {
    float scanlineY = sin(vUv.y * 600.0) * 0.5 + 0.5;
    scanlineY = pow(scanlineY, 1.5);
    float scanlineDark = mix(uScanlineBrightness, 1.0, scanlineY);
    color *= mix(1.0, scanlineDark, uCRTEffect);
    
    vec2 rgbOffset = vec2(uCRTEffect * 0.002, 0.0);
    float rShift = texture2D(uMap, pixelatedUV + rgbOffset).r;
    float bShift = texture2D(uMap, pixelatedUV - rgbOffset).b;
    color.r = mix(color.r, rShift, uCRTEffect * 0.3);
    color.b = mix(color.b, bShift, uCRTEffect * 0.3);
    
    vec2 curvature = vUv * 2.0 - 1.0;
    float vignette = 1.0 - dot(curvature, curvature) * 0.15;
    color *= mix(1.0, vignette, uCRTEffect);
    
    float bloom = dot(color, vec3(0.299, 0.587, 0.114));
    bloom = pow(max(bloom - 0.5, 0.0) * 2.0, 2.0);
    color += bloom * uCRTEffect * 0.1;
  }
  
  gl_FragColor = vec4(color, texColor.a);
}
