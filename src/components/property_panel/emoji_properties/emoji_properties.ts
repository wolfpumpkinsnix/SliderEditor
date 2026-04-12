import { store } from '../../../state/store.ts'
import { currentSlide, selectedElementId } from '../../../state/signalsStore.ts'
import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import emojiPropertiesHtml from './emoji_properties.html?raw'

@Component({
  tag: 'emoji-properties',
  template: emojiPropertiesHtml
})
export class EmojiPropertiesElement extends BasePropertyElement {
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

    this.get<HTMLInputElement>('el-content')?.addEventListener('input', (e) => {
      store.updateElement(id, el => { if (el.type === 'emoji') el.content = (e.target as HTMLInputElement).value })
    })

    this.get<HTMLInputElement>('el-size')?.addEventListener('input', (e) => {
      const val = Number((e.target as HTMLInputElement).value)
      store.updateElement(id, el => { if (el.type === 'emoji') el.size = val })
    })

    this.get<HTMLInputElement>('el-animated')?.addEventListener('change', (e) => {
      store.updateElement(id, el => { if (el.type === 'emoji') el.animated = (e.target as HTMLInputElement).checked })
    })
  }

  private syncValues() {
    const id = selectedElementId.value
    const slide = currentSlide.value
    if (!id || !slide) return

    const el = slide.elements.find(e => e.id === id)
    if (!el || el.type !== 'emoji') return

    const content = this.get<HTMLInputElement>('el-content')
    if (content && content.value !== el.content) content.value = el.content

    const size = this.get<HTMLInputElement>('el-size')
    if (size && Number(size.value) !== el.size) size.value = String(el.size)

    const sizeVal = this.get('el-size-val')
    if (sizeVal) sizeVal.textContent = `${el.size}px`

    const animated = this.get<HTMLInputElement>('el-animated')
    if (animated) animated.checked = !!el.animated
  }
}
