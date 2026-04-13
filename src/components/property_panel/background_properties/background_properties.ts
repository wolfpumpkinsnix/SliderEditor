import { Component } from '../../../lib/decorators.ts'
import { BasePropertyElement } from '../base_property_element.ts'
import type { BackgroundComponent } from '../../../models/types.ts'

@Component({
  tag: 'background-properties',
  template: `
    <div class="prop-section">
      <div class="prop-group">
        <div class="prop-label" style="color: #06B6D4;">Background Component</div>
      </div>

      <div class="prop-group">
        <label class="prop-label">Variant</label>
        <select id="el-variant" class="prop-select">
          <option value="solid">Solid</option>
          <option value="glass">Glass</option>
          <option value="metric">Metric</option>
        </select>
      </div>

      <div class="prop-group">
        <label class="prop-label">Color</label>
        <input type="text" id="el-color" class="prop-input" placeholder="e.g. #ffffff, rgba(0,0,0,0.5)">
      </div>

      <div class="prop-row">
        <label class="prop-check-row">
          <input type="checkbox" id="el-rounded">
          <span>Rounded Corners</span>
        </label>
      </div>

      <div class="prop-group">
        <label class="prop-label">Padding</label>
        <input type="text" id="el-padding" class="prop-input" placeholder="e.g. 1rem, 24px">
      </div>
    </div>
  `
})
export class BackgroundPropertiesElement extends BasePropertyElement {
  public component: BackgroundComponent | null = null

  connectedCallback() {
    this.render()
    this.wireInputs()
    this.addEffect(() => {
      this.syncValues()
    })
  }

  private wireInputs() {
    this.get<HTMLSelectElement>('el-variant')?.addEventListener('change', (e) => {
      if (this.component) this.component.variant = (e.target as HTMLSelectElement).value as any
    })

    this.get<HTMLInputElement>('el-color')?.addEventListener('input', (e) => {
      if (this.component) this.component.color = (e.target as HTMLInputElement).value
    })

    this.get<HTMLInputElement>('el-rounded')?.addEventListener('change', (e) => {
      if (this.component) this.component.rounded = (e.target as HTMLInputElement).checked
    })

    this.get<HTMLInputElement>('el-padding')?.addEventListener('input', (e) => {
      if (this.component) this.component.padding = (e.target as HTMLInputElement).value
    })
  }

  private syncValues() {
    const comp = this.component
    if (!comp) return

    const variant = this.get<HTMLSelectElement>('el-variant')
    if (variant) variant.value = comp.variant || 'solid'

    const color = this.get<HTMLInputElement>('el-color')
    if (color) color.value = comp.color || ''

    const rounded = this.get<HTMLInputElement>('el-rounded')
    if (rounded) rounded.checked = !!comp.rounded

    const padding = this.get<HTMLInputElement>('el-padding')
    if (padding) padding.value = comp.padding || ''
  }
}
