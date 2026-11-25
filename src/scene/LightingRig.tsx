import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { disposeLightShadow } from '../lib/dispose'
import { runtimeState } from '../state/runtimeStore'
import { useUiStore } from '../state/uiStore'

// Module-scope curve & scratch vector matching the 4 S-curve island centers: zero allocations in useFrame.
const STATION_CENTER_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(1.45, 0.3, 0.0),
    new THREE.Vector3(5.05, 0.3, -7.2),
    new THREE.Vector3(1.65, 0.4, -15.4),
    new THREE.Vector3(4.55, 0.3, -23.0),
  ],
  false,
  'catmullrom',
  0.45,
)

const _stationCenter = new THREE.Vector3()

export function LightingRig() {
  const keyLightRef = useRef<THREE.DirectionalLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)
  const qualityTier = useUiStore((s) => s.qualityTier)

  const shadowMapSize = qualityTier === 'high' ? 1024 : 512

  useEffect(() => {
    const light = keyLightRef.current
    const target = targetRef.current
    if (light && target) {
      light.target = target
      target.updateMatrixWorld()
    }
    return () => {
      disposeLightShadow(light)
    }
  }, [])

  useFrame((_, delta) => {
    const light = keyLightRef.current
    const target = targetRef.current
    if (!light || !target) return

    const dt = Math.min(delta, 0.05)
    const { reducedMotion } = useUiStore.getState()
    STATION_CENTER_CURVE.getPointAt(runtimeState.cameraT, _stationCenter)

    const pointerOffsetX = reducedMotion ? 0 : runtimeState.pointerNDC.x * 0.42
    const pointerOffsetY = reducedMotion ? 0 : runtimeState.pointerNDC.y * 0.24

    const targetPosX = _stationCenter.x + 4.4 + pointerOffsetX
    const targetPosY = 7.6 + pointerOffsetY
    const targetPosZ = _stationCenter.z + 4.4

    const desiredIntensity =
      1.48 + Math.sin(runtimeState.cameraT * Math.PI) * 0.14

    if (reducedMotion) {
      light.position.set(targetPosX, targetPosY, targetPosZ)
      target.position.copy(_stationCenter)
      light.intensity = desiredIntensity
    } else {
      light.position.x = THREE.MathUtils.damp(
        light.position.x,
        targetPosX,
        4.8,
        dt,
      )
      light.position.y = THREE.MathUtils.damp(
        light.position.y,
        targetPosY,
        4.8,
        dt,
      )
      light.position.z = THREE.MathUtils.damp(
        light.position.z,
        targetPosZ,
        5.0,
        dt,
      )
      target.position.x = THREE.MathUtils.damp(
        target.position.x,
        _stationCenter.x,
        5.2,
        dt,
      )
      target.position.y = THREE.MathUtils.damp(
        target.position.y,
        _stationCenter.y,
        5.2,
        dt,
      )
      target.position.z = THREE.MathUtils.damp(
        target.position.z,
        _stationCenter.z,
        5.2,
        dt,
      )
      light.intensity = THREE.MathUtils.damp(
        light.intensity,
        desiredIntensity,
        4.2,
        dt,
      )
    }
    target.updateMatrixWorld()
  })

  return (
    <group>
      <hemisphereLight args={['#FFFFFF', '#EFE3D0', 1.15]} />
      <object3D ref={targetRef} position={[1.45, 0.3, 0]} />
      <directionalLight
        ref={keyLightRef}
        position={[5.85, 7.6, 4.4]}
        intensity={1.48}
        color="#FFF9EE"
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={5.5}
        shadow-camera-bottom={-5.5}
        shadow-camera-near={1}
        shadow-camera-far={28}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight
        position={[-6, 4.2, 5]}
        intensity={0.38}
        color="#E4EEFF"
      />
    </group>
  )
}
