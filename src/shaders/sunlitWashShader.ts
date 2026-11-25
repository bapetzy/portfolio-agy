import * as THREE from 'three'

const SUNLIT_WASH_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying float vViewDepth;

void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4( position, 1.0 );
  vWorldPos = wp.xyz;
  vec4 mvPos = viewMatrix * wp;
  vViewDepth = -mvPos.z;
  gl_Position = projectionMatrix * mvPos;
}
`

const SUNLIT_WASH_FRAGMENT = /* glsl */ `
uniform float uSunShift;
uniform vec3 uWarmColor;
uniform vec3 uShadeColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec2 vUv;
varying vec3 vWorldPos;
varying float vViewDepth;

float washIGN( vec2 fragCoord ) {
  return fract( 52.9829189 * fract( dot( fragCoord, vec2( 0.06711056, 0.00583715 ) ) ) );
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length( p );
  if ( r >= 1.0 ) discard;

  // Feathered radial sunlit pool vanishing smoothly at r = 1.0
  float radialPool = 1.0 - smoothstep( 0.16, 1.0, r );
  radialPool *= radialPool;

  // Subtle diagonal sunlit window bands modulated by pointer shift
  float diag = vWorldPos.x * 0.65 + vWorldPos.z * 0.45 - uSunShift * 0.75;
  float bandPhase = fract( diag * 0.24 );
  float lightBand = smoothstep( 0.18, 0.38, bandPhase ) * ( 1.0 - smoothstep( 0.62, 0.82, bandPhase ) );

  // Two hairline architectural compass rings inside the pool
  float ringOuter = 1.0 - smoothstep( 0.0, 0.012, abs( r - 0.82 ) );
  float ringInner = 1.0 - smoothstep( 0.0, 0.01, abs( r - 0.56 ) );
  float compassRings = max( ringOuter, ringInner * 0.7 ) * ( 1.0 - smoothstep( 0.88, 1.0, r ) );

  float fogFade = 1.0 - smoothstep( uFogNear, uFogFar, vViewDepth );
  vec3 col = mix( uWarmColor, uShadeColor, ( 1.0 - lightBand ) * 0.42 + compassRings * 0.52 );
  float alpha = clamp(
    ( radialPool * ( 0.16 + lightBand * 0.08 ) + compassRings * 0.12 ) * fogFade,
    0.0,
    0.26
  );

  col += ( washIGN( gl_FragCoord.xy ) - 0.5 ) * ( 1.0 / 255.0 );
  gl_FragColor = vec4( col, alpha );
}
`

export function createSunlitWashMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SUNLIT_WASH_VERTEX,
    fragmentShader: SUNLIT_WASH_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSunShift: { value: 0 },
      uWarmColor: { value: new THREE.Color('#FFFBF2') },
      uShadeColor: { value: new THREE.Color('#E3D7C3') },
      uFogNear: { value: 13.0 },
      uFogFar: { value: 34.0 },
    },
  })
}
