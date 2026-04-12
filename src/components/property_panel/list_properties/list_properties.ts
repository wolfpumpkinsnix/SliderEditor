import { store } from '../../../state/store.ts'
import { currentSlide, selectedElementId } from '../../../state/signalsStore.ts'
import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import listPropertiesHtml from './list_properties.html?raw'

@Component({
  tag: 'list-properties',
  template: listPropertiesHtml
})
export class ListPropertiesElement extends BasePropertyElement {
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

    this.get<HTMLTextAreaElement>('el-items')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLTextAreaElement).value.split('\n')
      store.updateElement(id, el => { if (el.type === 'list') el.items = val })
    })

    this.get<HTMLSelectElement>('el-style')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'list') el.style = (e.target as HTMLSelectElement).value as any })
    })

    this.get<HTMLSelectElement>('el-variant')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'list') el.variant = (e.target as HTMLSelectElement).value as any })
    })
  }

  private syncValues() {
    const id = selectedElementId.value
    const slide = currentSlide.value
    if (!id || !slide) return

    const el = slide.elements.find(e => e.id === id)
    if (!el || el.type !== 'list') return

    const items = this.get<HTMLTextAreaElement>('el-items')
    if (items) {
      const val = el.items.join('\n')
      if (items.value !== val) items.value = val
    }

    const style = this.get<HTMLSelectElement>('el-style')
    if (style && style.value !== el.style) style.value = el.style ?? 'disc'

    const variant = this.get<HTMLSelectElement>('el-variant')
    if (variant && variant.value !== (el.variant ?? 'muted')) variant.value = el.variant ?? 'muted'
  }
}
