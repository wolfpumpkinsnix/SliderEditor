import type { TextComponent } from '../../../models/types.ts'
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

  public component: TextComponent | null = null

  private wireInputs() {
    this.get<HTMLTextAreaElement>('el-content')?.addEventListener('input', (e) => {
      if (this.component) this.component.content = (e.target as HTMLTextAreaElement).value
    })

    this.get<HTMLSelectElement>('el-font-size')?.addEventListener('change', (e) => {
      if (this.component) this.component.fontSize = (e.target as HTMLSelectElement).value as any
    })

    this.get<HTMLInputElement>('el-gradient')?.addEventListener('change', (e) => {
      if (this.component) this.component.gradient = (e.target as HTMLInputElement).checked
    })

    this.get<HTMLSelectElement>('el-align')?.addEventListener('change', (e) => {
      if (this.component) this.component.align = (e.target as HTMLSelectElement).value as any
    })

    this.get<HTMLInputElement>('el-max-width')?.addEventListener('input', (e) => {
      if (this.component) this.component.maxWidth = (e.target as HTMLInputElement).value || undefined
    })
  }

  private syncValues() {
    const comp = this.component
    if (!comp) return

    const content = this.get<HTMLTextAreaElement>('el-content')
    if (content && content.value !== comp.content) content.value = comp.content

    const fontSize = this.get<HTMLSelectElement>('el-font-size')
    if (fontSize) fontSize.value = comp.fontSize || 'body'

    const grad = this.get<HTMLInputElement>('el-gradient')
    if (grad) grad.checked = !!comp.gradient

    const align = this.get<HTMLSelectElement>('el-align')
    if (align) align.value = comp.align ?? 'left'

    const maxWidth = this.get<HTMLInputElement>('el-max-width')
    if (maxWidth) maxWidth.value = comp.maxWidth ?? ''
  }
}
