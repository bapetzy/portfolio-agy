import { create } from 'zustand'
import type { SectionId } from './runtimeStore'

export type QualityTier = 'high' | 'balanced' | 'fallback'

export interface UiState {
  activeSection: SectionId
  activeProjectId: string
  hoveredProjectId: string | null
  isProjectDetailOpen: boolean
  qualityTier: QualityTier
  reducedMotion: boolean
  isSceneReady: boolean
  contextLost: boolean
  isTabVisible: boolean

  setActiveSection: (section: SectionId) => void
  setActiveProjectId: (projectId: string) => void
  setHoveredProjectId: (projectId: string | null) => void
  setProjectDetailOpen: (open: boolean) => void
  selectProject: (projectId: string) => void
  resetProjectFocus: () => void
  setQualityTier: (tier: QualityTier) => void
  setReducedMotion: (reduced: boolean) => void
  setSceneReady: (ready: boolean) => void
  setContextLost: (lost: boolean) => void
  setTabVisible: (visible: boolean) => void
}

const initialReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useUiStore = create<UiState>((set, get) => ({
  activeSection: 'intro',
  activeProjectId: 'salt-and-ember',
  hoveredProjectId: null,
  isProjectDetailOpen: true,
  qualityTier: 'high',
  reducedMotion: initialReducedMotion,
  isSceneReady: false,
  contextLost: false,
  isTabVisible: true,

  setActiveSection: (activeSection) => {
    if (get().activeSection === activeSection) return
    set({ activeSection })
  },
  setActiveProjectId: (activeProjectId) => {
    if (get().activeProjectId === activeProjectId) return
    set({ activeProjectId })
  },
  setHoveredProjectId: (hoveredProjectId) => {
    if (get().hoveredProjectId === hoveredProjectId) return
    set({ hoveredProjectId })
  },
  setProjectDetailOpen: (isProjectDetailOpen) => {
    if (get().isProjectDetailOpen === isProjectDetailOpen) return
    set({ isProjectDetailOpen })
  },
  selectProject: (activeProjectId) => {
    const state = get()
    if (state.activeProjectId === activeProjectId && state.isProjectDetailOpen) {
      return
    }
    set({ activeProjectId, isProjectDetailOpen: true })
  },
  resetProjectFocus: () => {
    const state = get()
    if (state.hoveredProjectId === null && !state.isProjectDetailOpen) {
      return
    }
    set({ hoveredProjectId: null, isProjectDetailOpen: false })
  },
  setQualityTier: (qualityTier) => {
    if (get().qualityTier === qualityTier) return
    set({ qualityTier })
  },
  setReducedMotion: (reducedMotion) => {
    if (get().reducedMotion === reducedMotion) return
    set({ reducedMotion })
  },
  setSceneReady: (isSceneReady) => {
    if (get().isSceneReady === isSceneReady) return
    set({ isSceneReady })
  },
  setContextLost: (contextLost) => {
    if (get().contextLost === contextLost) return
    set({ contextLost })
  },
  setTabVisible: (isTabVisible) => {
    if (get().isTabVisible === isTabVisible) return
    set({ isTabVisible })
  },
}))
