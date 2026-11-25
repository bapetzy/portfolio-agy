import { setTabVisibilityRuntime } from '../state/runtimeStore'
import { useUiStore, type QualityTier } from '../state/uiStore'

export function detectWebGLSupport(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false })
    if (!gl) return false

    // Release temporary test context immediately so we do not consume a GPU slot.
    const loseExt = gl.getExtension('WEBGL_lose_context')
    if (loseExt) {
      loseExt.loseContext()
    }
    return true
  } catch {
    return false
  }
}

export function detectInitialQualityTier(): QualityTier {
  if (!detectWebGLSupport()) return 'fallback'
  if (typeof navigator === 'undefined') return 'balanced'

  const cores = navigator.hardwareConcurrency ?? 8
  const deviceMemory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8

  if (cores <= 4 || deviceMemory <= 4) {
    return 'balanced'
  }
  return 'high'
}

export function getDprRange(tier: QualityTier): [number, number] {
  switch (tier) {
    case 'high':
      return [1, 1.75]
    case 'balanced':
      return [1, 1.25]
    case 'fallback':
      return [1, 1]
  }
}

export function initEnvironmentGuards(): () => void {
  const store = useUiStore.getState()
  store.setQualityTier(detectInitialQualityTier())

  const mediaQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null

  const syncReducedMotion = () => {
    useUiStore.getState().setReducedMotion(Boolean(mediaQuery?.matches))
  }
  syncReducedMotion()

  const syncVisibility = () => {
    const visible = typeof document !== 'undefined' ? !document.hidden : true
    setTabVisibilityRuntime(visible)
    useUiStore.getState().setTabVisible(visible)
  }
  syncVisibility()

  mediaQuery?.addEventListener('change', syncReducedMotion)
  document.addEventListener('visibilitychange', syncVisibility)

  return () => {
    mediaQuery?.removeEventListener('change', syncReducedMotion)
    document.removeEventListener('visibilitychange', syncVisibility)
  }
}
