export interface SpringState {
  value: number
  velocity: number
}

export function createSpring(initial = 0): SpringState {
  return { value: initial, velocity: 0 }
}

export function snapSpring(state: SpringState, value: number): number {
  state.value = value
  state.velocity = 0
  return value
}

/**
 * Semi-implicit Euler second-order spring integration in-place (zero allocations).
 */
export function stepSpring(
  state: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
): number {
  const safeDt = Math.min(Math.max(dt, 0.0001), 0.05)
  const accel = (target - state.value) * stiffness - state.velocity * damping
  state.velocity += accel * safeDt
  state.value += state.velocity * safeDt
  return state.value
}
