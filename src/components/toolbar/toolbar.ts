import { store } from '../../state/store.ts'
import { presentation } from '../../state/signalsStore.ts'
import { blankContentSlide, blankTitleSlide, createHeading, createText, createLabel, createList, createEmoji, createGrid, createCard } from '../../models/defaults.ts'
import { exportPresentation } from '../../services/export.ts'
import type { Entity } from '../../models/types.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import toolbarHtml from './toolbar.html?raw'

@Component({
  tag: 'editor-toolbar',
  template: toolbarHtml
})
export class EditorToolbarElement extends EffectComponent {
  connectedCallback() {
    this.render()
    this.setupListeners()

    // Targeted update for presentation title
    this.addEffect(() => {
      const title = presentation.value.title
      const input = this.querySelector<HTMLInputElement>('#pres-title')
      if (input && input.value !== title && document.activeElement !== input) {
        input.value = title
      }
    })
  }

  private setupListeners() {
    this.querySelector('#pres-title')?.addEventListener('input', (e) => {
      store.updateTitle((e.target as HTMLInputElement).value)
    })

    this.querySelector('#btn-add-content-slide')?.addEventListener('click', () => {
      store.addSlide(blankContentSlide(), store.currentSlideIndex)
    })

    this.querySelector('#btn-add-title-slide')?.addEventListener('click', () => {
      store.addSlide(blankTitleSlide(), store.currentSlideIndex)
    })

    this.querySelector('#btn-present')?.addEventListener('click', () => {
      store.setMode('present')
    })

    this.querySelector('#btn-export')?.addEventListener('click', () => {
      try {
        const html = exportPresentation(store.presentation)
        if (!html || html.length < 100) {
          throw new Error('Export generated unexpectedly short HTML')
        }
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const safeTitle = store.presentation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'presentation'
        a.download = `${safeTitle}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('Export failed:', err)
        alert('Export failed. Check console for details.')
      }
    })

    const addBtn = this.querySelector('#btn-add-element')
    const addMenu = this.querySelector<HTMLElement>('#add-menu')!

    addBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      const isOpen = addMenu.style.display !== 'none'
      addMenu.style.display = isOpen ? 'none' : 'block'
      if (!isOpen) this.buildAddMenu(addMenu)
    })

    document.addEventListener('click', () => { addMenu.style.display = 'none' })

    // Event delegation for the add-menu
    addMenu.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button[data-type]')
      if (btn) {
        e.stopPropagation()
        const type = (btn as HTMLElement).dataset['type']
        this.handleAddElement(type!)
        addMenu.style.display = 'none'
      }
    })
  }

  private handleAddElement(type: string) {
    let element: Entity
    switch (type) {
      case 'empty': element = { id: crypto.randomUUID(), name: 'New Entity', components: [] }; break
      case 'heading': element = createHeading('New Heading', 2); break
      case 'text': element = createText('Add your text here.'); break
      case 'label': element = createLabel('Section Label'); break
      case 'list': element = createList(['First item', 'Second item', 'Third item']); break
      case 'emoji': element = createEmoji('🎯', 64, false); break
      case 'grid-2':
        element = createGrid(2, 24, [
          createCard('Card Title', 'Card description here.', 'glass', '✨'),
          createCard('Card Title', 'Card description here.', 'glass', '🚀'),
        ]); 
        break
      case 'grid-3':
        element = createGrid(3, 24, [
          createCard('Feature', 'Description of this feature.', 'metric', '💡'),
          createCard('Feature', 'Description of this feature.', 'metric', '⚡'),
          createCard('Feature', 'Description of this feature.', 'metric', '🔥'),
        ]); 
        break
      default: return
    }
    store.addElement(element)
  }

  private buildAddMenu(menu: HTMLElement) {
    const elementTypes = [
      { label: '✨ Empty Entity', type: 'empty' },
      { label: '📝 Heading', type: 'heading' },
      { label: '📄 Text', type: 'text' },
      { label: '🏷 Label', type: 'label' },
      { label: '• List', type: 'list' },
      { label: '😀 Emoji', type: 'emoji' },
      { label: '▦ 2-column grid', type: 'grid-2' },
      { label: '▦▦ 3-column grid', type: 'grid-3' },
    ]

    // Use DocumentFragment for efficient batch update
    const frag = document.createDocumentFragment()
    elementTypes.forEach(({ label, type }) => {
      const btn = document.createElement('button')
      btn.textContent = label
      btn.dataset['type'] = type
      btn.className = 'dropdown-item'
      btn.style.cssText = `
        display:block;width:100%;padding:8px 14px;
        background:none;border:none;
        color:#f1f5f9;cursor:pointer;text-align:left;
        font-size:13px;border-radius:4px;
        transition:background 0.15s;white-space:nowrap;
      `
      btn.addEventListener('mouseover', () => { btn.style.background = 'rgba(148,163,184,0.1)' })
      btn.addEventListener('mouseout', () => { btn.style.background = 'none' })
      frag.appendChild(btn)
    })
    menu.replaceChildren(frag)
  }
}
