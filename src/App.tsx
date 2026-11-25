import { useCallback, useEffect, useRef } from 'react'
import { ContactSection } from './components/dom/ContactSection'
import { HeroOverlay } from './components/dom/HeroOverlay'
import { Navigation } from './components/dom/Navigation'
import { ProfileSection } from './components/dom/ProfileSection'
import { WorksOverlay } from './components/dom/WorksOverlay'
import { registerM1Probe } from './lib/devProbe'
import { initEnvironmentGuards } from './lib/perfBudget'
import { createScrollEngine, type ScrollController } from './lib/scrollEngine'
import { CanvasShell } from './scene/CanvasShell'
import type { SectionId } from './state/runtimeStore'

export function App() {
  const scrollCtrlRef = useRef<ScrollController | null>(null)

  useEffect(() => {
    const cleanupEnv = initEnvironmentGuards()
    const scrollCtrl = createScrollEngine()
    scrollCtrlRef.current = scrollCtrl
    const cleanupProbe = registerM1Probe()

    return () => {
      cleanupProbe()
      scrollCtrl.destroy()
      scrollCtrlRef.current = null
      cleanupEnv()
    }
  }, [])

  const handleNavigate = useCallback((section: SectionId) => {
    scrollCtrlRef.current?.scrollToSection(section)
  }, [])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <CanvasShell />
      <Navigation onNavigate={handleNavigate} />
      <main id="main-content" className="editorial-main">
        <HeroOverlay onNavigate={handleNavigate} />
        <WorksOverlay />
        <ProfileSection />
        <ContactSection onNavigate={handleNavigate} />
      </main>
    </>
  )
}

export default App
