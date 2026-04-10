# SliderEditor

A Vite + TypeScript presentation editor built with vanilla web components.

## State Management

Application state is managed with **[@preact/signals-core](https://github.com/preactjs/signals)** – a tiny (~2 kB) reactive signals library with no framework dependency.

### Architecture

```
src/state/
  signalsStore.ts   ← source of truth: four core signals + action functions
  store.ts          ← backward-compatible EventTarget wrapper (dispatches
                      'state-changed' for existing components)
```

### Core signals

| Export | Type | Description |
|---|---|---|
| `presentation` | `Signal<Presentation>` | Full presentation document |
| `currentSlideIndex` | `Signal<number>` | Index of the active slide |
| `selectedElementId` | `Signal<string \| null>` | Selected element, or null |
| `mode` | `Signal<EditorMode>` | `'edit'` or `'present'` |
| `currentSlide` | `ReadonlySignal<Slide>` | Computed – current slide |

### Using signals in a new web component

```ts
import { effect } from '@preact/signals-core'
import { mode, currentSlide } from '../state/signalsStore.ts'
import { store } from '../state/store.ts'

class MyElement extends HTMLElement {
  private _dispose: (() => void) | null = null

  connectedCallback() {
    // effect() runs immediately and re-runs whenever accessed signals change.
    this._dispose = effect(() => {
      console.log('mode:', mode.value)
      console.log('slide title:', currentSlide.value.elements[0])
    })
  }

  disconnectedCallback() {
    // Always clean up to avoid memory leaks.
    this._dispose?.()
    this._dispose = null
  }

  // Trigger state changes via action functions.
  private goNext() {
    store.goToSlide(store.currentSlideIndex + 1)
  }
}
```

### Existing components (backward compatibility)

All components that subscribe to `store.addEventListener('state-changed', …)` continue to work unchanged. The `store` object (from `store.ts`) now delegates every read and write to the signals layer, and an internal `effect()` re-dispatches `'state-changed'` whenever any signal changes.

## Development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # tsc + vite build
npm run preview  # preview production build
```
