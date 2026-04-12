import { store } from '../../../state/store.ts'
import { currentSlide, selectedElementId } from '../../../state/signalsStore.ts'
import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import cardPropertiesHtml from './card_properties.html?raw'

@Component({
  tag: 'card-properties',
  template: cardPropertiesHtml
})
export class CardPropertiesElement extends BasePropertyElement {
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

    this.get<HTMLInputElement>('el-icon')?.addEventListener('input', (e) => {
      store.updateElement(id, el => { if (el.type === 'card') el.icon = (e.target as HTMLInputElement).value })
    })

    this.get<HTMLInputElement>('el-title-input')?.addEventListener('input', (e) => {
      store.updateElement(id, el => { if (el.type === 'card') el.title = (e.target as HTMLInputElement).value })
    })

    this.get<HTMLTextAreaElement>('el-body')?.addEventListener('input', (e) => {
      store.updateElement(id, el => { if (el.type === 'card') el.body = (e.target as HTMLTextAreaElement).value })
    })

    this.get<HTMLTextAreaElement>('el-list-items')?.addEventListener('input', (e) => {
      const items = (e.target as HTMLTextAreaElement).value.split('\n').filter(s => s.trim().length > 0)
      store.updateElement(id, el => { if (el.type === 'card') el.listItems = items.length > 0 ? items : undefined })
    })

    this.get<HTMLInputElement>('el-number-badge')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value
      store.updateElement(id, el => { if (el.type === 'card') el.numberBadge = val !== '' ? Number(val) : undefined })
    })

    this.get<HTMLSelectElement>('el-variant')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'card') el.variant = (e.target as HTMLSelectElement).value as any })
    })
  }

  private syncValues() {
    const id = selectedElementId.value
    const slide = currentSlide.value
    if (!id || !slide) return

    const el = slide.elements.flatMap(e => e.type === 'grid' ? e.children : [e]).find(c => c.id === id)
    if (!el || el.type !== 'card') return

    const icon = this.get<HTMLInputElement>('el-icon')
    if (icon && icon.value !== el.icon) icon.value = el.icon ?? ''

    const title = this.get<HTMLInputElement>('el-title-input')
    if (title && title.value !== el.title) title.value = el.title ?? ''

    const body = this.get<HTMLTextAreaElement>('el-body')
    if (body && body.value !== el.body) body.value = el.body ?? ''

    const listItems = this.get<HTMLTextAreaElement>('el-list-items')
    if (listItems) {
      const val = (el.listItems ?? []).join('\n')
      if (listItems.value !== val) listItems.value = val
    }

    const badge = this.get<HTMLInputElement>('el-number-badge')
    if (badge) {
      const val = el.numberBadge !== undefined ? String(el.numberBadge) : ''
      if (badge.value !== val) badge.value = val
    }

    const variant = this.get<HTMLSelectElement>('el-variant')
    if (variant && variant.value !== el.variant) variant.value = el.variant ?? 'glass'
  }
}
