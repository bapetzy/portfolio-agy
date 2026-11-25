import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { disposeGeometries } from '../lib/dispose'
import { buildMergedGeometry } from '../lib/mergeParts'
import { createSpring, snapSpring, stepSpring } from '../lib/spring'
import { useAtelierMaterials } from '../shaders/atelierMaterials'
import { runtimeState } from '../state/runtimeStore'
import { useUiStore } from '../state/uiStore'

export function AtelierGreybox() {
  const palette = useAtelierMaterials()
  const rootRef = useRef<THREE.Group>(null)
  const profileStackRef = useRef<THREE.Group>(null)
  const profileRingRef = useRef<THREE.Mesh>(null)
  const contactEnvelopeRef = useRef<THREE.Group>(null)
  const contactWingRef = useRef<THREE.Group>(null)

  const profileLiftSpring = useRef(createSpring(0))
  const profileRotSpring = useRef(createSpring(0))
  const contactRotSpring = useRef(createSpring(0.08))
  const contactLiftSpring = useRef(createSpring(0))

  const geos = useMemo(() => {
    const washDisc = new THREE.CircleGeometry(2.55, 40)

    // Two complete compact side-markers tucked beside the S-curve horizon (no orphan vertical sticks)
    const corridorWarm = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.11, 1.35, 0.18), position: [6.45, 0.68, -4.4], rotation: [0, -0.35, 0] },
      { geometry: new THREE.BoxGeometry(0.11, 1.35, 0.18), position: [7.15, 0.68, -4.72], rotation: [0, -0.35, 0] },
      { geometry: new THREE.BoxGeometry(0.95, 0.1, 0.2), position: [6.8, 1.36, -4.56], rotation: [0, -0.35, 0] },
      { geometry: new THREE.BoxGeometry(0.11, 1.45, 0.18), position: [6.55, 0.72, -11.45], rotation: [0, -0.28, 0] },
      { geometry: new THREE.BoxGeometry(0.11, 1.45, 0.18), position: [7.25, 0.72, -11.72], rotation: [0, -0.28, 0] },
      { geometry: new THREE.BoxGeometry(0.96, 0.1, 0.2), position: [6.9, 1.44, -11.58], rotation: [0, -0.28, 0] },
    ])

    // Station 2 — Profile staggered kinetic totems
    const profileBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.56, 1.06, 0.56), position: [-0.78, 0.62, -0.1] },
      { geometry: new THREE.BoxGeometry(2.18, 0.045, 0.2), position: [0, 0.44, 0.36] },
    ])
    const profileWarm = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.045, 1.08, 0.14), position: [-0.96, 0.63, 0.16] },
      { geometry: new THREE.BoxGeometry(0.56, 1.38, 0.56), position: [0.0, 0.78, 0.04] },
      { geometry: new THREE.BoxGeometry(0.54, 0.86, 0.54), position: [0.78, 0.52, -0.04] },
    ])

    // Station 3 — Contact portal & sealed correspondence
    const contactPortal = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.12, 1.25, 0.18), position: [-0.82, 0.72, -0.46] },
      { geometry: new THREE.BoxGeometry(0.12, 1.25, 0.18), position: [0.82, 0.72, -0.46] },
      { geometry: new THREE.BoxGeometry(1.78, 0.12, 0.22), position: [0, 1.36, -0.46] },
    ])
    const contactEnvelopeWarm = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(1.48, 0.055, 1.06), position: [-0.14, 0.12, 0] },
      { geometry: new THREE.BoxGeometry(0.2, 0.045, 1.24), position: [0.82, 0.116, 0.0] },
    ])
    const contactEnvelopeBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(1.32, 0.025, 0.82), position: [-0.14, 0.148, 0.14] },
      { geometry: new THREE.BoxGeometry(1.42, 0.024, 0.52), position: [-0.14, 0.164, -0.22] },
    ])
    const contactWaxSeal = buildMergedGeometry([
      { geometry: new THREE.CylinderGeometry(0.11, 0.115, 0.03, 20), position: [0.28, 0.172, 0.18] },
      { geometry: new THREE.CylinderGeometry(0.068, 0.07, 0.016, 20), position: [0.28, 0.188, 0.18] },
    ])

    return {
      washDisc,
      corridorWarm,
      profileBright,
      profileWarm,
      contactPortal,
      contactEnvelopeWarm,
      contactEnvelopeBright,
      contactWaxSeal,
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    return () => {
      if (root) {
        disposeGeometries(root)
      }
    }
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const elapsed = state.clock.elapsedTime
    const { reducedMotion } = useUiStore.getState()
    const px = runtimeState.pointerNDC.x

    const profile = profileStackRef.current
    if (profile) {
      const p2 = runtimeState.sectionProgress[2]
      if (reducedMotion) {
        profile.position.y = snapSpring(profileLiftSpring.current, 0)
        profile.rotation.y = snapSpring(profileRotSpring.current, 0)
      } else {
        const targetY = Math.sin(p2 * Math.PI) * 0.11 + Math.sin(elapsed * 1.1) * 0.02
        const targetRot = px * 0.08 + (p2 - 0.5) * 0.12
        profile.position.y = stepSpring(profileLiftSpring.current, targetY, 52, 10, dt)
        profile.rotation.y = stepSpring(profileRotSpring.current, targetRot, 48, 10.5, dt)
      }
    }

    if (profileRingRef.current) {
      if (reducedMotion) {
        profileRingRef.current.rotation.set(0.35, 0, 0.2)
      } else {
        profileRingRef.current.rotation.y = elapsed * 0.65
        profileRingRef.current.rotation.z = 0.2 + Math.sin(elapsed * 1.2) * 0.12
      }
    }

    const contact = contactEnvelopeRef.current
    if (contact) {
      const p3 = runtimeState.sectionProgress[3]
      if (reducedMotion) {
        contact.rotation.y = snapSpring(contactRotSpring.current, 0.08)
        contact.position.y = snapSpring(contactLiftSpring.current, 0)
      } else {
        const targetRotY = 0.08 - (1 - p3) * 0.14 + px * 0.08
        const targetLift = Math.sin(p3 * Math.PI) * 0.09 + Math.sin(elapsed * 1.25) * 0.025
        contact.rotation.y = stepSpring(contactRotSpring.current, targetRotY, 48, 10, dt)
        contact.position.y = stepSpring(contactLiftSpring.current, targetLift, 44, 9.5, dt)
      }
    }

    if (contactWingRef.current) {
      if (reducedMotion) {
        contactWingRef.current.position.y = 0.42
        contactWingRef.current.rotation.set(0.18, -0.3, 0.22)
      } else {
        contactWingRef.current.position.y = 0.42 + Math.sin(elapsed * 1.65) * 0.045
        contactWingRef.current.rotation.z = 0.22 + Math.sin(elapsed * 1.35) * 0.08
        contactWingRef.current.rotation.y = -0.3 + px * 0.16
      }
    }
  })

  return (
    <group ref={rootRef}>
      {/* Lightweight Floating Corridor Arches Framing the S-Curve */}
      <mesh receiveShadow material={palette.paperWarm} geometry={geos.corridorWarm} />

      {/* Station 2 — Profile & Capabilities Island */}
      <group position={[1.65, 0.1, -15.4]} rotation={[0, 0.22, 0]}>
        <mesh
          position={[0, -0.096, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={palette.sunlitWash}
          geometry={geos.washDisc}
        />
        <mesh position={[0, 0.036, 0]} receiveShadow material={palette.travertineBase}>
          <cylinderGeometry args={[1.56, 1.62, 0.072, 40]} />
        </mesh>
        <mesh position={[0, 0.082, 0]} receiveShadow material={palette.paperCream}>
          <cylinderGeometry args={[1.38, 1.4, 0.026, 40]} />
        </mesh>

        <group ref={profileStackRef}>
          <mesh castShadow receiveShadow material={palette.paperBright} geometry={geos.profileBright} />
          <mesh castShadow receiveShadow material={palette.paperWarm} geometry={geos.profileWarm} />

          {/* Chromatic Playful Totem Finials (Coral, Cobalt, Mint) */}
          <mesh position={[-0.78, 1.21, -0.1]} material={palette.cobaltPin}>
            <sphereGeometry args={[0.11, 18, 18]} />
          </mesh>
          <mesh position={[0.0, 1.52, 0.04]} material={palette.vermilionSeal}>
            <boxGeometry args={[0.28, 0.08, 0.28]} />
          </mesh>
          <mesh position={[0.78, 1.0, -0.04]} material={palette.mintSage}>
            <cylinderGeometry args={[0.12, 0.12, 0.09, 20]} />
          </mesh>

          <mesh position={[0, 0.48, 0.42]} material={palette.charcoalRule}>
            <boxGeometry args={[2.06, 0.018, 0.028]} />
          </mesh>
          <mesh
            ref={profileRingRef}
            position={[0.0, 1.66, 0.04]}
            rotation={[0.35, 0, 0.2]}
            material={palette.marigoldSun}
          >
            <torusGeometry args={[0.24, 0.022, 12, 28]} />
          </mesh>
        </group>
      </group>

      {/* Station 3 — Contact Island */}
      <group position={[4.55, 0.08, -23.0]} rotation={[0, -0.18, 0]}>
        <mesh
          position={[0, -0.076, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={palette.sunlitWash}
          geometry={geos.washDisc}
        />
        <mesh position={[0, 0.036, 0]} receiveShadow material={palette.travertineBase}>
          <cylinderGeometry args={[1.52, 1.58, 0.072, 40]} />
        </mesh>
        <mesh position={[0, 0.08, 0]} receiveShadow material={palette.paperCream}>
          <cylinderGeometry args={[1.34, 1.36, 0.024, 40]} />
        </mesh>

        {/* Sunlit Architectural Portal & Marigold Keystone */}
        <mesh castShadow receiveShadow material={palette.paperBright} geometry={geos.contactPortal} />
        <mesh position={[0, 1.44, -0.46]} material={palette.marigoldSun}>
          <boxGeometry args={[0.34, 0.08, 0.26]} />
        </mesh>

        {/* Levitating Sealed Correspondence & Sculptural Paper-Wing */}
        <group ref={contactEnvelopeRef} rotation={[0, 0.08, 0]}>
          <mesh receiveShadow material={palette.paperWarm} geometry={geos.contactEnvelopeWarm} />
          <mesh receiveShadow material={palette.paperBright} geometry={geos.contactEnvelopeBright} />
          <mesh material={palette.vermilionSeal} geometry={geos.contactWaxSeal} />
          <mesh position={[0.75, 0.142, 0.0]} material={palette.charcoalRule}>
            <boxGeometry args={[0.022, 0.01, 1.1]} />
          </mesh>

          <group ref={contactWingRef} position={[0.42, 0.42, -0.06]} rotation={[0.18, -0.3, 0.22]}>
            <mesh position={[-0.1, 0, 0]} rotation={[0, 0, 0.28]} castShadow material={palette.paperBright}>
              <boxGeometry args={[0.28, 0.018, 0.34]} />
            </mesh>
            <mesh position={[0.1, 0, 0]} rotation={[0, 0, -0.28]} castShadow material={palette.cobaltPin}>
              <boxGeometry args={[0.28, 0.018, 0.34]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
