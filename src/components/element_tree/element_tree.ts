import { currentSlide, selectedElementId, reorderElement } from '../../state/signalsStore.ts'
import { store } from '../../state/store.ts'
import type { Entity } from '../../models/types.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import elementTreeHtml from './element_tree.html?raw'

@Component({
  tag: 'element-tree',
  template: elementTreeHtml
})
export class ElementTreeElement extends EffectComponent {
  private _dragSourceId: string | null = null
  private _dragOverId: string | null = null

  connectedCallback() {
    this.render()
    this.addEffect(() => {
      this.update()
    })
  }

  private update() {
    const slide = currentSlide.value
    const selectedId = selectedElementId.value
    const list = this.get('tree-list')
    if (!list) return

    if (!slide || slide.entities.length === 0) {
      list.replaceChildren()
      return
    }

    // Render entities in reverse order (top of list = front = last in array)
    const entities = [...slide.entities].reverse()
    const frag = document.createDocumentFragment()

    entities.forEach((el, visualIndex) => {
      const realIndex = slide.entities.length - 1 - visualIndex
      this.appendEntityRows(el, frag, selectedId, false, realIndex)
    })

    list.replaceChildren(frag)
  }

  private appendEntityRows(el: Entity, container: DocumentFragment | HTMLElement, selectedId: string | null, isChild: boolean, realIndex: number, depth = 0) {
    const row = this.buildRow(el, selectedId, isChild, realIndex, depth)
    container.appendChild(row)

    if (el.children && el.children.length > 0) {
      el.children.forEach(child => {
        this.appendEntityRows(child, container, selectedId, true, -1, depth + 1)
      })
    }
  }

  private buildRow(el: Entity, selectedId: string | null, isChild: boolean, realIndex: number, depth: number): HTMLElement {
    const row = document.createElement('div')
    row.className = 'tree-row' + (isChild ? ' tree-row--child' : '') + (el.id === selectedId ? ' tree-row--selected' : '')
    row.dataset['id'] = el.id
    row.style.paddingLeft = `${depth * 16 + 12}px`

    if (!isChild) {
      row.draggable = true
      row.dataset['realIndex'] = String(realIndex)
    }

    const icon = document.createElement('span')
    icon.className = 'tree-icon'
    icon.textContent = entityIcon(el)

    const label = document.createElement('span')
    label.className = 'tree-label'
    label.textContent = el.name

    row.appendChild(icon)
    row.appendChild(label)

    row.addEventListener('click', () => {
      store.selectElement(el.id)
    })

    if (!isChild) {
      row.addEventListener('dragstart', (e) => {
        this._dragSourceId = el.id
        row.classList.add('tree-row--dragging')
        e.dataTransfer!.effectAllowed = 'move'
        e.dataTransfer!.setData('text/plain', el.id)
      })
      // ... same drag logic ...

      row.addEventListener('dragend', () => {
        this._dragSourceId = null
        this._dragOverId = null
        this.clearDragStyles()
      })

      row.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.dataTransfer!.dropEffect = 'move'
        if (this._dragOverId !== el.id) {
          this._dragOverId = el.id
          this.clearDragStyles()
          row.classList.add('tree-row--dragover')
        }
      })

      row.addEventListener('drop', (e) => {
        e.preventDefault()
        if (!this._dragSourceId || this._dragSourceId === el.id) return
        const targetIndex = Number(row.dataset['realIndex'])
        reorderElement(this._dragSourceId, targetIndex)
      })
    }

    return row
  }

  private clearDragStyles() {
    this.querySelectorAll('.tree-row--dragging, .tree-row--dragover').forEach(el => {
      el.classList.remove('tree-row--dragging', 'tree-row--dragover')
    })
  }
}

function entityIcon(el: Entity): string {
  const textComp = el.components.find(c => c.type === 'text')
  const iconComp = el.components.find(c => c.type === 'icon')
  const listComp = el.components.find(c => c.type === 'list')
  const layoutComp = el.components.find(c => c.type === 'layout')

  if (iconComp && iconComp.type === 'icon') return iconComp.value
  if (textComp && textComp.type === 'text') {
    if (textComp.fontSize === 'h1' || textComp.fontSize === 'h2') return 'H'
    return 'T'
  }
  if (listComp) return '≡'
  if (layoutComp) return '▦'
  return '▢'
}
