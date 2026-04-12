import { store } from '../../../state/store.ts'
import { currentSlide, selectedElementId } from '../../../state/signalsStore.ts'
import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import gridPropertiesHtml from './grid_properties.html?raw'

@Component({
  tag: 'grid-properties',
  template: gridPropertiesHtml
})
export class GridPropertiesElement extends BasePropertyElement {
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

    this.get<HTMLSelectElement>('el-columns')?.addEventListener('change', (e) => {
      const val = Number((e.target as HTMLSelectElement).value)
      store.updateElement(id, el => { if (el.type === 'grid') el.columns = val as 2 | 3 })
    })

    this.get<HTMLInputElement>('el-gap')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value
      store.updateElement(id, el => { if (el.type === 'grid') el.gap = val ? Number(val) : undefined })
    })
  }

  private syncValues() {
    const id = selectedElementId.value
    const slide = currentSlide.value
    if (!id || !slide) return

    const el = slide.elements.find(e => e.id === id)
    if (!el || el.type !== 'grid') return

    const columns = this.get<HTMLSelectElement>('el-columns')
    if (columns && Number(columns.value) !== el.columns) columns.value = String(el.columns)

    const gap = this.get<HTMLInputElement>('el-gap')
    if (gap) {
      const val = el.gap !== undefined ? String(el.gap) : ''
      if (gap.value !== val) gap.value = val
    }

    const gridInfo = this.get('grid-info')
    if (gridInfo) {
      gridInfo.textContent = `${el.children.length} item${el.children.length !== 1 ? 's' : ''} — click an item on canvas to edit content`
    }
  }
}
