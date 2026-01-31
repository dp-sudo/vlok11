precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

vec3 adjustBrightness(vec3 color, float brightness) {
  return color * brightness;
}

vec3 adjustContrast(vec3 color, float contrast) {
  return (color - 0.5) * contrast + 0.5;
}

vec3 adjustSaturation(vec3 color, float saturation) {
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(lum), color, saturation);
}

void main() {
  vec4 texColor = texture2D(uMap, vUv);
  vec3 color = texColor.rgb;
  
  color = adjustBrightness(color, uBrightness);
  color = adjustContrast(color, uContrast);
  color = adjustSaturation(color, uSaturation);
  
  color = clamp(color, 0.0, 1.0);
  
  gl_FragColor = vec4(color, texColor.a);
}
