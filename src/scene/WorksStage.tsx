import { useEffect, useMemo, useRef } from 'react'
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { registerWorksScreenPointsSource } from '../lib/devProbe'
import { disposeGeometries } from '../lib/dispose'
import { buildMergedGeometry } from '../lib/mergeParts'
import { createSpring, snapSpring, stepSpring } from '../lib/spring'
import { useAtelierMaterials } from '../shaders/atelierMaterials'
import { useUiStore } from '../state/uiStore'

// Scratch vector used only by dev-only screen projection probe outside useFrame.
const _probeWorld = new THREE.Vector3()
const NO_RAYCAST: THREE.Object3D['raycast'] = () => {}

const PROJECT_INDEX_ROT_PULSE: Record<string, number> = {
  'salt-and-ember': 0.04,
  queuecraft: -0.04,
  'kamar-gelap': 0.03,
  'atlas-unfinished-places': -0.03,
}

export function WorksStage() {
  const palette = useAtelierMaterials()
  const invalidate = useThree((s) => s.invalidate)
  const getThree = useThree((s) => s.get)

  const rootRef = useRef<THREE.Group>(null)
  const turntableRef = useRef<THREE.Group>(null)
  const saltRef = useRef<THREE.Group>(null)
  const queueRef = useRef<THREE.Group>(null)
  const kamarRef = useRef<THREE.Group>(null)
  const atlasRef = useRef<THREE.Group>(null)

  const saltLampRef = useRef<THREE.Group>(null)
  const queueSliderRef = useRef<THREE.Group>(null)
  const kamarPrintsRef = useRef<THREE.Group>(null)
  const atlasLensRef = useRef<THREE.Group>(null)

  const saltIndicatorRef = useRef<THREE.Mesh>(null)
  const queueIndicatorRef = useRef<THREE.Mesh>(null)
  const kamarIndicatorRef = useRef<THREE.Mesh>(null)
  const atlasIndicatorRef = useRef<THREE.Mesh>(null)

  const hovered3DRef = useRef<string | null>(null)
  const hoveredMeshesRef = useRef<Map<string, Set<THREE.Object3D>>>(new Map())
  const mountedRef = useRef(true)

  const turntableSpring = useRef(createSpring(-0.18))
  const slotSpringsRef = useRef({
    'salt-and-ember': {
      y: createSpring(0.1),
      scale: createSpring(1),
      rotY: createSpring(0),
      tiltX: createSpring(0),
      indicatorX: createSpring(1),
    },
    queuecraft: {
      y: createSpring(0.1),
      scale: createSpring(1),
      rotY: createSpring(-0.06),
      tiltX: createSpring(0),
      indicatorX: createSpring(0.001),
    },
    'kamar-gelap': {
      y: createSpring(0.1),
      scale: createSpring(1),
      rotY: createSpring(0.05),
      tiltX: createSpring(0),
      indicatorX: createSpring(0.001),
    },
    'atlas-unfinished-places': {
      y: createSpring(0.1),
      scale: createSpring(1),
      rotY: createSpring(-0.04),
      tiltX: createSpring(0),
      indicatorX: createSpring(0.001),
    },
  })

  const geos = useMemo(() => {
    const washDisc = new THREE.CircleGeometry(3.2, 40)
    const sharedIndicator = new THREE.BoxGeometry(0.92, 0.018, 0.032)

    const trayDividers = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(3.6, 0.012, 0.025), position: [0, 0.088, 0.03] },
      { geometry: new THREE.BoxGeometry(0.025, 0.012, 3.6), position: [0, 0.088, 0.03] },
    ])

    // 01 — Salt & Ember
    const saltBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(1.06, 0.042, 0.96), position: [0, 0.021, 0] },
      { geometry: new THREE.CylinderGeometry(0.19, 0.21, 0.1, 24), position: [-0.04, 0.49, 0] },
    ])
    const saltMidCream = buildMergedGeometry([
      { geometry: new THREE.CylinderGeometry(0.28, 0.3, 0.1, 24), position: [-0.04, 0.27, 0] },
      { geometry: new THREE.CylinderGeometry(0.24, 0.26, 0.12, 24), position: [-0.04, 0.38, 0] },
    ])
    const saltLampCharcoal = buildMergedGeometry([
      { geometry: new THREE.CylinderGeometry(0.014, 0.014, 0.64, 8), position: [0, 0.32, 0] },
      { geometry: new THREE.BoxGeometry(0.32, 0.016, 0.016), position: [-0.14, 0.61, 0.08], rotation: [0, -0.5, 0.38] },
    ])

    // 02 — Queuecraft
    const queueBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(1.08, 0.042, 0.96), position: [0, 0.021, 0] },
      { geometry: new THREE.BoxGeometry(0.09, 0.035, 0.74), position: [-0.08, 0.27, 0.0] },
    ])
    const queueTracks = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.92, 0.035, 0.12), position: [0, 0.055, -0.22] },
      { geometry: new THREE.BoxGeometry(0.92, 0.035, 0.12), position: [0, 0.055, 0.0] },
      { geometry: new THREE.BoxGeometry(0.92, 0.035, 0.12), position: [0, 0.055, 0.22] },
    ])
    const queueGantryPosts = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.03, 0.22, 0.03), position: [-0.08, 0.16, -0.34] },
      { geometry: new THREE.BoxGeometry(0.03, 0.22, 0.03), position: [-0.08, 0.16, 0.34] },
    ])
    const queueBlocksCobalt = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.2, 0.1, 0.095), position: [-0.25, 0.12, -0.22] },
      { geometry: new THREE.BoxGeometry(0.16, 0.14, 0.095), position: [0.08, 0.14, -0.22] },
    ])

    // 03 — Kamar Gelap
    const kamarBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(1.06, 0.042, 0.96), position: [0, 0.021, 0] },
      { geometry: new THREE.BoxGeometry(0.82, 0.035, 0.56), position: [0, 0.055, 0.14] },
    ])
    const kamarFrame = buildMergedGeometry([
      { geometry: new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8), position: [-0.36, 0.34, -0.06] },
      { geometry: new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8), position: [0.36, 0.34, -0.06] },
      { geometry: new THREE.CylinderGeometry(0.012, 0.012, 0.78, 8), position: [0, 0.63, -0.06], rotation: [0, 0, Math.PI / 2] },
    ])
    const kamarPrintsAll = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.175, 0.35, 0.018), position: [-0.21, -0.19, 0] },
      { geometry: new THREE.BoxGeometry(0.175, 0.35, 0.018), position: [0, -0.19, 0] },
      { geometry: new THREE.BoxGeometry(0.175, 0.35, 0.018), position: [0.21, -0.19, 0] },
    ])
    const kamarClips = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.036, 0.04, 0.034), position: [-0.21, 0.0, 0.0] },
      { geometry: new THREE.BoxGeometry(0.044, 0.046, 0.038), position: [0, 0.0, 0.0] },
      { geometry: new THREE.BoxGeometry(0.036, 0.04, 0.034), position: [0.21, 0.0, 0.0] },
    ])

    // 04 — Atlas
    const atlasBright = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(1.08, 0.042, 0.96), position: [0, 0.021, 0] },
      { geometry: new THREE.BoxGeometry(0.25, 0.035, 0.2), position: [0.08, 0.222, -0.05] },
    ])
    const atlasMintLayers = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.88, 0.04, 0.74), position: [0, 0.065, 0] },
      { geometry: new THREE.BoxGeometry(0.56, 0.04, 0.46), position: [0.03, 0.145, -0.02], rotation: [0, -0.06, 0] },
    ])
    const atlasCreamLayers = buildMergedGeometry([
      { geometry: new THREE.BoxGeometry(0.72, 0.04, 0.6), position: [-0.04, 0.105, 0.03], rotation: [0, 0.05, 0] },
      { geometry: new THREE.BoxGeometry(0.4, 0.04, 0.32), position: [0.06, 0.185, -0.04], rotation: [0, 0.04, 0] },
    ])

    return {
      washDisc,
      sharedIndicator,
      trayDividers,
      saltBright,
      saltMidCream,
      saltLampCharcoal,
      queueBright,
      queueTracks,
      queueGantryPosts,
      queueBlocksCobalt,
      kamarBright,
      kamarFrame,
      kamarPrintsAll,
      kamarClips,
      atlasBright,
      atlasMintLayers,
      atlasCreamLayers,
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const unsub = useUiStore.subscribe((state, prev) => {
      if (
        state.reducedMotion &&
        (state.activeProjectId !== prev.activeProjectId ||
          state.hoveredProjectId !== prev.hoveredProjectId ||
          state.isProjectDetailOpen !== prev.isProjectDetailOpen)
      ) {
        invalidate()
      }
    })

    if (import.meta.env.DEV) {
      registerWorksScreenPointsSource(() => {
        const { camera, size } = getThree()
        const map: Record<string, THREE.Group | null> = {
          'salt-and-ember': saltRef.current,
          queuecraft: queueRef.current,
          'kamar-gelap': kamarRef.current,
          'atlas-unfinished-places': atlasRef.current,
        }
        const out: Record<string, { x: number; y: number }> = {}
        for (const [id, group] of Object.entries(map)) {
          if (!group) continue
          group.getWorldPosition(_probeWorld)
          _probeWorld.y += 0.1
          _probeWorld.project(camera)
          out[id] = {
            x: ((_probeWorld.x + 1) * 0.5) * size.width,
            y: ((1 - _probeWorld.y) * 0.5) * size.height,
          }
        }
        return out
      })
    }

    const root = rootRef.current
    const hoveredMeshes = hoveredMeshesRef.current
    return () => {
      mountedRef.current = false
      unsub()
      hoveredMeshes.clear()
      hovered3DRef.current = null
      document.body.style.cursor = ''
      registerWorksScreenPointsSource(null)
      if (root) {
        disposeGeometries(root)
      }
    }
  }, [getThree, invalidate])

  const makeHandlers = (id: string) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      let set = hoveredMeshesRef.current.get(id)
      if (!set) {
        set = new Set<THREE.Object3D>()
        hoveredMeshesRef.current.set(id, set)
      }
      set.add(e.object)
      hovered3DRef.current = id
      document.body.style.cursor = 'pointer'
      useUiStore.getState().setHoveredProjectId(id)
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      const set = hoveredMeshesRef.current.get(id)
      set?.delete(e.object)
      if (set && set.size > 0) return

      queueMicrotask(() => {
        if (!mountedRef.current) return
        const currentSet = hoveredMeshesRef.current.get(id)
        if (currentSet && currentSet.size > 0) return
        if (hovered3DRef.current === id) {
          hovered3DRef.current = null
          document.body.style.cursor = ''
          if (useUiStore.getState().hoveredProjectId === id) {
            useUiStore.getState().setHoveredProjectId(null)
          }
        }
      })
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      useUiStore.getState().selectProject(id)
    },
  })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const elapsed = state.clock.elapsedTime
    const {
      activeProjectId,
      hoveredProjectId,
      isProjectDetailOpen,
      reducedMotion,
    } = useUiStore.getState()

    const turntable = turntableRef.current
    if (turntable) {
      const pulse = PROJECT_INDEX_ROT_PULSE[activeProjectId] ?? 0
      const targetRot = reducedMotion ? -0.18 : -0.18 + pulse
      turntable.rotation.y = reducedMotion
        ? snapSpring(turntableSpring.current, -0.18)
        : stepSpring(turntableSpring.current, targetRot, 68, 12.5, dt)
    }

    const updateSlot = (
      id: keyof typeof slotSpringsRef.current,
      group: THREE.Group | null,
      indicator: THREE.Mesh | null,
      baseRotY: number,
      phaseOffset: number,
    ) => {
      if (!group) return
      const s = slotSpringsRef.current[id]
      const isActive = activeProjectId === id && isProjectDetailOpen
      const isSelectedCollapsed = activeProjectId === id && !isProjectDetailOpen
      const isHovered = hoveredProjectId === id

      const hoverBob =
        !reducedMotion && isHovered ? Math.sin(elapsed * 3.0 + phaseOffset) * 0.015 : 0
      const targetY =
        (isActive ? 0.28 : isHovered ? 0.2 : isSelectedCollapsed ? 0.14 : 0.1) +
        hoverBob
      const targetScale = isActive ? 1.07 : isHovered ? 1.04 : 1.0
      const targetRotY =
        isActive && !reducedMotion
          ? baseRotY + 0.14
          : isHovered && !reducedMotion
            ? baseRotY + 0.06
            : baseRotY
      const targetTiltX = !reducedMotion && isActive ? -0.035 : 0
      const targetIndicatorScaleX = isActive
        ? 1.0
        : isHovered
          ? 0.65
          : isSelectedCollapsed
            ? 0.4
            : 0.001

      if (reducedMotion) {
        group.position.y = snapSpring(s.y, targetY)
        const snappedScale = snapSpring(s.scale, targetScale)
        group.scale.setScalar(snappedScale)
        group.rotation.y = snapSpring(s.rotY, targetRotY)
        group.rotation.x = snapSpring(s.tiltX, 0)
        if (indicator) {
          const sx = snapSpring(s.indicatorX, targetIndicatorScaleX)
          indicator.scale.x = sx
          indicator.visible = sx > 0.01
        }
      } else {
        group.position.y = stepSpring(s.y, targetY, 96, 14.0, dt)
        const nextScale = stepSpring(s.scale, targetScale, 96, 14.0, dt)
        group.scale.setScalar(nextScale)
        group.rotation.y = stepSpring(s.rotY, targetRotY, 76, 12.5, dt)
        group.rotation.x = stepSpring(s.tiltX, targetTiltX, 72, 12.5, dt)
        if (indicator) {
          const sx = stepSpring(
            s.indicatorX,
            targetIndicatorScaleX,
            110,
            15.0,
            dt,
          )
          indicator.scale.x = sx
          indicator.visible = sx > 0.01
        }
      }
    }

    updateSlot('salt-and-ember', saltRef.current, saltIndicatorRef.current, 0.0, 0.0)
    updateSlot('queuecraft', queueRef.current, queueIndicatorRef.current, -0.06, 1.4)
    updateSlot('kamar-gelap', kamarRef.current, kamarIndicatorRef.current, 0.05, 2.6)
    updateSlot(
      'atlas-unfinished-places',
      atlasRef.current,
      atlasIndicatorRef.current,
      -0.04,
      3.9,
    )

    // Sub-part playful kinetic motion inside the 4 maquettes
    if (saltLampRef.current) {
      saltLampRef.current.rotation.z = reducedMotion
        ? 0
        : Math.sin(elapsed * 1.45) * 0.075
    }
    if (queueSliderRef.current) {
      queueSliderRef.current.position.x = reducedMotion
        ? 0.1
        : Math.sin(elapsed * 1.7) * 0.24
    }
    if (kamarPrintsRef.current) {
      kamarPrintsRef.current.rotation.x = reducedMotion
        ? 0.02
        : 0.02 + Math.sin(elapsed * 1.55) * 0.065
    }
    if (atlasLensRef.current) {
      if (reducedMotion) {
        atlasLensRef.current.position.set(0.08, 0.26, -0.05)
        atlasLensRef.current.rotation.y = 0
      } else {
        atlasLensRef.current.position.x = 0.08 + Math.cos(elapsed * 1.1) * 0.075
        atlasLensRef.current.position.z = -0.05 + Math.sin(elapsed * 1.1) * 0.06
        atlasLensRef.current.position.y = 0.275 + Math.sin(elapsed * 2.1) * 0.016
        atlasLensRef.current.rotation.y = Math.sin(elapsed * 0.7) * 0.18
      }
    }
  })

  return (
    <group ref={rootRef} position={[5.05, 0, -7.2]}>
      {/* Soft Radial Sunlit Gallery Halo */}
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={palette.sunlitWash}
        geometry={geos.washDisc}
      />

      {/* Sculpted Circular Turntable */}
      <group ref={turntableRef} rotation={[0, -0.18, 0]}>
        <mesh position={[0, 0.036, 0.03]} receiveShadow material={palette.travertineBase}>
          <cylinderGeometry args={[2.28, 2.36, 0.072, 48]} />
        </mesh>
        <mesh position={[0, 0.076, 0.03]} receiveShadow material={palette.paperCream}>
          <cylinderGeometry args={[2.14, 2.16, 0.02, 48]} />
        </mesh>
        <mesh receiveShadow material={palette.travertineDeep} geometry={geos.trayDividers} />

        {/* 01 — Salt & Ember */}
        <group
          ref={saltRef}
          position={[-0.96, 0.1, -0.62]}
          {...makeHandlers('salt-and-ember')}
        >
          <mesh receiveShadow material={palette.paperBright} geometry={geos.saltBright} />
          <mesh
            ref={saltIndicatorRef}
            raycast={NO_RAYCAST}
            position={[0, 0.046, 0.445]}
            scale={[0.001, 1, 1]}
            material={palette.vermilionSeal}
            geometry={geos.sharedIndicator}
          />
          <mesh position={[-0.04, 0.13, 0]} castShadow receiveShadow material={palette.travertineDeep}>
            <cylinderGeometry args={[0.31, 0.33, 0.18, 24]} />
          </mesh>
          <mesh receiveShadow material={palette.paperCream} geometry={geos.saltMidCream} />
          <mesh position={[-0.04, 0.22, 0]} material={palette.marigoldSun}>
            <cylinderGeometry args={[0.315, 0.315, 0.025, 24]} />
          </mesh>
          <group ref={saltLampRef} position={[0.32, 0.04, -0.18]}>
            <mesh raycast={NO_RAYCAST} material={palette.charcoalRule} geometry={geos.saltLampCharcoal} />
            <mesh
              raycast={NO_RAYCAST}
              position={[-0.26, 0.64, 0.14]}
              rotation={[0.2, 0, 0.42]}
              material={palette.vermilionSeal}
            >
              <cylinderGeometry args={[0.04, 0.088, 0.095, 16]} />
            </mesh>
          </group>
        </group>

        {/* 02 — Queuecraft */}
        <group
          ref={queueRef}
          position={[0.96, 0.1, -0.62]}
          {...makeHandlers('queuecraft')}
        >
          <mesh receiveShadow material={palette.paperBright} geometry={geos.queueBright} />
          <mesh
            ref={queueIndicatorRef}
            raycast={NO_RAYCAST}
            position={[0, 0.046, 0.445]}
            scale={[0.001, 1, 1]}
            material={palette.cobaltPin}
            geometry={geos.sharedIndicator}
          />
          <mesh receiveShadow material={palette.travertineBase} geometry={geos.queueTracks} />
          <mesh material={palette.charcoalRule} geometry={geos.queueGantryPosts} />
          <mesh castShadow material={palette.cobaltPin} geometry={geos.queueBlocksCobalt} />
          <group ref={queueSliderRef} position={[0.1, 0.15, 0.0]}>
            <mesh raycast={NO_RAYCAST} material={palette.marigoldSun}>
              <boxGeometry args={[0.24, 0.16, 0.095]} />
            </mesh>
          </group>
          <mesh position={[0.28, 0.135, 0.22]} material={palette.vermilionSeal}>
            <boxGeometry args={[0.16, 0.13, 0.095]} />
          </mesh>
        </group>

        {/* 03 — Kamar Gelap */}
        <group
          ref={kamarRef}
          position={[-0.96, 0.1, 0.68]}
          {...makeHandlers('kamar-gelap')}
        >
          <mesh receiveShadow material={palette.paperBright} geometry={geos.kamarBright} />
          <mesh
            ref={kamarIndicatorRef}
            raycast={NO_RAYCAST}
            position={[0, 0.046, 0.445]}
            scale={[0.001, 1, 1]}
            material={palette.charcoalRule}
            geometry={geos.sharedIndicator}
          />
          <mesh position={[0, 0.072, 0.14]} receiveShadow material={palette.travertineDeep}>
            <boxGeometry args={[0.72, 0.014, 0.46]} />
          </mesh>
          <mesh material={palette.charcoalRule} geometry={geos.kamarFrame} />
          <group ref={kamarPrintsRef} position={[0, 0.61, -0.06]}>
            <mesh raycast={NO_RAYCAST} castShadow receiveShadow material={palette.paperWarm} geometry={geos.kamarPrintsAll} />
            <mesh raycast={NO_RAYCAST} material={palette.vermilionSeal} geometry={geos.kamarClips} />
          </group>
        </group>

        {/* 04 — The Atlas of Unfinished Places */}
        <group
          ref={atlasRef}
          position={[0.96, 0.1, 0.68]}
          {...makeHandlers('atlas-unfinished-places')}
        >
          <mesh receiveShadow material={palette.paperBright} geometry={geos.atlasBright} />
          <mesh
            ref={atlasIndicatorRef}
            raycast={NO_RAYCAST}
            position={[0, 0.046, 0.445]}
            scale={[0.001, 1, 1]}
            material={palette.mintSage}
            geometry={geos.sharedIndicator}
          />
          <mesh castShadow receiveShadow material={palette.mintSage} geometry={geos.atlasMintLayers} />
          <mesh receiveShadow material={palette.paperCream} geometry={geos.atlasCreamLayers} />
          <group ref={atlasLensRef} position={[0.08, 0.26, -0.05]}>
            <mesh
              raycast={NO_RAYCAST}
              rotation={[Math.PI / 2, 0, 0]}
              material={palette.vermilionSeal}
            >
              <torusGeometry args={[0.135, 0.019, 12, 26]} />
            </mesh>
            <mesh
              raycast={NO_RAYCAST}
              position={[0.16, -0.002, 0.14]}
              rotation={[0, -0.78, Math.PI / 2]}
              material={palette.charcoalRule}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
