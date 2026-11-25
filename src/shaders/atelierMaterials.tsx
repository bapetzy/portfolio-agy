import { createContext, useContext, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { disposeMaterial } from '../lib/dispose'
import { runtimeState } from '../state/runtimeStore'
import { useUiStore } from '../state/uiStore'
import {
  createPaperPlasterMaterial,
  type SharedAtelierUniforms,
} from './paperPlasterShader'
import { createSunlitWashMaterial } from './sunlitWashShader'

export interface AtelierMaterialPalette {
  paperBright: THREE.MeshStandardMaterial
  paperWarm: THREE.MeshStandardMaterial
  paperCream: THREE.MeshStandardMaterial
  plasterSoft: THREE.MeshStandardMaterial
  travertineBase: THREE.MeshStandardMaterial
  travertineDeep: THREE.MeshStandardMaterial
  vermilionSeal: THREE.MeshStandardMaterial
  marigoldSun: THREE.MeshStandardMaterial
  cobaltPin: THREE.MeshStandardMaterial
  mintSage: THREE.MeshStandardMaterial
  charcoalRule: THREE.MeshStandardMaterial
  sunlitWash: THREE.ShaderMaterial
}

const AtelierMaterialContext = createContext<AtelierMaterialPalette | null>(
  null,
)

// Scratch vector allocated once at module scope: zero allocations in useFrame.
const _sunVec = new THREE.Vector3(4.2, 7.6, 4.4).normalize()

export function AtelierMaterialProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { palette, sharedUniforms } = useMemo(() => {
    const uniforms: SharedAtelierUniforms = {
      uSunDirection: { value: new THREE.Vector3(4.2, 7.6, 4.4).normalize() },
    }

    const built: AtelierMaterialPalette = {
      paperBright: createPaperPlasterMaterial(
        '#FFFDF8',
        0.86,
        {
          grainScale: 16.0,
          fiberStrength: 0.65,
          strataStrength: 0.08,
          bumpStrength: 0.015,
          roughnessJitter: 0.055,
          warmWrap: 0.065,
          edgeShade: 0.032,
          contactAO: 0.06,
        },
        uniforms,
      ),
      paperWarm: createPaperPlasterMaterial(
        '#F8EFE2',
        0.88,
        {
          grainScale: 15.0,
          fiberStrength: 0.62,
          strataStrength: 0.12,
          bumpStrength: 0.018,
          roughnessJitter: 0.06,
          warmWrap: 0.058,
          edgeShade: 0.036,
          contactAO: 0.07,
        },
        uniforms,
      ),
      paperCream: createPaperPlasterMaterial(
        '#F2E4CE',
        0.9,
        {
          grainScale: 14.0,
          fiberStrength: 0.56,
          strataStrength: 0.18,
          bumpStrength: 0.02,
          roughnessJitter: 0.065,
          warmWrap: 0.05,
          edgeShade: 0.04,
          contactAO: 0.075,
        },
        uniforms,
      ),
      plasterSoft: createPaperPlasterMaterial(
        '#EBD9C5',
        0.91,
        {
          grainScale: 10.5,
          fiberStrength: 0.16,
          strataStrength: 0.58,
          bumpStrength: 0.024,
          roughnessJitter: 0.07,
          warmWrap: 0.044,
          edgeShade: 0.038,
          contactAO: 0.08,
        },
        uniforms,
      ),
      travertineBase: createPaperPlasterMaterial(
        '#E3D7C8',
        0.92,
        {
          grainScale: 8.5,
          fiberStrength: 0.08,
          strataStrength: 0.78,
          bumpStrength: 0.028,
          roughnessJitter: 0.07,
          warmWrap: 0.036,
          edgeShade: 0.045,
          contactAO: 0.09,
        },
        uniforms,
      ),
      travertineDeep: createPaperPlasterMaterial(
        '#C9BDAE',
        0.94,
        {
          grainScale: 9.0,
          fiberStrength: 0.07,
          strataStrength: 0.85,
          bumpStrength: 0.03,
          roughnessJitter: 0.075,
          warmWrap: 0.03,
          edgeShade: 0.05,
          contactAO: 0.1,
        },
        uniforms,
      ),
      vermilionSeal: createPaperPlasterMaterial(
        '#FF5A36',
        0.74,
        {
          grainScale: 18.0,
          fiberStrength: 0.3,
          strataStrength: 0.18,
          bumpStrength: 0.016,
          roughnessJitter: 0.06,
          warmWrap: 0.07,
          edgeShade: 0.05,
          contactAO: 0.06,
        },
        uniforms,
      ),
      marigoldSun: createPaperPlasterMaterial(
        '#F6B73C',
        0.76,
        {
          grainScale: 17.5,
          fiberStrength: 0.32,
          strataStrength: 0.16,
          bumpStrength: 0.016,
          roughnessJitter: 0.06,
          warmWrap: 0.068,
          edgeShade: 0.045,
          contactAO: 0.06,
        },
        uniforms,
      ),
      cobaltPin: createPaperPlasterMaterial(
        '#2F6BFF',
        0.75,
        {
          grainScale: 18.0,
          fiberStrength: 0.28,
          strataStrength: 0.2,
          bumpStrength: 0.016,
          roughnessJitter: 0.06,
          warmWrap: 0.05,
          edgeShade: 0.05,
          contactAO: 0.06,
        },
        uniforms,
      ),
      mintSage: createPaperPlasterMaterial(
        '#2AB38B',
        0.77,
        {
          grainScale: 17.0,
          fiberStrength: 0.3,
          strataStrength: 0.2,
          bumpStrength: 0.016,
          roughnessJitter: 0.06,
          warmWrap: 0.055,
          edgeShade: 0.048,
          contactAO: 0.06,
        },
        uniforms,
      ),
      charcoalRule: createPaperPlasterMaterial(
        '#222630',
        0.82,
        {
          grainScale: 20.0,
          fiberStrength: 0.22,
          strataStrength: 0.18,
          bumpStrength: 0.014,
          roughnessJitter: 0.05,
          warmWrap: 0.02,
          edgeShade: 0.03,
          contactAO: 0.05,
        },
        uniforms,
      ),
      sunlitWash: createSunlitWashMaterial(),
    }

    return { palette: built, sharedUniforms: uniforms }
  }, [])

  useEffect(() => {
    return () => {
      disposeMaterial([
        palette.paperBright,
        palette.paperWarm,
        palette.paperCream,
        palette.plasterSoft,
        palette.travertineBase,
        palette.travertineDeep,
        palette.vermilionSeal,
        palette.marigoldSun,
        palette.cobaltPin,
        palette.mintSage,
        palette.charcoalRule,
        palette.sunlitWash,
      ])
    }
  }, [palette])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const { reducedMotion } = useUiStore.getState()
    const pointerOffsetX = reducedMotion ? 0 : runtimeState.pointerNDC.x * 0.42
    const pointerOffsetY = reducedMotion ? 0 : runtimeState.pointerNDC.y * 0.24

    _sunVec
      .set(4.8 + pointerOffsetX, 7.6 + pointerOffsetY, 4.4)
      .normalize()
    sharedUniforms.uSunDirection.value.copy(_sunVec)

    const targetShift = reducedMotion ? 0 : runtimeState.pointerNDC.x * 0.55
    const currentShift = palette.sunlitWash.uniforms.uSunShift.value as number
    palette.sunlitWash.uniforms.uSunShift.value = reducedMotion
      ? 0
      : THREE.MathUtils.damp(currentShift, targetShift, 4.5, dt)
  })

  return (
    <AtelierMaterialContext.Provider value={palette}>
      {children}
    </AtelierMaterialContext.Provider>
  )
}

export function useAtelierMaterials(): AtelierMaterialPalette {
  const ctx = useContext(AtelierMaterialContext)
  if (!ctx) {
    throw new Error(
      'useAtelierMaterials must be used inside <AtelierMaterialProvider>',
    )
  }
  return ctx
}
