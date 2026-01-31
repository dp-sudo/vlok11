precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform float uScanlineIntensity;
uniform float uScanlineDensity;
uniform float uRGBOffset;
uniform float uFlickerSpeed;
uniform float uGlitchIntensity;
uniform float uFresnelPower;
uniform vec3 uHoloColor;
uniform float uDataStreamSpeed;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i), hash(i + 1.0), smoothstep(0.0, 1.0, f));
}

void main() {
  vec2 uv = vUv;
  
  if (uGlitchIntensity > 0.0) {
    float glitchTime = floor(uTime * 15.0);
    float glitchLine = floor(vUv.y * 50.0);
    float glitchRand = hash(glitchTime + glitchLine * 0.1);
    
    if (glitchRand > 0.97) {
      float offset = (hash(glitchTime * 2.0 + glitchLine) - 0.5) * uGlitchIntensity * 0.15;
      uv.x += offset;
    }
    
    if (hash(glitchTime * 0.5) > 0.98) {
      float blockY = floor(vUv.y * 10.0);
      if (hash(blockY + glitchTime) > 0.7) {
        uv.x += (hash(blockY * 2.0) - 0.5) * uGlitchIntensity * 0.2;
      }
    }
  }
  
  float rgbOffset = uRGBOffset * 3.0;
  float r = texture2D(uMap, uv + vec2(rgbOffset, 0.0)).r;
  float g = texture2D(uMap, uv).g;
  float b = texture2D(uMap, uv - vec2(rgbOffset, 0.0)).b;
  vec3 color = vec3(r, g, b);
  
  float scanline = sin(vUv.y * uScanlineDensity * 3.14159 + uTime * 2.0) * 0.5 + 0.5;
  scanline = pow(scanline, 0.8);
  color *= 1.0 - (1.0 - scanline) * uScanlineIntensity * 0.4;
  
  float flicker = noise(uTime * uFlickerSpeed * 8.0) * 0.1 + 0.95;
  color *= flicker;
  
  vec3 viewDir = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  float fresnel = pow(1.0 - abs(dot(viewDir, normal)), uFresnelPower);
  
  color += uHoloColor * fresnel * 0.6;
  
  if (uDataStreamSpeed > 0.0) {
    float stream1 = sin(vUv.y * 80.0 - uTime * uDataStreamSpeed * 8.0);
    float stream2 = sin(vUv.y * 120.0 - uTime * uDataStreamSpeed * 12.0 + 1.5);
    float dataStream = max(smoothstep(0.85, 1.0, stream1), smoothstep(0.9, 1.0, stream2));
    color += uHoloColor * dataStream * 0.25;
  }
  
  color = mix(color, color * uHoloColor, 0.15);
  
  color += uHoloColor * 0.08;
  
  gl_FragColor = vec4(color, 0.92);
}
