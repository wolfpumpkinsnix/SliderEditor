import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import iconPropertiesHtml from './icon_properties.html?raw'
import type { IconComponent } from '../../../models/types.ts'

@Component({
  tag: 'icon-properties',
  template: iconPropertiesHtml
})
export class IconPropertiesElement extends BasePropertyElement {
  public component: IconComponent | null = null

  connectedCallback() {
    this.render()
    this.wireInputs()
    this.addEffect(() => {
      this.syncValues()
    })
  }

  private wireInputs() {
    this.get<HTMLInputElement>('el-content')?.addEventListener('input', (e) => {
      if (this.component) this.component.value = (e.target as HTMLInputElement).value
    })

    this.get<HTMLInputElement>('el-size')?.addEventListener('input', (e) => {
      if (this.component) this.component.size = Number((e.target as HTMLInputElement).value)
    })

    this.get<HTMLInputElement>('el-animated')?.addEventListener('change', (e) => {
      if (this.component) this.component.animated = (e.target as HTMLInputElement).checked
    })
  }

  private syncValues() {
    const comp = this.component
    if (!comp) return

    const content = this.get<HTMLInputElement>('el-content')
    if (content && content.value !== comp.value) content.value = comp.value

    const size = this.get<HTMLInputElement>('el-size')
    if (size && Number(size.value) !== comp.size) size.value = String(comp.size || 80)

    const sizeVal = this.get('el-size-val')
    if (sizeVal) sizeVal.textContent = `${comp.size || 80}px`

    const animated = this.get<HTMLInputElement>('el-animated')
    if (animated) animated.checked = !!comp.animated
  }
}

