import { PORTFOLIO_CONTENT } from '../../content/portfolio'
import { trackDomRender } from '../../lib/devProbe'
import type { SectionId } from '../../state/runtimeStore'
import { useUiStore } from '../../state/uiStore'

interface NavigationProps {
  onNavigate: (section: SectionId) => void
}

const NAV_ITEMS: readonly { id: SectionId; index: string; label: string }[] = [
  { id: 'intro', index: '01', label: 'Intro' },
  { id: 'works', index: '02', label: 'Karya' },
  { id: 'profile', index: '03', label: 'Profil' },
  { id: 'contact', index: '04', label: 'Kontak' },
]

export function Navigation({ onNavigate }: NavigationProps) {
  trackDomRender('navigation')

  const activeSection = useUiStore((s) => s.activeSection)
  const qualityTier = useUiStore((s) => s.qualityTier)
  const isSceneReady = useUiStore((s) => s.isSceneReady)
  const reducedMotion = useUiStore((s) => s.reducedMotion)

  return (
    <>
      <header className="top-nav">
        <div className="nav-brand">
          <span className="nav-brand-dot" aria-hidden="true" />
          <span className="nav-brand-title">
            {PORTFOLIO_CONTENT.brand.atelierTitle}
          </span>
          <span className="nav-brand-tag">{PORTFOLIO_CONTENT.brand.name}</span>
        </div>

        <nav aria-label="Navigasi bab portofolio">
          <ul className="nav-links">
            {NAV_ITEMS.map((item) => {
              const isCurrent = activeSection === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="nav-btn"
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={() => onNavigate(item.id)}
                  >
                    <span className="nav-index">{item.index}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="nav-status" aria-live="polite">
          <span className={`status-dot${isSceneReady ? ' is-ready' : ''}`} />
          <span>
            {qualityTier}
            {reducedMotion ? ' · reduced' : ''}
          </span>
        </div>
      </header>

      <aside className="chapter-rail" aria-label="Indikator posisi bab">
        {NAV_ITEMS.map((item) => {
          const isCurrent = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`chapter-rail-dot${isCurrent ? ' is-current' : ''}`}
              aria-label={`Lompat ke ${item.index} ${item.label}`}
              aria-current={isCurrent ? 'true' : undefined}
              onClick={() => onNavigate(item.id)}
            />
          )
        })}
      </aside>
    </>
  )
}
