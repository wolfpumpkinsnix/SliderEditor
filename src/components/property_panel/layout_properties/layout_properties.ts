import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import layoutPropertiesHtml from './layout_properties.html?raw'
import type { LayoutComponent } from '../../../models/types.ts'

@Component({
  tag: 'layout-properties',
  template: layoutPropertiesHtml
})
export class LayoutPropertiesElement extends BasePropertyElement {
  public component: LayoutComponent | null = null

  connectedCallback() {
    this.render()
    this.wireInputs()
    this.addEffect(() => {
      this.syncValues()
    })
  }

  private wireInputs() {
    this.get<HTMLSelectElement>('el-layout-type')?.addEventListener('change', (e) => {
      if (this.component) this.component.layoutType = (e.target as HTMLSelectElement).value as any
    })

    this.get<HTMLSelectElement>('el-columns')?.addEventListener('change', (e) => {
      if (this.component) this.component.columns = Number((e.target as HTMLSelectElement).value) as 2 | 3
    })

    this.get<HTMLInputElement>('el-gap')?.addEventListener('input', (e) => {
      if (this.component) this.component.gap = Number((e.target as HTMLInputElement).value) || 0
    })

    this.get<HTMLSelectElement>('el-direction')?.addEventListener('change', (e) => {
      if (this.component) this.component.direction = (e.target as HTMLSelectElement).value as any
    })
  }

  private syncValues() {
    const comp = this.component
    if (!comp) return

    const layoutType = this.get<HTMLSelectElement>('el-layout-type')
    if (layoutType) layoutType.value = comp.layoutType || 'flex'

    const columns = this.get<HTMLSelectElement>('el-columns')
    if (columns) columns.value = String(comp.columns || 2)

    const gap = this.get<HTMLInputElement>('el-gap')
    if (gap) gap.value = String(comp.gap || 0)

    const direction = this.get<HTMLSelectElement>('el-direction')
    if (direction) direction.value = comp.direction || 'row'
    
    // Toggle visibility based on layout type
    const gridFields = this.get<HTMLElement>('grid-fields')
    if (gridFields) gridFields.style.display = comp.layoutType === 'grid' ? 'block' : 'none'
    
    const flexFields = this.get<HTMLElement>('flex-fields')
    if (flexFields) flexFields.style.display = comp.layoutType === 'flex' ? 'block' : 'none'
  }
}

