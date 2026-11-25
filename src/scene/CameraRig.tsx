import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createSpring, snapSpring, stepSpring } from '../lib/spring'
import {
  registerFrameInvalidator,
  runtimeState,
  updateCameraTelemetry,
} from '../state/runtimeStore'
import { useUiStore } from '../state/uiStore'

// Module-scope S-curve splines, focus map & scratch math objects: zero allocation inside useFrame().
const CAMERA_POS_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-0.25, 2.05, 5.25),
    new THREE.Vector3(3.2, 3.45, -1.6),
    new THREE.Vector3(3.45, 3.32, -1.95),
    new THREE.Vector3(0.15, 2.15, -10.1),
    new THREE.Vector3(2.95, 2.55, -18.1),
  ],
  false,
  'catmullrom',
  0.48,
)

const CAMERA_TARGET_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0.35, 0.92, 0.0),
    new THREE.Vector3(3.52, 0.42, -7.2),
    new THREE.Vector3(3.62, 0.42, -7.22),
    new THREE.Vector3(0.55, 0.95, -15.4),
    new THREE.Vector3(3.35, 0.75, -23.0),
  ],
  false,
  'catmullrom',
  0.48,
)

const PROJECT_FOCUS_OFFSETS: Record<string, readonly [number, number]> = {
  'salt-and-ember': [-0.18, -0.12],
  queuecraft: [0.18, -0.12],
  'kamar-gelap': [-0.18, 0.14],
  'atlas-unfinished-places': [0.18, 0.14],
}

const BASE_FOV = 38
const _pos = new THREE.Vector3()
const _target = new THREE.Vector3()
const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _zAxis = new THREE.Vector3(0, 0, 1)
const _lookMatrix = new THREE.Matrix4()
const _targetQuat = new THREE.Quaternion()
const _rollQuat = new THREE.Quaternion()
const _dampedTarget = new THREE.Vector3(0.35, 0.92, 0.0)

