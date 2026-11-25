import * as THREE from 'three'

export function disposeMaterial(
  material: THREE.Material | THREE.Material[],
): void {
  const list = Array.isArray(material) ? material : [material]
  for (const mat of list) {
    for (const value of Object.values(mat)) {
      if (value instanceof THREE.Texture) {
        value.dispose()
      }
    }
    mat.dispose()
  }
}

export function disposeGeometries(root: THREE.Object3D): void {
  const seen = new Set<THREE.BufferGeometry>()
  root.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.Points
    ) {
      const geo = child.geometry
      if (geo && !seen.has(geo)) {
        seen.add(geo)
        geo.dispose()
      }
    }
  })
}

export function disposeObject3D(root: THREE.Object3D): void {
  const seenGeos = new Set<THREE.BufferGeometry>()
  const seenMats = new Set<THREE.Material>()
  root.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.Points
    ) {
      const geo = child.geometry
      if (geo && !seenGeos.has(geo)) {
        seenGeos.add(geo)
        geo.dispose()
      }
      if (child.material) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material]
        for (const mat of mats) {
          if (!seenMats.has(mat)) {
            seenMats.add(mat)
            disposeMaterial(mat)
          }
        }
      }
    }
  })
}

export function disposeRenderTarget(
  target: THREE.WebGLRenderTarget | null | undefined,
): void {
  target?.dispose()
}

export function disposeLightShadow(
  light: THREE.Light | null | undefined,
): void {
  if (!light?.shadow) return
  const shadow = light.shadow as THREE.LightShadow & {
    mapPass?: THREE.WebGLRenderTarget | null
    dispose?: () => void
  }
  shadow.map?.dispose()
  shadow.mapPass?.dispose()
  shadow.dispose?.()
}
