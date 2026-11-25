export type SectionId = 'intro' | 'works' | 'profile' | 'contact'

export const SECTION_ORDER: readonly SectionId[] = [
  'intro',
  'works',
  'profile',
  'contact',
] as const

export interface PointerNDC {
  x: number
  y: number
}

export interface Vec3Telemetry {
  x: number
  y: number
  z: number
}

export interface RuntimeState {
  scrollProgress: number
  cameraT: number
  velocity: number
  sectionIndex: number
  sectionT: number
  sectionProgress: [number, number, number, number]
  pointerNDC: PointerNDC
  pointerActive: boolean
  isTabVisible: boolean
  frameCount: number
  cameraPos: Vec3Telemetry
  cameraTarget: Vec3Telemetry
}

/**
 * Mutable non-reactive runtime state read directly inside R3F's useFrame().
 * Never store high-frequency scroll or pointer values in React state.
 */
export const runtimeState: RuntimeState = {
  scrollProgress: 0,
  cameraT: 0,
  velocity: 0,
  sectionIndex: 0,
  sectionT: 0,
  sectionProgress: [0, 0, 0, 0],
  pointerNDC: { x: 0, y: 0 },
  pointerActive: false,
  isTabVisible: true,
  frameCount: 0,
  cameraPos: { x: 0.1, y: 2.25, z: 5.4 },
  cameraTarget: { x: 0.05, y: 0.85, z: 0 },
}

let frameInvalidator: (() => void) | null = null

export function registerFrameInvalidator(fn: (() => void) | null): void {
  frameInvalidator = fn
}

export function requestRenderFrame(): void {
  frameInvalidator?.()
}

export function updateScrollRuntime(
  scrollProgress: number,
  velocity: number,
  sectionIndex: number,
  sectionT: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  cameraT: number,
): void {
  runtimeState.scrollProgress = scrollProgress
  runtimeState.cameraT = cameraT
  runtimeState.velocity = velocity
  runtimeState.sectionIndex = sectionIndex
  runtimeState.sectionT = sectionT
  runtimeState.sectionProgress[0] = p0
  runtimeState.sectionProgress[1] = p1
  runtimeState.sectionProgress[2] = p2
  runtimeState.sectionProgress[3] = p3
}

export function updatePointerRuntime(
  x: number,
  y: number,
  active: boolean,
): void {
  runtimeState.pointerNDC.x = x
  runtimeState.pointerNDC.y = y
  runtimeState.pointerActive = active
}

export function setTabVisibilityRuntime(visible: boolean): void {
  runtimeState.isTabVisible = visible
}

export function updateCameraTelemetry(
  px: number,
  py: number,
  pz: number,
  tx: number,
  ty: number,
  tz: number,
): void {
  runtimeState.cameraPos.x = px
  runtimeState.cameraPos.y = py
  runtimeState.cameraPos.z = pz
  runtimeState.cameraTarget.x = tx
  runtimeState.cameraTarget.y = ty
  runtimeState.cameraTarget.z = tz
}
