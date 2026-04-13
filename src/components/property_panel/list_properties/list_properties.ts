import type { ListComponent } from '../../../models/types.ts'
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

  public component: ListComponent | null = null

  private wireInputs() {
    this.get<HTMLTextAreaElement>('el-items')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLTextAreaElement).value.split('\n')
      if (this.component) this.component.items = val
    })

    this.get<HTMLSelectElement>('el-style')?.addEventListener('change', (e) => {
      if (this.component) this.component.style = (e.target as HTMLSelectElement).value as any
    })

    this.get<HTMLSelectElement>('el-variant')?.addEventListener('change', (e) => {
      if (this.component) this.component.variant = (e.target as HTMLSelectElement).value as any
    })
  }

  private syncValues() {
    const comp = this.component
    if (!comp) return

    const items = this.get<HTMLTextAreaElement>('el-items')
    if (items) {
      const val = comp.items.join('\n')
      if (items.value !== val) items.value = val
    }

    const style = this.get<HTMLSelectElement>('el-style')
    if (style && style.value !== comp.style) style.value = comp.style ?? 'disc'

    const variant = this.get<HTMLSelectElement>('el-variant')
    if (variant && variant.value !== (comp.variant ?? 'muted')) variant.value = comp.variant ?? 'muted'
  }
}
