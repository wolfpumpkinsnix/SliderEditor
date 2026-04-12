import { store } from '../../../state/store.ts'
import { presentation, currentSlide, currentSlideIndex } from '../../../state/signalsStore.ts'
import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import slidePropertiesHtml from './slide_properties.html?raw'

@Component({
  tag: 'slide-properties',
  template: slidePropertiesHtml
})
export class SlidePropertiesElement extends BasePropertyElement {
  connectedCallback() {
    this.render()
    this.wireInputs()
    this.addEffect(() => {
      this.syncValues()
    })
  }

  private wireInputs() {
    this.get<HTMLSelectElement>('slide-layout')?.addEventListener('change', (e) => {
      store.updateCurrentSlide(s => { s.layout = (e.target as HTMLSelectElement).value as any })
    })

    this.get<HTMLInputElement>('slide-particles')?.addEventListener('change', (e) => {
      store.updateCurrentSlide(s => { s.hasParticles = (e.target as HTMLInputElement).checked })
    })

    this.querySelectorAll<HTMLInputElement>('[data-theme-color]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset['themeColor'] as any
        store.updatePresentation(p => { (p.theme.colors as any)[key] = input.value })
      })
    })

    this.get<HTMLInputElement>('theme-font-display')?.addEventListener('input', (e) => {
      store.updatePresentation(p => { p.theme.fonts.display = (e.target as HTMLInputElement).value })
    })

    this.get<HTMLInputElement>('theme-font-body')?.addEventListener('input', (e) => {
      store.updatePresentation(p => { p.theme.fonts.body = (e.target as HTMLInputElement).value })
    })

    this.get('add-blob')?.addEventListener('click', () => {
      store.updateCurrentSlide(s => {
        s.background.blobs.push({ color: '#ffffff', opacity: 0.1, width: 300, height: 300 })
      })
    })
  }

  private syncValues() {
    const slide = currentSlide.value
    if (!slide) return

    const index = currentSlideIndex.value
    const pres = presentation.value

    const label = this.get('slide-index-label')
    if (label) label.textContent = `Slide ${index + 1}`

    const layout = this.get<HTMLSelectElement>('slide-layout')
    if (layout && layout.value !== slide.layout) layout.value = slide.layout

    const particles = this.get<HTMLInputElement>('slide-particles')
    if (particles) particles.checked = slide.hasParticles

    // Theme colors
    this.querySelectorAll<HTMLInputElement>('[data-theme-color]').forEach(input => {
      const key = input.dataset['themeColor'] as any
      input.value = (pres.theme.colors as any)[key]
    })

    // Theme fonts
    const fontDisplay = this.get<HTMLInputElement>('theme-font-display')
    if (fontDisplay && document.activeElement !== fontDisplay && fontDisplay.value !== pres.theme.fonts.display) {
      fontDisplay.value = pres.theme.fonts.display
    }
    const fontBody = this.get<HTMLInputElement>('theme-font-body')
    if (fontBody && document.activeElement !== fontBody && fontBody.value !== pres.theme.fonts.body) {
      fontBody.value = pres.theme.fonts.body
    }

    // Blobs
    this.updateBlobsList(slide)
  }

  private updateBlobsList(slide: any) {
    const container = this.get('blobs-list')
    if (!container) return

    const items = Array.from(container.children) as HTMLElement[]
    if (items.length !== slide.background.blobs.length) {
      const frag = document.createDocumentFragment()
      slide.background.blobs.forEach((blob: any, i: number) => {
        const rowTpl = this.getTemplate('tpl-blob-row')
        const row = (rowTpl.content.cloneNode(true) as DocumentFragment)
        const root = row.firstElementChild as HTMLElement

        const colorInput = root.querySelector<HTMLInputElement>('[data-blob-color]')!
        colorInput.value = blob.color
        colorInput.addEventListener('input', () => {
          store.updateCurrentSlide(s => { s.background.blobs[i].color = colorInput.value })
        })

        const rangeInput = root.querySelector<HTMLInputElement>('[data-blob-opacity]')!
        rangeInput.value = String(blob.opacity)
        const opacitySpan = root.querySelector('.opacity-value')!
        opacitySpan.textContent = `${Math.round(blob.opacity * 100)}%`
        rangeInput.addEventListener('input', () => {
          const val = Number(rangeInput.value)
          store.updateCurrentSlide(s => { s.background.blobs[i].opacity = val })
          opacitySpan.textContent = `${Math.round(val * 100)}%`
        })

        const deleteBtn = root.querySelector('[data-action="delete-blob"]')!
        deleteBtn.addEventListener('click', () => {
          store.updateCurrentSlide(s => { s.background.blobs.splice(i, 1) })
        })

        frag.appendChild(row)
      })
      container.replaceChildren(frag)
    } else {
      items.forEach((row, i) => {
        const blob = slide.background.blobs[i]
        const colorInput = row.querySelector<HTMLInputElement>('[data-blob-color]')!
        if (colorInput.value !== blob.color) colorInput.value = blob.color

        const rangeInput = row.querySelector<HTMLInputElement>('[data-blob-opacity]')!
        if (Number(rangeInput.value) !== blob.opacity) rangeInput.value = String(blob.opacity)

        const opacitySpan = row.querySelector('.opacity-value')!
        opacitySpan.textContent = `${Math.round(blob.opacity * 100)}%`
      })
    }
  }
}
