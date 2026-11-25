import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react'
import { PORTFOLIO_CONTENT } from '../../content/portfolio'
import { trackDomRender } from '../../lib/devProbe'
import { useUiStore } from '../../state/uiStore'

export function WorksOverlay() {
  trackDomRender('works')

  const activeProjectId = useUiStore((s) => s.activeProjectId)
  const hoveredProjectId = useUiStore((s) => s.hoveredProjectId)
  const isProjectDetailOpen = useUiStore((s) => s.isProjectDetailOpen)
  const activeSection = useUiStore((s) => s.activeSection)
  const qualityTier = useUiStore((s) => s.qualityTier)
  const contextLost = useUiStore((s) => s.contextLost)

  const selectProject = useUiStore((s) => s.selectProject)
  const setHoveredProjectId = useUiStore((s) => s.setHoveredProjectId)
  const setProjectDetailOpen = useUiStore((s) => s.setProjectDetailOpen)
  const resetProjectFocus = useUiStore((s) => s.resetProjectFocus)

  const sectionRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const { works } = PORTFOLIO_CONTENT
  const activeIndex = Math.max(
    0,
    works.items.findIndex((item) => item.id === activeProjectId),
  )
  const activeProject = works.items[activeIndex] ?? works.items[0]
  const isFallbackMode = qualityTier === 'fallback' || contextLost

  const handleCloseDetail = useCallback(() => {
    const activeEl = document.activeElement
    const wasInsideSection = Boolean(
      activeEl && sectionRef.current?.contains(activeEl),
    )
    resetProjectFocus()
    if (wasInsideSection) {
      requestAnimationFrame(() => {
        tabRefs.current[activeIndex]?.focus()
      })
    }
  }, [activeIndex, resetProjectFocus])

  useEffect(() => {
    if (!isProjectDetailOpen) return

    const onWindowKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const focusedInsideWorks = Boolean(
        document.activeElement &&
          sectionRef.current?.contains(document.activeElement),
      )
      if (focusedInsideWorks || activeSection === 'works') {
        handleCloseDetail()
      }
    }

    window.addEventListener('keydown', onWindowKeyDown)
    return () => {
      window.removeEventListener('keydown', onWindowKeyDown)
    }
  }, [activeSection, handleCloseDetail, isProjectDetailOpen])

  const handleTabKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const total = works.items.length
    let nextIndex: number | null = null

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % total
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + total) % total
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = total - 1
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectProject(works.items[index].id)
      return
    }

    if (nextIndex !== null) {
      e.preventDefault()
      const nextProject = works.items[nextIndex]
      selectProject(nextProject.id)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <section
      ref={sectionRef}
      id="works"
      data-section="works"
      aria-labelledby="works-heading"
      className="chapter-section chapter-works"
    >
      <div className="chapter-flow">
        <p className="chapter-kicker">{works.kicker}</p>
        <h2 id="works-heading" className="section-title">
          {works.title}
        </h2>
        <p className="lead-copy">{works.lead}</p>

        <div className="works-layout chapter-body">
          <div className="works-hint-row">
            <span>
              {isFallbackMode ? works.interactionHint2D : works.interactionHint3D}
            </span>
            <span>{works.keyboardHint}</span>
          </div>

          <div
            className="works-list"
            role="tablist"
            aria-label="Daftar karya terkurasi"
          >
            {works.items.map((project, index) => {
              const isSelected = project.id === activeProject.id
              const isHovered = hoveredProjectId === project.id
              return (
                <button
                  key={project.id}
                  ref={(el) => {
                    tabRefs.current[index] = el
                  }}
                  id={`work-tab-${project.id}`}
                  type="button"
                  role="tab"
                  data-accent={project.accent}
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                  aria-controls={`work-panel-${project.id}`}
                  className={`work-card-btn${isSelected ? ' is-active' : ''}${
                    isHovered && !isSelected ? ' is-hovered' : ''
                  }`}
                  onClick={() => selectProject(project.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  onMouseEnter={() => setHoveredProjectId(project.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  onFocus={() => setHoveredProjectId(project.id)}
                  onBlur={() => setHoveredProjectId(null)}
                >
                  <span className="work-card-top">
                    <span className="work-card-index">
                      <span
                        className="accent-swatch"
                        data-accent={project.accent}
                        aria-hidden="true"
                      />
                      <span>{project.index}</span>
                    </span>
                    {isHovered ? (
                      <span className="work-card-badge-3d">3D</span>
                    ) : null}
                  </span>
                  <span className="work-card-title">{project.title}</span>
                  <span className="work-card-role">{project.category}</span>
                </button>
              )
            })}
          </div>

          {isProjectDetailOpen ? (
            <article
              key={activeProject.id}
              id={`work-panel-${activeProject.id}`}
              data-accent={activeProject.accent}
              className="work-detail"
              role="tabpanel"
              aria-labelledby={`work-tab-${activeProject.id}`}
            >
              <div className="work-detail-toolbar">
                <span className="work-status-pill">
                  {activeProject.year} · {activeProject.status}
                </span>
                <button
                  type="button"
                  className="work-close-btn"
                  onClick={handleCloseDetail}
                  aria-label={`Tutup detail ${activeProject.title}`}
                >
                  Tutup · Esc
                </button>
              </div>

              <div className="work-detail-header">
                <h3 className="work-detail-title">{activeProject.title}</h3>
                <span className="work-detail-meta">{activeProject.role}</span>
              </div>

              <p className="work-detail-summary">{activeProject.summary}</p>
              <p className="work-detail-narrative">{activeProject.narrative}</p>

              <ul
                className="work-arch-list"
                aria-label={`Poin arsitektur ${activeProject.title}`}
              >
                {activeProject.architecturePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <p className="work-detail-block">
                <strong>Verifikasi &amp; Kualitas:</strong>{' '}
                {activeProject.engineeringHighlight}
              </p>

              <p className="work-detail-block">
                <strong>Maket 3D:</strong> {activeProject.maquetteIdea}
              </p>

              <div className="work-detail-footer">
                <ul className="tag-row" aria-label="Tech stack">
                  {activeProject.stack.map((tech) => (
                    <li key={tech} className="tag-chip">
                      {tech}
                    </li>
                  ))}
                </ul>
                <span className="work-detail-meta">
                  {activeProject.sourceLabel}
                </span>
              </div>
            </article>
          ) : (
            <div className="work-collapsed-bar">
              <div>
                <div className="work-detail-meta">
                  Dossier terlipat · Fokus maket 3D aktif
                </div>
                <div className="work-card-title">
                  {activeProject.index}. {activeProject.title}
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProjectDetailOpen(true)}
              >
                Buka Dossier
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="stage-lane-spacer" aria-hidden="true" />
    </section>
  )
}
