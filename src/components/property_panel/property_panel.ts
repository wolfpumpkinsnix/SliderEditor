import { currentSlide, selectedElementId, removeElement, findElement, updateElement } from '../../state/signalsStore.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import propertyPanelHtml from './property_panel.html?raw'

// Import sub-components to register them
import './slide_properties/slide_properties.ts'
import './text_properties/text_properties.ts'
import './icon_properties/icon_properties.ts'
import './layout_properties/layout_properties.ts'
import './background_properties/background_properties.ts'
import './list_properties/list_properties.ts'

@Component({
  tag: 'property-panel',
  template: propertyPanelHtml
})
export class PropertyPanelElement extends EffectComponent {
  connectedCallback() {
    this.render()
    this.addEffect(() => {
      this.route()
    })
  }

  private route() {
    const container = this.querySelector('#props-container')! as HTMLElement
    const elementId = selectedElementId.value
    const slide = currentSlide.value

    // No element selected → show slide properties
    if (!elementId || !slide) {
      if (container.dataset['view'] !== 'slide') {
        container.dataset['view'] = 'slide'
        delete container.dataset['elementId']
        container.replaceChildren(document.createElement('slide-properties'))
      }
      return
    }

    const el = findElement(slide, elementId)

    if (!el) {
      if (container.dataset['view'] !== 'slide') {
        container.dataset['view'] = 'slide'
        delete container.dataset['elementId']
        container.replaceChildren(document.createElement('slide-properties'))
      }
      return
    }

    // Already showing this element's properties — skip full re-render
    if (container.dataset['view'] === 'element'
      && container.dataset['elementId'] === el.id) return

    container.dataset['view'] = 'element'
    container.dataset['elementId'] = el.id
    container.replaceChildren()

    // Render title/meta
    const title = document.createElement('h3')
    title.textContent = `Entity: ${el.name}`
    title.className = 'text-lg font-bold mb-4 px-4'
    container.appendChild(title)

    // Mount an editor for each component attached to the entity
    el.components.forEach(comp => {
      let propEl: HTMLElement | null = null
      switch (comp.type) {
        case 'text':       propEl = document.createElement('text-properties'); break
        case 'icon':       propEl = document.createElement('icon-properties'); break
        case 'layout':     propEl = document.createElement('layout-properties'); break
        case 'background': propEl = document.createElement('background-properties'); break
        case 'list':       propEl = document.createElement('list-properties'); break
      }
      if (propEl) {
        (propEl as any).component = comp // Pass component reference
        container.appendChild(propEl)
      }
    })

    // Add component section
    const addSection = document.createElement('div')
    addSection.className = 'mx-4 mt-6 flex flex-col gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50'
    addSection.innerHTML = `
      <div class="text-xs font-semibold text-slate-400 mb-1">ADD COMPONENT</div>
      <select class="prop-select" id="add-comp-select">
        <option value="text">Text / Heading</option>
        <option value="background">Background</option>
        <option value="layout">Layout / Grid</option>
        <option value="icon">Icon / Emoji</option>
        <option value="list">List</option>
      </select>
      <button id="add-comp-btn" class="toolbar-btn toolbar-btn-outline w-full justify-center mt-1">＋ Add</button>
    `
    container.appendChild(addSection)

    addSection.querySelector('#add-comp-btn')!.addEventListener('click', () => {
      const type = addSection.querySelector<HTMLSelectElement>('#add-comp-select')!.value
      updateElement(el.id, entity => {
        switch(type) {
          case 'text': entity.components.push({ type: 'text', content: 'New Text', fontSize: 'body', variant: 'secondary' }); break;
          case 'background': entity.components.push({ type: 'background', variant: 'glass', padding: '1.5rem', rounded: true }); break;
          case 'layout': entity.components.push({ type: 'layout', layoutType: 'flex', direction: 'column', gap: 16 }); break;
          case 'icon': entity.components.push({ type: 'icon', value: '😀', size: 48, animated: false }); break;
          case 'list': entity.components.push({ type: 'list', items: ['Item 1', 'Item 2'], style: 'disc', variant: 'secondary' }); break;
        }
      })
    })

    // Delete button
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'delete-btn mx-4 mt-6 mb-6'
    deleteBtn.textContent = 'Delete entity'
    deleteBtn.onclick = () => removeElement(el.id)
    container.appendChild(deleteBtn)
  }
}