export function CameraRig() {
  const invalidate = useThree((s) => s.invalidate)
  const initializedRef = useRef(false)

  const posXSpring = useRef(createSpring(-0.25))
  const posYSpring = useRef(createSpring(2.05))
  const posZSpring = useRef(createSpring(5.25))

  const tgtXSpring = useRef(createSpring(0.35))
  const tgtYSpring = useRef(createSpring(0.92))
  const tgtZSpring = useRef(createSpring(0.0))

  const parallaxXSpring = useRef(createSpring(0))
  const parallaxYSpring = useRef(createSpring(0))
  const focusXSpring = useRef(createSpring(0))
  const focusZSpring = useRef(createSpring(0))
  const rollSpring = useRef(createSpring(0))
  const fovSpring = useRef(createSpring(BASE_FOV))

  useEffect(() => {
    registerFrameInvalidator(invalidate)
    return () => {
      registerFrameInvalidator(null)
    }
  }, [invalidate])

  useFrame((state, delta) => {
    runtimeState.frameCount += 1

    const t = runtimeState.cameraT
    const velocity = runtimeState.velocity
    const { activeProjectId, reducedMotion } = useUiStore.getState()
    const dt = Math.min(delta, 0.05)

    CAMERA_POS_CURVE.getPointAt(t, _pos)
    CAMERA_TARGET_CURVE.getPointAt(t, _target)

    _forward.subVectors(_target, _pos).normalize()
    _right.crossVectors(_forward, _up).normalize()

    const aspect = state.size.width / Math.max(1, state.size.height)
    if (aspect < 1.05) {
      _pos.addScaledVector(_forward, -1.45)
      _pos.y += 0.25
      _target.addScaledVector(_right, 0.55)
      _target.y -= 0.1
    }

    // Micro-focus framing leans strictly toward the selected (active) maquette in Works.
    const wIn = THREE.MathUtils.smoothstep(t, 0.2, 0.3)
    const wOut = 1 - THREE.MathUtils.smoothstep(t, 0.54, 0.64)
    const worksFocusWeight = wIn * wOut
    const focusOffset = PROJECT_FOCUS_OFFSETS[activeProjectId]
    const desiredFocusX = (focusOffset?.[0] ?? 0) * worksFocusWeight
    const desiredFocusZ = (focusOffset?.[1] ?? 0) * worksFocusWeight

    let fx: number
    let fz: number
    let pxOff: number
    let pyOff: number
    let rollVal: number
    let nextFov: number

    if (reducedMotion || !initializedRef.current) {
      fx = snapSpring(focusXSpring.current, 0)
      fz = snapSpring(focusZSpring.current, 0)
      pxOff = snapSpring(parallaxXSpring.current, 0)
      pyOff = snapSpring(parallaxYSpring.current, 0)
      rollVal = snapSpring(rollSpring.current, 0)
      nextFov = snapSpring(fovSpring.current, BASE_FOV)
    } else {
      fx = stepSpring(focusXSpring.current, desiredFocusX, 52, 12.2, dt)
      fz = stepSpring(focusZSpring.current, desiredFocusZ, 52, 12.2, dt)
      pxOff = stepSpring(
        parallaxXSpring.current,
        runtimeState.pointerNDC.x * 0.3,
        52,
        12.5,
        dt,
      )
      pyOff = stepSpring(
        parallaxYSpring.current,
        runtimeState.pointerNDC.y * 0.16,
        52,
        12.5,
        dt,
      )
      const desiredRoll = THREE.MathUtils.clamp(-velocity * 0.0012, -0.028, 0.028)
      rollVal = stepSpring(rollSpring.current, desiredRoll, 42, 11.0, dt)
      const desiredFov =
        BASE_FOV + THREE.MathUtils.clamp(Math.abs(velocity) * 0.14, 0, 3.4)
      nextFov = stepSpring(fovSpring.current, desiredFov, 44, 12, dt)
    }

    _target.x += fx
    _target.z += fz
    _pos.addScaledVector(_right, pxOff)
    _pos.y += pyOff

    const cam = state.camera
    if (!initializedRef.current || reducedMotion) {
      snapSpring(posXSpring.current, _pos.x)
      snapSpring(posYSpring.current, _pos.y)
      snapSpring(posZSpring.current, _pos.z)
      snapSpring(tgtXSpring.current, _target.x)
      snapSpring(tgtYSpring.current, _target.y)
      snapSpring(tgtZSpring.current, _target.z)
      cam.position.copy(_pos)
      _dampedTarget.copy(_target)
      initializedRef.current = true
    } else {
      cam.position.x = stepSpring(posXSpring.current, _pos.x, 58, 13.5, dt)
      cam.position.y = stepSpring(posYSpring.current, _pos.y, 58, 13.5, dt)
      cam.position.z = stepSpring(posZSpring.current, _pos.z, 58, 13.5, dt)

      _dampedTarget.x = stepSpring(tgtXSpring.current, _target.x, 62, 14.0, dt)
      _dampedTarget.y = stepSpring(tgtYSpring.current, _target.y, 62, 14.0, dt)
      _dampedTarget.z = stepSpring(tgtZSpring.current, _target.z, 62, 14.0, dt)
    }

    _lookMatrix.lookAt(cam.position, _dampedTarget, _up)
    _targetQuat.setFromRotationMatrix(_lookMatrix)
    _rollQuat.setFromAxisAngle(_zAxis, rollVal)
    _targetQuat.multiply(_rollQuat)

    if (reducedMotion || runtimeState.frameCount <= 1) {
      cam.quaternion.copy(_targetQuat)
    } else {
      cam.quaternion.slerp(_targetQuat, 1 - Math.exp(-9.5 * dt))
    }

    if (cam instanceof THREE.PerspectiveCamera) {
      if (Math.abs(cam.fov - nextFov) > 0.002) {
        cam.fov = nextFov
        cam.updateProjectionMatrix()
      }
    }

    updateCameraTelemetry(
      cam.position.x,
      cam.position.y,
      cam.position.z,
      _dampedTarget.x,
      _dampedTarget.y,
      _dampedTarget.z,
    )
  })

  return null
}
