# Portfolio_Agy — Atelier Kertas & Cahaya

Experimental 3D web portfolio built with **React 19**, **Three.js / React Three Fiber**, **custom GLSL shaders**, **Lenis**, and **Zustand**.

Designed around a bright sunlit studio metaphor: frameless editorial typography paired with floating sculptural islands arranged along an S-curve camera path.

## Highlights

- **Non-reactive 3D Runtime vs Discrete UI State:** High-frequency scroll (`cameraT`, `velocity`, `sectionProgress`) and pointer telemetry live in mutable `runtimeState` (`src/state/runtimeStore.ts`), while `useUiStore` (`src/state/uiStore.ts`) tracks only discrete UI changes (`activeSection`, `activeProjectId`, `hoveredProjectId`, `isProjectDetailOpen`), preserving zero extra DOM renders during intra-chapter scroll and pointer movement.
- **Zero-Allocation Second-Order Springs & Loops:** Custom spring integrator (`src/lib/spring.ts`) and module-scope Three.js scratch vectors ensure `0` `new THREE.*` allocations inside `useFrame`.
- **Custom GLSL Shaders & Disposal Discipline:**
  - `src/shaders/paperPlasterShader.ts`: `onBeforeCompile` paper fiber weave, mineral strata grain, normal perturbation, warm wrap diffuse band, and anti-banding dither sharing one compiled program cache key.
  - `src/shaders/sunlitWashShader.ts`: Feathered radial sunlit ground halos under each floating island.
  - Explicit geometry, material, texture, and shadow map cleanup via `src/lib/dispose.ts`.
- **Resilience & Accessibility:** Keyboard tablist navigation (`ArrowLeft`/`ArrowRight`, `Escape`, `Enter`), skip link, `prefers-reduced-motion` support (`frameloop="demand"` + motion locks), tab-visibility pause (`frameloop="never"`), and `webglcontextlost` recovery to a 2D editorial fallback (`FallbackView.tsx`).

## Curated Works Showcased

1. **Salt & Ember** — Zero-allocation cellular automata weather jar (`172 x 230` grid, 30 materials, 25 phenomena)
2. **Queuecraft** — Deterministic discrete-event job queue simulator with ghost comparison
3. **Kamar Gelap** — Scroll-choreographed 35mm darkroom WebGL photo essay
4. **The Atlas of Unfinished Places** — Generative cartography across four conflicting survey editions (`1871-1962`)

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```
