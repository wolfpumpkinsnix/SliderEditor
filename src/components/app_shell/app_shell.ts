import { mode } from '../../state/signalsStore.ts'
import { store } from '../../state/store.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import appShellHtml from './app_shell.html?raw'

import '../toolbar/toolbar.ts'
import '../slide_panel/slide_panel.ts'
import '../slide_canvas/slide_canvas.ts'
import '../property_panel/property_panel.ts'
import '../presentation_mode/presentation_mode.ts'

@Component({
  tag: 'app-shell',
  template: appShellHtml
})
export class AppShellElement extends EffectComponent {
  private _presentationMode: HTMLElement | null = null

  connectedCallback() {
    this.render()
    this.addEffect(() => {
      this.handleModeChange(mode.value)
    })
    this.setupKeyboardShortcuts()
  }

  private handleModeChange(currentMode: string) {
    if (currentMode === 'present' && !this._presentationMode) {
      document.body.classList.add('presenting')
      this._presentationMode = document.createElement('presentation-mode')
      document.body.appendChild(this._presentationMode)
      this._presentationMode.addEventListener('remove', () => {
        this._presentationMode = null
        document.body.classList.remove('presenting')
      })
    } else if (currentMode === 'edit' && this._presentationMode) {
      document.body.classList.remove('presenting')
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
