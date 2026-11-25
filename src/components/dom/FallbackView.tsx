import { useUiStore } from '../../state/uiStore'

export function FallbackView() {
  const qualityTier = useUiStore((s) => s.qualityTier)
  const contextLost = useUiStore((s) => s.contextLost)
  const setContextLost = useUiStore((s) => s.setContextLost)

  const badgeText = contextLost
    ? 'WebGL context paused — fallback 2D aktif'
    : qualityTier === 'fallback'
      ? 'Mode 2D editorial aktif (tanpa WebGL)'
      : 'Sunlit Studio Canvas'

  return (
    <>
      <div className="fallback-stage" aria-hidden="true" />
      <div className="fallback-badge" role="status" aria-live="polite">
        <span>{badgeText}</span>
        {contextLost ? (
          <button
            type="button"
            className="fallback-recover-btn"
            onClick={() => setContextLost(false)}
          >
            Muat Ulang Panggung 3D
          </button>
        ) : null}
      </div>
    </>
  )
}
