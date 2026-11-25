import { PORTFOLIO_CONTENT } from '../../content/portfolio'
import { trackDomRender } from '../../lib/devProbe'

export function ProfileSection() {
  trackDomRender('profile')
  const { profile } = PORTFOLIO_CONTENT

  return (
    <section
      id="profile"
      data-section="profile"
      aria-labelledby="profile-heading"
      className="chapter-section chapter-profile"
    >
      <div className="chapter-flow">
        <p className="chapter-kicker">{profile.kicker}</p>
        <h2 id="profile-heading" className="section-title">
          {profile.title}
        </h2>
        <p className="lead-copy">{profile.lead}</p>

        <div className="pillars-grid chapter-body">
          {profile.pillars.map((pillar, idx) => (
            <article key={pillar.id} className="pillar-row">
              <div className="pillar-header">
                <span
                  className="accent-swatch"
                  data-accent={pillar.accent}
                  aria-hidden="true"
                />
                <span className="pillar-index">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="pillar-title">{pillar.title}</h3>
              </div>
              <p className="pillar-desc">{pillar.description}</p>
              <ul className="tag-row" aria-label={`Kemampuan ${pillar.title}`}>
                {pillar.tools.map((tool) => (
                  <li key={tool} className="tag-chip">
                    {tool}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
      <div className="stage-lane-spacer" aria-hidden="true" />
    </section>
  )
}
