import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { registerRendererInfoSource } from '../lib/devProbe'
import { getDprRange } from '../lib/perfBudget'
import { AtelierMaterialProvider } from '../shaders/atelierMaterials'
import { useUiStore } from '../state/uiStore'
import { FallbackView } from '../components/dom/FallbackView'
import { AtelierGreybox } from './AtelierGreybox'
import { CameraRig } from './CameraRig'
import { HeroFocal } from './HeroFocal'
import { LightingRig } from './LightingRig'
import { WorksStage } from './WorksStage'

export function CanvasShell() {
  const qualityTier = useUiStore((s) => s.qualityTier)
  const reducedMotion = useUiStore((s) => s.reducedMotion)
  const contextLost = useUiStore((s) => s.contextLost)
  const isTabVisible = useUiStore((s) => s.isTabVisible)

  const cleanupCanvasListenersRef = useRef<(() => void) | null>(null)
  const isFallbackActive = qualityTier === 'fallback' || contextLost

  useEffect(() => {
    if (isFallbackActive) {
      cleanupCanvasListenersRef.current?.()
      cleanupCanvasListenersRef.current = null
      registerRendererInfoSource(null)
      useUiStore.getState().setSceneReady(false)
      document.body.style.cursor = ''
    }
  }, [isFallbackActive])

  useEffect(() => {
    return () => {
      cleanupCanvasListenersRef.current?.()
      cleanupCanvasListenersRef.current = null
      registerRendererInfoSource(null)
      useUiStore.getState().setSceneReady(false)
      document.body.style.cursor = ''
    }
  }, [])

  if (isFallbackActive) {
    return <FallbackView />
  }

  const frameloop = !isTabVisible
    ? 'never'
    : reducedMotion
      ? 'demand'
      : 'always'

  return (
    <div className="canvas-shell" aria-hidden="true">
      <Canvas
        shadows
        dpr={getDprRange(qualityTier)}
        frameloop={frameloop}
        camera={{ position: [-0.25, 2.05, 5.25], fov: 38, near: 0.1, far: 55 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.06,
        }}
        onCreated={({ gl }) => {
          cleanupCanvasListenersRef.current?.()
          const canvas = gl.domElement

          registerRendererInfoSource(() => ({
            calls: gl.info.render.calls,
            triangles: gl.info.render.triangles,
            geometries: gl.info.memory.geometries,
            textures: gl.info.memory.textures,
            programs: gl.info.programs?.length ?? 0,
          }))

          const handleContextLost = (event: Event) => {
            event.preventDefault()
            useUiStore.getState().setContextLost(true)
            useUiStore.getState().setSceneReady(false)
          }

          const handleContextRestored = () => {
            useUiStore.getState().setContextLost(false)
            useUiStore.getState().setSceneReady(true)
          }

          canvas.addEventListener('webglcontextlost', handleContextLost, false)
          canvas.addEventListener(
            'webglcontextrestored',
            handleContextRestored,
            false,
          )

          cleanupCanvasListenersRef.current = () => {
            canvas.removeEventListener(
              'webglcontextlost',
              handleContextLost,
              false,
            )
            canvas.removeEventListener(
              'webglcontextrestored',
              handleContextRestored,
              false,
            )
            registerRendererInfoSource(null)
          }

          useUiStore.getState().setSceneReady(true)
        }}
      >
        <color attach="background" args={['#FBF7EE']} />
        <fog attach="fog" args={['#FBF7EE', 13, 34]} />
        <AtelierMaterialProvider>
          <LightingRig />
          <HeroFocal />
          <WorksStage />
          <AtelierGreybox />
          <CameraRig />
        </AtelierMaterialProvider>
      </Canvas>
    </div>
  )
}
