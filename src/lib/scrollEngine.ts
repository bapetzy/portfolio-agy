import Lenis from 'lenis'
import { invalidate as invalidateR3F } from '@react-three/fiber'
import {
  SECTION_ORDER,
  requestRenderFrame,
  runtimeState,
  updatePointerRuntime,
  updateScrollRuntime,
  type SectionId,
} from '../state/runtimeStore'
import { useUiStore } from '../state/uiStore'

interface SectionMetric {
  id: SectionId
  top: number
  height: number
}

export interface ScrollController {
  scrollToSection: (id: SectionId) => void
  refreshMetrics: () => void
  destroy: () => void
}

function clamp01(value: number): number {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function smoothstep01(t: number): number {
  const c = clamp01(t)
  return c * c * (3 - 2 * c)
}

function paceSegment(
  value: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
): number {
  const span = Math.max(0.0001, inEnd - inStart)
  const local = clamp01((value - inStart) / span)
  const eased = 0.58 * local + 0.42 * smoothstep01(local)
  return outStart + (outEnd - outStart) * eased
}

/**
 * Maps linear scrollProgress (0..1) into piecewise camera spline progress,
 * giving Works a calm dwell window while keeping transitions lively and continuous.
 */
export function computePiecewiseCameraT(scrollProgress: number): number {
  const s = clamp01(scrollProgress)
  if (s <= 0.23) {
    return paceSegment(s, 0.0, 0.23, 0.0, 0.24)
  }
  if (s <= 0.6) {
    return paceSegment(s, 0.23, 0.6, 0.24, 0.58)
  }
  if (s <= 0.82) {
    return paceSegment(s, 0.6, 0.82, 0.58, 0.81)
  }
  return paceSegment(s, 0.82, 1.0, 0.81, 1.0)
}

export function createScrollEngine(): ScrollController {
  let lenis: Lenis | null = null
  let rafId: number | null = null
  let destroyed = false
  let lastScrollY = window.scrollY
  let lastTimestamp = performance.now()
  let sectionMetrics: SectionMetric[] = []
  let maxScroll = 1
  let lastActiveSection: SectionId | null = 'intro'

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.activeSection = 'intro'
  }

  const computeMetrics = () => {
    const scrollY = window.scrollY
    const docHeight = document.documentElement.scrollHeight
    const viewportH = window.innerHeight || 1
    maxScroll = Math.max(1, docHeight - viewportH)

    sectionMetrics = SECTION_ORDER.map((id) => {
      const el = document.querySelector<HTMLElement>(`[data-section="${id}"]`)
      if (!el) {
        return { id, top: 0, height: viewportH }
      }
      const rect = el.getBoundingClientRect()
      return {
        id,
        top: rect.top + scrollY,
        height: Math.max(1, rect.height),
      }
    })
  }

  const sampleScroll = (scrollY: number, velocity: number) => {
    if (destroyed) return
    const globalProgress = clamp01(scrollY / maxScroll)
    const cameraT = computePiecewiseCameraT(globalProgress)
    const viewportMid = scrollY + (window.innerHeight || 1) * 0.44

    let activeIndex = 0
    for (let i = 0; i < sectionMetrics.length; i++) {
      const metric = sectionMetrics[i]
      if (viewportMid >= metric.top) {
        activeIndex = i
      }
    }
    if (globalProgress >= 0.93) {
      activeIndex = SECTION_ORDER.length - 1
    }

    const activeMetric = sectionMetrics[activeIndex]
    const localT = activeMetric
      ? clamp01((viewportMid - activeMetric.top) / activeMetric.height)
      : 0

    const p0 = sectionMetrics[0]
      ? clamp01((viewportMid - sectionMetrics[0].top) / sectionMetrics[0].height)
      : 0
    const p1 = sectionMetrics[1]
      ? clamp01((viewportMid - sectionMetrics[1].top) / sectionMetrics[1].height)
      : 0
    const p2 = sectionMetrics[2]
      ? clamp01((viewportMid - sectionMetrics[2].top) / sectionMetrics[2].height)
      : 0
    const p3 = sectionMetrics[3]
      ? clamp01((viewportMid - sectionMetrics[3].top) / sectionMetrics[3].height)
      : 0

    updateScrollRuntime(
      globalProgress,
      velocity,
      activeIndex,
      localT,
      p0,
      p1,
      p2,
      p3,
      cameraT,
    )

    const nextSection = SECTION_ORDER[activeIndex] ?? 'intro'
    if (nextSection !== lastActiveSection) {
      lastActiveSection = nextSection
      document.documentElement.dataset.activeSection = nextSection
    }

    const ui = useUiStore.getState()
    ui.setActiveSection(nextSection)

    if (ui.reducedMotion) {
      requestRenderFrame()
      invalidateR3F()
    }
  }

  const stopRaf = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  const tick = (time: number) => {
    if (destroyed || !runtimeState.isTabVisible || !lenis) {
      rafId = null
      return
    }
    lenis.raf(time)
    rafId = requestAnimationFrame(tick)
  }

  const startRaf = () => {
    if (destroyed || !lenis || !runtimeState.isTabVisible || rafId !== null) {
      return
    }
    rafId = requestAnimationFrame(tick)
  }

  const onNativeScroll = () => {
    if (lenis) return
    const now = performance.now()
    const dt = Math.max(16, now - lastTimestamp)
    const currentY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    const velocity = (currentY - lastScrollY) / dt
    lastScrollY = currentY
    lastTimestamp = now
    sampleScroll(currentY, velocity)
  }

  const mountLenis = () => {
    if (lenis) return
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    })
    lenis.on('scroll', (instance) => {
      sampleScroll(instance.scroll, instance.velocity)
    })
    startRaf()
  }

  const unmountLenis = () => {
    stopRaf()
    if (lenis) {
      lenis.destroy()
      lenis = null
    }
  }

  const syncScrollMode = () => {
    const { reducedMotion } = useUiStore.getState()
    if (reducedMotion) {
      unmountLenis()
    } else {
      mountLenis()
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (destroyed) return
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    const ndcX = (e.clientX / w) * 2 - 1
    const ndcY = -((e.clientY / h) * 2 - 1)
    updatePointerRuntime(ndcX, ndcY, true)
  }

  const onPointerLeave = () => {
    updatePointerRuntime(0, 0, false)
  }

  const onResize = () => {
    computeMetrics()
    sampleScroll(window.scrollY, 0)
  }

  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          computeMetrics()
        })
      : null

  computeMetrics()
  if (resizeObserver) {
    resizeObserver.observe(document.documentElement)
  }

  syncScrollMode()
  sampleScroll(window.scrollY, 0)

  window.addEventListener('scroll', onNativeScroll, { passive: true })
  document.addEventListener('scroll', onNativeScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave, { passive: true })

  const unsubUi = useUiStore.subscribe((state, prevState) => {
    if (state.reducedMotion !== prevState.reducedMotion) {
      syncScrollMode()
      requestRenderFrame()
    }
    if (state.isTabVisible !== prevState.isTabVisible) {
      if (state.isTabVisible) {
        startRaf()
      } else {
        stopRaf()
      }
    }
  })

  return {
    scrollToSection: (id) => {
      computeMetrics()
      const target = document.querySelector<HTMLElement>(`[data-section="${id}"]`)
      if (!target) return
      const { reducedMotion } = useUiStore.getState()
      if (lenis && !reducedMotion) {
        const navOffset = window.innerWidth <= 720 ? -96 : 0
        lenis.scrollTo(target, { duration: 0.95, offset: navOffset })
      } else {
        target.scrollIntoView({ behavior: 'auto', block: 'start' })
      }
    },
    refreshMetrics: () => {
      computeMetrics()
      sampleScroll(window.scrollY, 0)
    },
    destroy: () => {
      destroyed = true
      unsubUi()
      unmountLenis()
      resizeObserver?.disconnect()
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.activeSection
      }
      window.removeEventListener('scroll', onNativeScroll)
      document.removeEventListener('scroll', onNativeScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
    },
  }
}
