import { store } from '../state/store.ts'
import './editor/toolbar.ts'
import './editor/slide-panel.ts'
import './editor/slide-canvas.ts'
import './editor/property-panel.ts'
import './presentation/presentation-mode.ts'

export class AppShellElement extends HTMLElement {
  private _presentationMode: HTMLElement | null = null
  private _onStateChanged = () => this.handleModeChange()

  connectedCallback() {
    store.addEventListener('state-changed', this._onStateChanged)
    this.render()
    this.setupKeyboardShortcuts()
  }

  disconnectedCallback() {
    store.removeEventListener('state-changed', this._onStateChanged)
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

  private handleModeChange() {
    if (store.mode === 'present' && !this._presentationMode) {
      this._presentationMode = document.createElement('presentation-mode')
      document.body.appendChild(this._presentationMode)
      this._presentationMode.addEventListener('remove', () => {
        this._presentationMode = null
      })
    } else if (store.mode === 'edit' && this._presentationMode) {
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
