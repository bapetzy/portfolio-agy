import * as THREE from 'three'

export interface PaperPlasterSurfaceConfig {
  grainScale: number
  fiberStrength: number
  strataStrength: number
  bumpStrength: number
  roughnessJitter: number
  warmWrap: number
  edgeShade: number
  contactAO: number
}

export interface SharedAtelierUniforms {
  uSunDirection: { value: THREE.Vector3 }
}

const VERTEX_PARS = /* glsl */ `
varying vec3 vAtelierWorldPos;
varying vec3 vAtelierWorldNormal;
varying vec3 vAtelierLocalPos;
`

const VERTEX_WORLD = /* glsl */ `
#include <project_vertex>
vec4 atelierWp = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  atelierWp = instanceMatrix * atelierWp;
#endif
atelierWp = modelMatrix * atelierWp;
vAtelierWorldPos = atelierWp.xyz;
vAtelierLocalPos = position;
vec3 atelierN = objectNormal;
#ifdef USE_INSTANCING
  atelierN = mat3( instanceMatrix ) * atelierN;
#endif
vAtelierWorldNormal = normalize( mat3( modelMatrix ) * atelierN );
`

const FRAGMENT_PARS = /* glsl */ `
uniform vec3 uSunDirection;
uniform float uGrainScale;
uniform float uFiberStrength;
uniform float uStrataStrength;
uniform float uBumpStrength;
uniform float uRoughnessJitter;
uniform float uWarmWrap;
uniform float uEdgeShade;
uniform float uContactAO;

varying vec3 vAtelierWorldPos;
varying vec3 vAtelierWorldNormal;
varying vec3 vAtelierLocalPos;

float atelierHash31( vec3 p ) {
  p = fract( p * vec3( 0.1031, 0.1030, 0.0973 ) );
  p += dot( p, p.yxz + 33.33 );
  return fract( ( p.x + p.y ) * p.z );
}

float atelierNoise3( vec3 x ) {
  vec3 i = floor( x );
  vec3 f = fract( x );
  f = f * f * ( 3.0 - 2.0 * f );

  float n000 = atelierHash31( i + vec3( 0.0, 0.0, 0.0 ) );
  float n100 = atelierHash31( i + vec3( 1.0, 0.0, 0.0 ) );
  float n010 = atelierHash31( i + vec3( 0.0, 1.0, 0.0 ) );
  float n110 = atelierHash31( i + vec3( 1.0, 1.0, 0.0 ) );
  float n001 = atelierHash31( i + vec3( 0.0, 0.0, 1.0 ) );
  float n101 = atelierHash31( i + vec3( 1.0, 0.0, 1.0 ) );
  float n011 = atelierHash31( i + vec3( 0.0, 1.0, 1.0 ) );
  float n111 = atelierHash31( i + vec3( 1.0, 1.0, 1.0 ) );

  float nx00 = mix( n000, n100, f.x );
  float nx10 = mix( n010, n110, f.x );
  float nx01 = mix( n001, n101, f.x );
  float nx11 = mix( n011, n111, f.x );

  float nxy0 = mix( nx00, nx10, f.y );
  float nxy1 = mix( nx01, nx11, f.y );
  return mix( nxy0, nxy1, f.z );
}

float atelierCottonWeave( vec3 wp, vec3 an, float scale ) {
  vec3 p = wp * scale;
  float fiberA = sin( p.x * 1.35 + p.y * 0.45 + atelierNoise3( p * 0.42 ) * 3.1 );
  float fiberB = sin( p.z * 1.35 - p.y * 0.35 + atelierNoise3( p * 0.42 + 11.7 ) * 3.1 );
  float crossWeave = ( fiberA * 0.5 + fiberB * 0.5 ) * 0.25;
  float pulp = atelierNoise3( p * 1.15 ) - 0.5;
  float fine = atelierNoise3( p * 2.85 + 5.2 ) - 0.5;
  float triWeight = an.y * 0.85 + ( an.x + an.z ) * 0.5;
  return ( crossWeave * 0.45 + pulp * 0.65 + fine * 0.35 ) * clamp( triWeight, 0.65, 1.15 );
}

float atelierMineralField( vec3 wp, vec3 an, float scale ) {
  vec3 p = wp * scale;
  float strata = sin( wp.y * scale * 0.72 + atelierNoise3( p * 0.28 ) * 2.4 ) * 0.32;
  float pores = atelierNoise3( p * 0.95 ) - 0.5;
  float grit = atelierNoise3( p * 2.4 + 3.1 ) - 0.5;
  float sideWeight = 1.0 - an.y * 0.45;
  return strata * sideWeight + pores * 0.65 + grit * 0.3;
}

float atelierFieldSample( vec3 wp, vec3 an ) {
  float fiber = atelierCottonWeave( wp, an, uGrainScale );
  float mineral = atelierMineralField( wp, an, uGrainScale * 0.85 );
  return fiber * uFiberStrength + mineral * uStrataStrength;
}

float atelierIGN( vec2 fragCoord ) {
  return fract( 52.9829189 * fract( dot( fragCoord, vec2( 0.06711056, 0.00583715 ) ) ) );
}
`

