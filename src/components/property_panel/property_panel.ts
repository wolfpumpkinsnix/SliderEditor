import { currentSlide, selectedElementId, moveElementUp, moveElementDown, bringToFront, sendToBack, removeElement, findElement } from '../../state/signalsStore.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import propertyPanelHtml from './property_panel.html?raw'

// Import sub-components to register them
import './slide_properties/slide_properties.ts'
import './text_properties/text_properties.ts'
import './emoji_properties/emoji_properties.ts'
import './grid_properties/grid_properties.ts'
import './card_properties/card_properties.ts'
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
      && container.dataset['elementId'] === el.id
      && container.dataset['elementType'] === el.type) return

    container.dataset['view'] = 'element'
    container.dataset['elementId'] = el.id
    container.dataset['elementType'] = el.type
    container.replaceChildren()

    let propEl: HTMLElement | null = null
    switch (el.type) {
      case 'label':
      case 'text':
      case 'heading': propEl = document.createElement('text-properties'); break
      case 'emoji':   propEl = document.createElement('emoji-properties'); break
      case 'grid':    propEl = document.createElement('grid-properties'); break
      case 'card':    propEl = document.createElement('card-properties'); break
      case 'list':    propEl = document.createElement('list-properties'); break
    }
    if (propEl) container.appendChild(propEl)

    // Reorder controls (only for top-level elements, not grid children)
    const isTopLevel = !!slide.elements.find(e => e.id === el.id)
    if (isTopLevel) {
      const reorderRow = document.createElement('div')
      reorderRow.className = 'reorder-row'
      reorderRow.innerHTML = `
        <button data-action="up"    title="Move up">↑ Up</button>
        <button data-action="down"  title="Move down">↓ Down</button>
        <button data-action="front" title="Bring to front">⬆ Front</button>
        <button data-action="back"  title="Send to back">⬇ Back</button>
      `
      reorderRow.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button[data-action]') as HTMLElement | null
        if (!btn) return
        switch (btn.dataset['action']) {
          case 'up':    moveElementUp(el.id); break
          case 'down':  moveElementDown(el.id); break
          case 'front': bringToFront(el.id); break
          case 'back':  sendToBack(el.id); break
        }
      })
      container.appendChild(reorderRow)
    }

    // Delete button
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'delete-btn'
    deleteBtn.textContent = 'Delete selected element'
    deleteBtn.onclick = () => removeElement(el.id)
    container.appendChild(deleteBtn)
  }
}
