import { PORTFOLIO_CONTENT } from '../../content/portfolio'
import { trackDomRender } from '../../lib/devProbe'
import type { SectionId } from '../../state/runtimeStore'

interface ContactSectionProps {
  onNavigate: (section: SectionId) => void
}

export function ContactSection({ onNavigate }: ContactSectionProps) {
  trackDomRender('contact')
  const { contact } = PORTFOLIO_CONTENT

  return (
    <section
      id="contact"
      data-section="contact"
      aria-labelledby="contact-heading"
      className="chapter-section chapter-contact"
    >
      <div className="chapter-flow">
        <p className="chapter-kicker">{contact.kicker}</p>
        <h2 id="contact-heading" className="section-title">
          {contact.title}
        </h2>
        <p className="lead-copy">{contact.lead}</p>

        <div className="contact-flow chapter-body">
          <div className="contact-email-wrap">
            <span className="work-detail-meta">Email Korespondensi</span>
            <a
              className="contact-email-link"
              href={`mailto:${contact.email}`}
            >
              {contact.email}
            </a>
          </div>

          <div className="contact-actions">
            <a
              className="btn-primary"
              href={`mailto:${contact.email}`}
            >
              <span>Kirim Email</span>
              <span className="btn-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <a
              className="btn-secondary"
              href={contact.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub Archive
            </a>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onNavigate('intro')}
            >
              Kembali ke Atas ↑
            </button>
          </div>
        </div>
      </div>
      <div className="stage-lane-spacer" aria-hidden="true" />
    </section>
  )
}