const FRAGMENT_MAP_PATCH = /* glsl */ `
#include <map_fragment>
vec3 atelierAbsN = abs( normalize( vAtelierWorldNormal ) );
float atelierGrain = atelierFieldSample( vAtelierWorldPos, atelierAbsN );
float atelierVerticalMask = 1.0 - atelierAbsN.y;
float atelierEdgeMod = clamp( atelierVerticalMask * 0.65 + length( vAtelierLocalPos ) * 0.04, 0.0, 1.0 );
diffuseColor.rgb *= clamp( 1.0 + atelierGrain * 0.075 - atelierEdgeMod * uEdgeShade, 0.82, 1.08 );
`

const FRAGMENT_ROUGHNESS_PATCH = /* glsl */ `
#include <roughnessmap_fragment>
roughnessFactor = clamp( roughnessFactor + atelierGrain * uRoughnessJitter, 0.68, 0.99 );
`

const FRAGMENT_NORMAL_PATCH = /* glsl */ `
#include <normal_fragment_maps>
float atelierEps = 0.015;
float atelierGx = atelierFieldSample( vAtelierWorldPos + vec3( atelierEps, 0.0, 0.0 ), atelierAbsN );
float atelierGy = atelierFieldSample( vAtelierWorldPos + vec3( 0.0, atelierEps, 0.0 ), atelierAbsN );
float atelierGz = atelierFieldSample( vAtelierWorldPos + vec3( 0.0, 0.0, atelierEps ), atelierAbsN );
vec3 atelierGradW = vec3( atelierGx - atelierGrain, atelierGy - atelierGrain, atelierGz - atelierGrain ) / atelierEps;
vec3 atelierGradView = ( viewMatrix * vec4( atelierGradW, 0.0 ) ).xyz;
normal = normalize( normal - atelierGradView * uBumpStrength );
`

const FRAGMENT_OUTGOING_TARGET =
  'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;'

const FRAGMENT_OUTGOING_PATCH = /* glsl */ `
vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
float atelierSunDot = dot( normalize( vAtelierWorldNormal ), normalize( uSunDirection ) );
float atelierWrapBand = smoothstep( -0.28, 0.38, atelierSunDot ) * ( 1.0 - smoothstep( 0.38, 0.95, atelierSunDot ) * 0.45 );
outgoingLight += vec3( 1.0, 0.94, 0.84 ) * ( atelierWrapBand * uWarmWrap );
float atelierGroundAO = mix( 1.0 - uContactAO, 1.0, smoothstep( -0.08, 0.28, max( vAtelierWorldPos.y, 0.0 ) ) );
outgoingLight *= atelierGroundAO;
`

const FRAGMENT_DITHER_PATCH = /* glsl */ `
#include <dithering_fragment>
gl_FragColor.rgb += ( atelierIGN( gl_FragCoord.xy ) - 0.5 ) * ( 1.2 / 255.0 );
`

export function createPaperPlasterMaterial(
  colorHex: string,
  baseRoughness: number,
  surface: PaperPlasterSurfaceConfig,
  sharedUniforms: SharedAtelierUniforms,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: baseRoughness,
    metalness: 0.01,
  })

  material.customProgramCacheKey = () => 'atelier-paper-plaster-v1'

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSunDirection = sharedUniforms.uSunDirection
    shader.uniforms.uGrainScale = { value: surface.grainScale }
    shader.uniforms.uFiberStrength = { value: surface.fiberStrength }
    shader.uniforms.uStrataStrength = { value: surface.strataStrength }
    shader.uniforms.uBumpStrength = { value: surface.bumpStrength }
    shader.uniforms.uRoughnessJitter = { value: surface.roughnessJitter }
    shader.uniforms.uWarmWrap = { value: surface.warmWrap }
    shader.uniforms.uEdgeShade = { value: surface.edgeShade }
    shader.uniforms.uContactAO = { value: surface.contactAO }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
      .replace('#include <project_vertex>', VERTEX_WORLD)

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace('#include <map_fragment>', FRAGMENT_MAP_PATCH)
      .replace('#include <roughnessmap_fragment>', FRAGMENT_ROUGHNESS_PATCH)
      .replace('#include <normal_fragment_maps>', FRAGMENT_NORMAL_PATCH)
      .replace(FRAGMENT_OUTGOING_TARGET, FRAGMENT_OUTGOING_PATCH)
      .replace('#include <dithering_fragment>', FRAGMENT_DITHER_PATCH)
  }

  return material
}
