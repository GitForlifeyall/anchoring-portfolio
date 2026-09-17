export const vertexWaveShader = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  float speed = 0.02;
  p.z = (sin(p.x * 5.0 + uTime) * speed + cos(p.y * 4.0 + uTime) * speed);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const vertexBasicShader = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentDisplacementShader = `
precision highp float;
uniform vec4 uResolution;
uniform sampler2D tMap1;
uniform sampler2D tMap2;
uniform sampler2D tMask;
uniform vec2 uIndex;
uniform float uTime;
varying vec2 vUv;

vec2 translateUV(vec2 uv, vec2 translate) {
  return uv - translate;
}

vec2 scaleUV(vec2 uv, vec2 scale, vec2 origin) {
  vec2 st = uv - origin;
  st /= scale;
  return st + origin;
}

void main() {
  vec2 uv = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
  
  float x = -(uIndex.x / 10.0);
  float y = -(uIndex.y / 8.0);
  vec2 currentUV = vec2(x, y);
  vec2 scaledUV = scaleUV(vUv, vec2(10.0, 8.0), vec2(0.0));
  vec2 transformedUV = translateUV(scaledUV, currentUV);
  
  vec4 mask = texture2D(tMask, transformedUV);
  
  // Transition progression from mask.r (0.0 = tMap1, 1.0 = tMap2)
  float progress = clamp(mask.r, 0.0, 1.0);
  
  // Organic displacement edge along the transition boundary
  float edge = smoothstep(0.0, 0.5, progress) * (1.0 - smoothstep(0.5, 1.0, progress)) * 4.0;
  
  // Wave / ripple displacement
  float wave = sin((vUv.y * 12.0) + (uTime * 2.0)) * 0.015 * edge;
  vec2 dispUv1 = uv + vec2(-0.03 * edge + wave, wave * 0.5);
  vec2 dispUv2 = uv + vec2(0.03 * edge + wave, wave * 0.5);
  
  // Chromatic aberration along the wipe boundary
  vec4 color1 = vec4(
    texture2D(tMap1, dispUv1 + vec2(edge * 0.008, 0.0)).r,
    texture2D(tMap1, dispUv1).g,
    texture2D(tMap1, dispUv1 - vec2(edge * 0.008, 0.0)).b,
    1.0
  );
  
  vec4 color2 = vec4(
    texture2D(tMap2, dispUv2 - vec2(edge * 0.008, 0.0)).r,
    texture2D(tMap2, dispUv2).g,
    texture2D(tMap2, dispUv2 + vec2(edge * 0.008, 0.0)).b,
    1.0
  );
  
  gl_FragColor = mix(color1, color2, progress);
}
`;

export const fragmentBasicShader = `
precision highp float;
uniform sampler2D tMap;
uniform vec4 uResolution;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
  vec4 color = texture2D(tMap, uv);
  gl_FragColor = vec4(color.rgb, color.a * uOpacity);
}
`;

export const fragmentMaskWipeShader = `
precision highp float;
uniform vec3 uColor;
uniform sampler2D tMask;
uniform vec2 uIndex;
varying vec2 vUv;

vec2 translateUV(vec2 uv, vec2 translate) { return uv - translate; }
vec2 scaleUV(vec2 uv, vec2 scale, vec2 origin) { vec2 st = uv - origin; st /= scale; return st + origin; }

void main() {
  float x = -(uIndex.x / 10.0);
  float y = -(uIndex.y / 8.0);
  vec2 currentUV = vec2(x, y);
  vec2 scaledUV = scaleUV(vUv, vec2(10.0, 8.0), vec2(0.0));
  vec2 transformedUV = translateUV(scaledUV, currentUV);
  vec4 mask = texture2D(tMask, transformedUV);
  float alpha = mask.r;
  gl_FragColor = vec4(uColor * alpha, alpha);
}
`;
