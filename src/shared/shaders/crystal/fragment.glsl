precision highp float;

uniform sampler2D uMap;
uniform vec2 uTexelSize;
uniform float uTime;
uniform float uIOR;
uniform float uDispersion;
uniform float uFresnelPower;
uniform float uTransmission;
uniform float uCaustics;
uniform vec3 uCrystalColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  
  float NdotV = abs(dot(viewDir, normal));
  float fresnel = pow(1.0 - NdotV, uFresnelPower);
  
  float iorOffset = (1.0 - 1.0 / uIOR) * 0.08;
  vec2 refractedUV = vUv + normal.xy * iorOffset;
  
  float dispersionOffset = uDispersion * 0.015;
  vec2 uvR = refractedUV + vec2(dispersionOffset, 0.0);
  vec2 uvG = refractedUV;
  vec2 uvB = refractedUV - vec2(dispersionOffset, 0.0);
  
  float r = texture2D(uMap, uvR).r;
  float g = texture2D(uMap, uvG).g;
  float b = texture2D(uMap, uvB).b;
  vec3 refractedColor = vec3(r, g, b);
  
  vec4 originalColor = texture2D(uMap, vUv);
  refractedColor = mix(refractedColor, originalColor.rgb, 0.3);
  
  vec3 color = mix(refractedColor, uCrystalColor, fresnel * 0.4);
  
  if (uCaustics > 0.0) {
    float caustic1 = sin(vUv.x * 40.0 + uTime * 0.8) * sin(vUv.y * 40.0 + uTime * 0.6);
    float caustic2 = sin(vUv.x * 60.0 - uTime * 0.5) * sin(vUv.y * 50.0 - uTime * 0.7);
    float caustic = (caustic1 + caustic2) * 0.25 + 0.5;
    caustic = pow(caustic, 4.0) * uCaustics;
    color += caustic * uCrystalColor * 0.4;
  }
  
  color = mix(color, refractedColor, uTransmission * 0.6);
  
  color += fresnel * uCrystalColor * 0.35;
  
  float sparkle = pow(hash(vUv * 100.0 + uTime), 20.0) * fresnel;
  color += vec3(sparkle) * 0.3;
  
  float alpha = mix(0.85, 0.95, uTransmission);
  alpha = mix(alpha, 0.7, fresnel * 0.3);
  
  gl_FragColor = vec4(color, alpha);
}
