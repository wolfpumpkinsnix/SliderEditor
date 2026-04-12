## Commands

```bash
bun run dev       # Start Vite dev server
bun run build     # Type-check (tsc) then bundle (vite build)
bun run preview   # Preview production build
```

No test runner. `tsc` (via `build`) is the primary static check.

## Architecture

Browser-only slide editor: Vite + TypeScript + Tailwind CSS v4. UI = native Web Components. State = `@preact/signals-core`.

### State (`src/state/`)

- **`signalsStore.ts`** — single source of truth. Exports signals (`presentation`, `currentSlideIndex`, `selectedElementId`, `mode`) and action functions. Also exports `findElement(slide, id)` utility. Use this directly in new code.
- **`store.ts`** — thin backward-compat wrapper; delegates to `signalsStore.ts`.

Persistence: `localStorage` via `src/services/storage.ts` (key `slide-editor-presentation`).

### Components (`src/components/`)

Each component = folder with `.ts` + `.html?raw` template.

All components extend **`EffectComponent`** (`src/lib/effect_component.ts`), which provides:
- `render()` — clones static template into element
- `get<T>(id)` — `querySelector('#id')`
- `getTemplate(id)` — `querySelector('#id')` for `<template>` elements
- `addEffect(fn)` — registers a signal effect, auto-disposed on disconnect
- `disconnectedCallback()` — disposes all effects

`@Component` decorator (`src/lib/decorators.ts`) registers the custom element and parses the HTML template once.

Property panel sub-components extend `BasePropertyElement extends EffectComponent`.

**Component tree:**
- `<app-shell>` — root layout
- `<editor-toolbar>` — title, add-element menu, present/export buttons
- `<slide-panel>` — slide list sidebar with `<slide-thumbnail>` children
- `<slide-canvas>` — center canvas; hosts `<slide-renderer>`, handles selection and inline text edit
- `<property-panel>` — right sidebar; routes to type-specific sub-component
- `<slide-renderer>` — pure renderer used in editor and presentation; setters: `slide`, `theme`, `isActive`, `editMode`
- `<presentation-mode>` — fullscreen overlay

### Data model (`src/models/types.ts`)

`Presentation → Slide[] → SlideElement[]`. Element types: `label`, `heading`, `text`, `list`, `grid`, `card`, `emoji`. `GridElement` nests `CardElement[]`. Slides are 1920×1080, scaled with `transform: scale()`.

### Styling

- `src/styles/editor.css` — editor layout
- `src/styles/properties.css` — property panel forms
- `src/styles/presentation.css`, `src/app.css` — presentation and global resets
- Tailwind v4 in templates; plain CSS for editor layout

### TypeScript notes

- `.ts` extensions required in imports (`allowImportingTsExtensions`)
- Decorators use `experimentalDecorators` (`erasableSyntaxOnly`)
- `noEmit: true` — Vite compiles; `tsc` is type-check only
