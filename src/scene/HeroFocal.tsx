import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { disposeGeometries } from '../lib/dispose'
import { buildMergedGeometry } from '../lib/mergeParts'
import { createSpring, snapSpring, stepSpring } from '../lib/spring'
import { useAtelierMaterials } from '../shaders/atelierMaterials'
import { runtimeState } from '../state/runtimeStore'
import { useUiStore } from '../state/uiStore'

const REST_PAVILION_ROT_Y = -0.26

export function HeroFocal() {
  const palette = useAtelierMaterials()
  const rootRef = useRef<THREE.Group>(null)
  const pavilionRef = useRef<THREE.Group>(null)
  const louversRef = useRef<THREE.Group>(null)
  const mobileRef = useRef<THREE.Group>(null)
  const orbitGemRef = useRef<THREE.Mesh>(null)

  const pavRotY = useRef(createSpring(REST_PAVILION_ROT_Y))
  const pavRotX = useRef(createSpring(0))
  const pavLiftY = useRef(createSpring(0))
  const louverRotY = useRef(createSpring(0))
  const mobilePosY = useRef(createSpring(0))
  const mobileRotZ = useRef(createSpring(0))
  const mobileRotY = useRef(createSpring(0))

  const geos = useMemo(() => {
    const washDisc = new THREE.CircleGeometry(2.55, 40)
    const pavilionBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.32, 1.66, 0.052), position: [0.14 - 0.31 * Math.cos(0.14), 0.83, 0.06 + 0.31 * Math.sin(0.14)], rotation: [0, 0.14, 0] },
      { geometry: new THREE.BoxGeometry(0.32, 1.66, 0.052), position: [0.14 + 0.31 * Math.cos(0.14), 0.83, 0.06 - 0.31 * Math.sin(0.14)], rotation: [0, 0.14, 0] },
      { geometry: new THREE.BoxGeometry(0.34, 0.42, 0.052), position: [0.14, 1.46, 0.06], rotation: [0, 0.14, 0] },
      { geometry: new THREE.CylinderGeometry(0.42, 0.44, 0.04, 28), position: [0.1, 0.02, 0.12] },
    ])
    const pavilionWarm = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(1.06, 1.46, 0.055), position: [-0.26, 0.73, -0.24] },
      { geometry: new THREE.BoxGeometry(0.68, 0.82, 0.075), position: [0.56, 0.41, 0.28], rotation: [0, -0.18, 0] },
    ])
    const louversWarm = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.03, 1.06, 0.18), position: [-0.24, 0.53, 0.12], rotation: [0, 0.28, 0] },
      { geometry: new THREE.BoxGeometry(0.03, 1.42, 0.18), position: [0.0, 0.71, 0.0], rotation: [0, 0.28, 0] },
      { geometry: new THREE.BoxGeometry(0.03, 1.6, 0.18), position: [0.24, 0.8, -0.12], rotation: [0, 0.28, 0] },
    ])
    const louversBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.03, 1.24, 0.18), position: [-0.12, 0.62, 0.06], rotation: [0, 0.28, 0] },
      { geometry: new THREE.BoxGeometry(0.03, 1.52, 0.18), position: [0.12, 0.76, -0.06], rotation: [0, 0.28, 0] },
    ])
    const marigoldTerrace = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.56, 0.055, 0.34), position: [0.08, 0.09, 0.24] },
      { geometry: new THREE.BoxGeometry(0.38, 0.05, 0.22), position: [0.08, 0.142, 0.18] },
      { geometry: new THREE.CylinderGeometry(0.08, 0.08, 0.045, 20), position: [0.56, 0.86, 0.28] },
    ])
    const coralArch = new THREE.TorusGeometry(0.62, 0.048, 14, 34, Math.PI)
    const mobileCharcoal = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.86, 0.022, 0.022), position: [-0.04, 1.52, 0.06] },
      { geometry: new THREE.CylinderGeometry(0.007, 0.007, 0.76, 8), position: [0.04, 1.14, 0.06] },
      { geometry: new THREE.CylinderGeometry(0.006, 0.006, 0.28, 8), position: [-0.42, 1.38, 0.06] },
    ])
    const mobileCoral = buildMergedGeometry([
      { geometry: new THREE.ConeGeometry(0.055, 0.12, 16), position: [0.04, 0.74, 0.06] },
      { geometry: new THREE.BoxGeometry(0.42, 0.055, 0.048), position: [-0.12, 1.56, 0.06] },
    ])

    return {
      washDisc,
      pavilionBright,
      pavilionWarm,
      louversWarm,
      louversBright,
      marigoldTerrace,
      coralArch,
      mobileCharcoal,
      mobileCoral,
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
    const { reducedMotion } = useUiStore.getState()
    const p0 = runtimeState.sectionProgress[0]
    const px = runtimeState.pointerNDC.x
    const py = runtimeState.pointerNDC.y
    const elapsed = state.clock.elapsedTime

    const pavilion = pavilionRef.current
    if (pavilion) {
      if (reducedMotion) {
        pavilion.rotation.set(0, snapSpring(pavRotY.current, REST_PAVILION_ROT_Y), 0)
        snapSpring(pavRotX.current, 0)
        pavilion.position.y = snapSpring(pavLiftY.current, 0.13)
      } else {
        const idleY = Math.sin(elapsed * 0.9) * 0.032
        const targetY = REST_PAVILION_ROT_Y + p0 * 0.34 + px * 0.11 + idleY
        const targetX = -py * 0.045
        const targetLift = 0.13 + Math.sin(p0 * Math.PI) * 0.075
        pavilion.rotation.y = stepSpring(pavRotY.current, targetY, 54, 11, dt)
        pavilion.rotation.x = stepSpring(pavRotX.current, targetX, 54, 11, dt)
        pavilion.position.y = stepSpring(pavLiftY.current, targetLift, 48, 10, dt)
      }
    }

    const louvers = louversRef.current
    if (louvers) {
      if (reducedMotion) {
        louvers.rotation.y = snapSpring(louverRotY.current, 0)
      } else {
        const targetLouverY = px * 0.07 + Math.sin(elapsed * 1.15 + 0.6) * 0.025
        louvers.rotation.y = stepSpring(louverRotY.current, targetLouverY, 64, 12, dt)
      }
    }

    const mobile = mobileRef.current
    if (mobile) {
      if (reducedMotion) {
        mobile.position.y = snapSpring(mobilePosY.current, 0)
        mobile.rotation.z = snapSpring(mobileRotZ.current, 0)
        mobile.rotation.y = snapSpring(mobileRotY.current, 0)
      } else {
        const targetMobY = Math.sin(elapsed * 1.4) * 0.028 + Math.sin(p0 * Math.PI) * 0.055
        const targetMobZ = -px * 0.065 + Math.sin(elapsed * 1.1) * 0.032
        const targetMobRotY = px * 0.12 + p0 * 0.25
        mobile.position.y = stepSpring(mobilePosY.current, targetMobY, 52, 9.5, dt)
        mobile.rotation.z = stepSpring(mobileRotZ.current, targetMobZ, 44, 8.2, dt)
        mobile.rotation.y = stepSpring(mobileRotY.current, targetMobRotY, 46, 9.0, dt)
      }
    }

    const gem = orbitGemRef.current
    if (gem) {
      if (reducedMotion) {
        gem.position.set(0.68, 1.38, 0.32)
        gem.rotation.set(0.2, 0.4, 0.1)
      } else {
        gem.position.y = 1.38 + Math.sin(elapsed * 1.65) * 0.07
        gem.rotation.y = elapsed * 0.55 + px * 0.4
        gem.rotation.x = 0.2 + Math.sin(elapsed * 1.1) * 0.18
      }
    }
  })

  return (
    <group ref={rootRef} position={[1.45, 0, 0]}>
      {/* Soft Radial Sunlit Ground Halo */}
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={palette.sunlitWash}
        geometry={geos.washDisc}
      />

      {/* Stepped Floating Circular Plinth */}
      <mesh position={[0, 0.04, 0]} receiveShadow material={palette.travertineBase}>
        <cylinderGeometry args={[1.48, 1.54, 0.08, 40]} />
      </mesh>
      <mesh position={[0, 0.095, 0]} receiveShadow material={palette.paperBright}>
        <cylinderGeometry args={[1.26, 1.3, 0.042, 40]} />
      </mesh>

      {/* Kinetic Sunlit Pavilion Assembly */}
      <group
        ref={pavilionRef}
        position={[0, 0.13, 0]}
        rotation={[0, REST_PAVILION_ROT_Y, 0]}
      >
        <mesh castShadow receiveShadow material={palette.paperWarm} geometry={geos.pavilionWarm} />
        <mesh castShadow receiveShadow material={palette.paperBright} geometry={geos.pavilionBright} />
        <mesh receiveShadow material={palette.marigoldSun} geometry={geos.marigoldTerrace} />

        {/* Expressive Coral Ribbon Arch */}
        <mesh
          position={[0.04, 0.42, 0.22]}
          rotation={[0, 0.16, 0]}
          castShadow
          receiveShadow
          material={palette.vermilionSeal}
          geometry={geos.coralArch}
        />

        {/* Dynamic Brise-Soleil Fin Array */}
        <group ref={louversRef} position={[-0.42, 0.0, 0.18]}>
          <mesh castShadow receiveShadow material={palette.paperWarm} geometry={geos.louversWarm} />
          <mesh receiveShadow material={palette.paperBright} geometry={geos.louversBright} />
        </group>

        {/* Calder-Style Balanced Kinetic Mobile */}
        <group ref={mobileRef} position={[0.1, 0, 0.08]}>
          <mesh material={palette.charcoalRule} geometry={geos.mobileCharcoal} />
          <mesh material={palette.vermilionSeal} geometry={geos.mobileCoral} />
          <mesh position={[-0.42, 1.22, 0.06]} castShadow material={palette.cobaltPin}>
            <sphereGeometry args={[0.075, 18, 18]} />
          </mesh>
        </group>

        {/* Orbiting Faceted Sunburst Counterweight */}
        <mesh
          ref={orbitGemRef}
          position={[0.68, 1.38, 0.32]}
          material={palette.marigoldSun}
        >
          <octahedronGeometry args={[0.095, 0]} />
        </mesh>
      </group>
    </group>
  )
}
