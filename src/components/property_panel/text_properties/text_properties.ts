import { store } from '../../../state/store.ts'
import { currentSlide, selectedElementId, findElement } from '../../../state/signalsStore.ts'
import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import textPropertiesHtml from './text_properties.html?raw'

@Component({
  tag: 'text-properties',
  template: textPropertiesHtml
})
export class TextPropertiesElement extends BasePropertyElement {
  connectedCallback() {
    this.render()
    this.wireInputs()
    this.addEffect(() => {
      this.syncValues()
    })
  }

  private wireInputs() {
    const id = selectedElementId.value
    if (!id) return

    this.get<HTMLTextAreaElement>('el-content')?.addEventListener('input', (e) => {
      store.updateElement(id, el => {
        if ('content' in el) (el as { content: string }).content = (e.target as HTMLTextAreaElement).value
      })
    })

    this.get<HTMLSelectElement>('el-level')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'heading') el.level = Number((e.target as HTMLSelectElement).value) as 1 | 2 })
    })

    this.get<HTMLInputElement>('el-gradient')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'heading') el.gradient = (e.target as HTMLInputElement).checked })
    })

    this.get<HTMLSelectElement>('el-variant')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'text') el.variant = (e.target as HTMLSelectElement).value as any })
    })

    this.get<HTMLSelectElement>('el-align')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'text') el.align = (e.target as HTMLSelectElement).value as any })
    })

    this.get<HTMLInputElement>('el-max-width')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value
      store.updateElement(id, el => { if (el.type === 'text') el.maxWidth = val || undefined })
    })
  }

  private syncValues() {
    const id = selectedElementId.value
    const slide = currentSlide.value
    if (!id || !slide) return

    const el = findElement(slide, id)
    if (!el || (el.type !== 'text' && el.type !== 'heading' && el.type !== 'label')) return

    const title = this.get('el-header-title')
    if (title) title.textContent = `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} Properties`

    const content = this.get<HTMLTextAreaElement>('el-content')
    const elContent = 'content' in el ? (el as { content: string }).content : ''
    if (content && content.value !== elContent) content.value = elContent

    const hOnly = this.get<HTMLElement>('heading-only')
    if (hOnly) hOnly.style.display = el.type === 'heading' ? 'block' : 'none'

    if (el.type === 'heading') {
      const level = this.get<HTMLSelectElement>('el-level')
      if (level) level.value = String(el.level)
      const grad = this.get<HTMLInputElement>('el-gradient')
      if (grad) grad.checked = !!el.gradient
    }

    const tOnly = this.get<HTMLElement>('text-only')
    if (tOnly) tOnly.style.display = el.type === 'text' ? 'block' : 'none'

    if (el.type === 'text') {
      const variant = this.get<HTMLSelectElement>('el-variant')
      if (variant) variant.value = el.variant ?? 'body'
      const align = this.get<HTMLSelectElement>('el-align')
      if (align) align.value = el.align ?? 'left'
      const maxWidth = this.get<HTMLInputElement>('el-max-width')
      if (maxWidth) maxWidth.value = el.maxWidth ?? ''
    }
  }
}
