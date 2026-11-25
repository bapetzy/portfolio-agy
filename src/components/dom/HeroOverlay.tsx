import { PORTFOLIO_CONTENT } from '../../content/portfolio'
import { trackDomRender } from '../../lib/devProbe'
import type { SectionId } from '../../state/runtimeStore'

interface HeroOverlayProps {
  onNavigate: (section: SectionId) => void
}

export function HeroOverlay({ onNavigate }: HeroOverlayProps) {
  trackDomRender('hero')
  const { intro } = PORTFOLIO_CONTENT

  return (
    <section
      id="intro"
      data-section="intro"
      aria-labelledby="intro-heading"
      className="chapter-section chapter-hero"
    >
      <div className="chapter-flow">
        <p className="chapter-kicker">{intro.kicker}</p>
        <h1 id="intro-heading" className="hero-title">
          {intro.titleLead}{' '}
          <span className="hero-title-accent">{intro.titleAccent}</span>{' '}
          {intro.titleTail}
        </h1>
        <p className="lead-copy">{intro.lead}</p>

        <ul className="studio-meta-strip" aria-label="Karakteristik atelier">
          {intro.studioMeta.map((item, idx) => (
            <li key={item} className="studio-meta-item" data-index={idx}>
              {item}
            </li>
          ))}
        </ul>

        <div className="hero-actions chapter-body">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate('works')}
          >
            <span>{intro.ctaLabel}</span>
            <span className="btn-arrow" aria-hidden="true">
              →
            </span>
          </button>
          <span className="scroll-cue" aria-hidden="true">
            Scroll untuk menelusuri ruang
          </span>
        </div>
      </div>
      <div className="stage-lane-spacer" aria-hidden="true" />
    </section>
  )
}
