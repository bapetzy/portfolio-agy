import { runtimeState, type RuntimeState } from '../state/runtimeStore'
import { useUiStore, type UiState } from '../state/uiStore'

export interface DomRenderCounts {
  navigation: number
  hero: number
  works: number
  profile: number
  contact: number
}

export interface RendererInfoSnapshot {
  calls: number
  triangles: number
  geometries: number
  textures: number
  programs: number
}

export interface ScreenPoint2D {
  x: number
  y: number
}

export interface PortfolioM1Probe {
  getRuntimeState: () => RuntimeState
  getUiState: () => Pick<
    UiState,
    | 'activeSection'
    | 'activeProjectId'
    | 'hoveredProjectId'
    | 'isProjectDetailOpen'
    | 'qualityTier'
    | 'reducedMotion'
    | 'isSceneReady'
    | 'contextLost'
    | 'isTabVisible'
  >
  getDomRenderCounts: () => DomRenderCounts
  getRendererInfo: () => RendererInfoSnapshot | null
  getWorksScreenPoints: () => Record<string, ScreenPoint2D> | null
}

const renderCounts: DomRenderCounts = {
  navigation: 0,
  hero: 0,
  works: 0,
  profile: 0,
  contact: 0,
}

let rendererInfoGetter: (() => RendererInfoSnapshot | null) | null = null
let worksScreenPointsGetter:
  | (() => Record<string, ScreenPoint2D> | null)
  | null = null

export function trackDomRender(key: keyof DomRenderCounts): void {
  if (import.meta.env.DEV) {
    renderCounts[key] += 1
  }
}

export function registerRendererInfoSource(
  getter: (() => RendererInfoSnapshot | null) | null,
): void {
  if (import.meta.env.DEV) {
    rendererInfoGetter = getter
  }
}

export function registerWorksScreenPointsSource(
  getter: (() => Record<string, ScreenPoint2D> | null) | null,
): void {
  if (import.meta.env.DEV) {
    worksScreenPointsGetter = getter
  }
}

export function registerM1Probe(): () => void {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return () => {}
  }

  const probe: PortfolioM1Probe = {
    getRuntimeState: () => runtimeState,
    getUiState: () => {
      const s = useUiStore.getState()
      return {
        activeSection: s.activeSection,
        activeProjectId: s.activeProjectId,
        hoveredProjectId: s.hoveredProjectId,
        isProjectDetailOpen: s.isProjectDetailOpen,
        qualityTier: s.qualityTier,
        reducedMotion: s.reducedMotion,
        isSceneReady: s.isSceneReady,
        contextLost: s.contextLost,
        isTabVisible: s.isTabVisible,
      }
    },
    getDomRenderCounts: () => ({ ...renderCounts }),
    getRendererInfo: () => rendererInfoGetter?.() ?? null,
    getWorksScreenPoints: () => worksScreenPointsGetter?.() ?? null,
  }

  ;(
    window as Window & { __PORTFOLIO_M1_PROBE__?: PortfolioM1Probe }
  ).__PORTFOLIO_M1_PROBE__ = probe

  return () => {
    delete (window as Window & { __PORTFOLIO_M1_PROBE__?: PortfolioM1Probe })
      .__PORTFOLIO_M1_PROBE__
  }
}
