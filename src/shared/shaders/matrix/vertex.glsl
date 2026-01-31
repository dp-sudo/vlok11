uniform float uDisplacementScale;
uniform float uDisplacementBias;
uniform sampler2D uDisplacementMap;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  vec3 transformed = position;
  
  if (uDisplacementScale > 0.0) {
    float displacement = texture2D(uDisplacementMap, uv).r;
    transformed += normal * (displacement * uDisplacementScale + uDisplacementBias);
  }
  
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
