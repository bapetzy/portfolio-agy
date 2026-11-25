import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface PartSpec {
  geometry: THREE.BufferGeometry
  position?: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  scale?: readonly [number, number, number]
}

const _mat4 = new THREE.Matrix4()
const _pos = new THREE.Vector3()
const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()

/**
 * Applies transforms and merges static sub-part geometries into one BufferGeometry,
 * disposing every temporary input geometry immediately so 0 stray GPU buffers remain.
 */
export function buildMergedGeometry(
  parts: readonly PartSpec[],
): THREE.BufferGeometry {
  const prepared: THREE.BufferGeometry[] = []
  try {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const g = part.geometry
      const p = part.position
      const r = part.rotation
      const s = part.scale

      _pos.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0)
      _euler.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0)
      _quat.setFromEuler(_euler)
      _scale.set(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1)
      _mat4.compose(_pos, _quat, _scale)

      g.applyMatrix4(_mat4)
      prepared.push(g)
    }

    const merged = mergeGeometries(prepared, false)
    if (!merged) {
      throw new Error('buildMergedGeometry failed to merge geometries')
    }
    merged.computeBoundingSphere()
    return merged
  } finally {
    for (let i = 0; i < parts.length; i++) {
      parts[i].geometry.dispose()
    }
  }
}
