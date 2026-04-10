import { effect } from '@preact/signals-core'
import { mode } from '../state/signalsStore.ts'
import { store } from '../state/store.ts'
import './editor/toolbar.ts'
import './editor/slide-panel.ts'
import './editor/slide-canvas.ts'
import './editor/property-panel.ts'
import './presentation/presentation-mode.ts'

export class AppShellElement extends HTMLElement {
  private _presentationMode: HTMLElement | null = null
  // Holds the cleanup function returned by effect() – called on disconnect.
  private _disposeEffect: (() => void) | null = null

  connectedCallback() {
    this.render()
    // Use effect() from @preact/signals-core to react to mode signal changes.
    // This replaces the 'state-changed' EventTarget listener for presentation-
    // mode toggling: the effect runs immediately on connection, and again
    // automatically whenever the `mode` signal value changes.
    this._disposeEffect = effect(() => {
      this.handleModeChange(mode.value)
    })
    this.setupKeyboardShortcuts()
  }

  disconnectedCallback() {
    // Dispose the effect to stop listening for signal changes.
    this._disposeEffect?.()
    this._disposeEffect = null
  }

  private render() {
    this.innerHTML = `
      <editor-toolbar></editor-toolbar>
      <div class="editor-body">
        <slide-panel></slide-panel>
        <slide-canvas></slide-canvas>
        <property-panel></property-panel>
      </div>
    `
  }

  private handleModeChange(currentMode: string) {
    if (currentMode === 'present' && !this._presentationMode) {
      this._presentationMode = document.createElement('presentation-mode')
      document.body.appendChild(this._presentationMode)
      this._presentationMode.addEventListener('remove', () => {
        this._presentationMode = null
      })
    } else if (currentMode === 'edit' && this._presentationMode) {
      this._presentationMode.remove()
      this._presentationMode = null
    }
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).contentEditable === 'true') return

      if (e.key === 'F5') { e.preventDefault(); store.setMode('present'); return }
      if (e.key === 'Escape' && store.selectedElementId) { store.selectElement(null); return }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedElementId) { store.removeElement(store.selectedElementId); return }
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (!store.selectedElementId) store.goToSlide(store.currentSlideIndex + 1)
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (!store.selectedElementId) store.goToSlide(store.currentSlideIndex - 1)
      }
    })
  }
}

customElements.define('app-shell', AppShellElement)
