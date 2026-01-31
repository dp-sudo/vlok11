precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform float uInkDensity;
uniform float uBleedAmount;
uniform float uPaperTexture;
uniform float uBrushTexture;
uniform float uWhiteSpace;
uniform float uEdgeWobble;

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

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = vUv;
  
  if (uEdgeWobble > 0.0) {
    float wobbleX = fbm(vUv * 15.0 + uTime * 0.05) * uEdgeWobble * 0.015;
    float wobbleY = fbm(vUv * 15.0 + vec2(100.0, 0.0) + uTime * 0.05) * uEdgeWobble * 0.015;
    uv += vec2(wobbleX, wobbleY);
  }
  
  vec4 texColor = texture2D(uMap, uv);
  float lum = getLuminance(texColor.rgb);
  
  float inkValue = 1.0 - lum;
  inkValue = pow(inkValue, 1.0 / max(uInkDensity, 0.1));
  
  float bleed1 = fbm(vUv * 25.0) * uBleedAmount * 0.35;
  float bleed2 = fbm(vUv * 40.0 + vec2(50.0, 50.0)) * uBleedAmount * 0.25;
  inkValue += (bleed1 + bleed2) * (1.0 - inkValue * 0.5);
  
  inkValue = smoothstep(uWhiteSpace, uWhiteSpace + 0.35, inkValue);
  
  float paper = fbm(vUv * 80.0) * uPaperTexture * 0.12;
  float paperGrain = noise(vUv * 200.0) * uPaperTexture * 0.06;
  
  float brush1 = fbm(vUv * 30.0 + vec2(uTime * 0.02, 0.0)) * uBrushTexture * 0.2;
  float brush2 = noise(vUv * 60.0) * uBrushTexture * 0.1;
  
  float finalInk = inkValue + paper + paperGrain - (brush1 + brush2) * inkValue;
  finalInk = clamp(finalInk, 0.0, 1.0);
  
  vec3 inkColor = vec3(0.08, 0.06, 0.04);
  vec3 paperColor = vec3(0.96, 0.94, 0.90);
  
  paperColor += vec3(paper * 0.3, paper * 0.25, paper * 0.2);
  
  vec3 color = mix(paperColor, inkColor, finalInk);
  
  float edgeNoise = noise(vUv * 150.0);
  color = mix(color, color * 0.97, edgeNoise * finalInk * 0.3);
  
  gl_FragColor = vec4(color, texColor.a);
}
