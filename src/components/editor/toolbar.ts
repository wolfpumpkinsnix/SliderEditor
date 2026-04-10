import { store } from '../../state/store.ts'
import { blankContentSlide, blankTitleSlide } from '../../models/defaults.ts'
import { exportPresentation } from '../../services/export.ts'
import { genId } from '../../services/id.ts'
import type { SlideElement } from '../../models/types.ts'

export class EditorToolbarElement extends HTMLElement {
  private _onStateChanged = () => this.updateState()

  connectedCallback() {
    store.addEventListener('state-changed', this._onStateChanged)
    this.render()
  }

  disconnectedCallback() {
    store.removeEventListener('state-changed', this._onStateChanged)
  }

  private render() {
    this.innerHTML = `
      <div class="toolbar-inner">
        <div class="toolbar-left">
          <div class="toolbar-logo">⚡ Slide Editor</div>
          <input id="pres-title" type="text" value="${store.presentation.title}" placeholder="Presentation title" class="title-input">
        </div>
        <div class="toolbar-center">
          <div class="toolbar-group" style="position:relative;">
            <button id="btn-add-element" class="toolbar-btn" title="Add element">
              <span>＋ Add Element</span>
            </button>
            <div id="add-menu" class="dropdown-menu" style="display:none;"></div>
          </div>
          <div class="toolbar-divider"></div>
          <button id="btn-add-content-slide" class="toolbar-btn" title="Add content slide">＋ Slide</button>
          <button id="btn-add-title-slide" class="toolbar-btn" title="Add title slide">＋ Title Slide</button>
        </div>
        <div class="toolbar-right">
          <button id="btn-export" class="toolbar-btn toolbar-btn-outline" title="Export as HTML">Export HTML</button>
          <button id="btn-present" class="toolbar-btn toolbar-btn-accent" title="Present (F5)">▶ Present</button>
        </div>
      </div>
    `

    this.setupListeners()
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
      const html = exportPresentation(store.presentation)
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${store.presentation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
      a.click()
      URL.revokeObjectURL(url)
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
  }

  private buildAddMenu(menu: HTMLElement) {
    const elementTypes: Array<{ label: string; factory: () => SlideElement }> = [
      { label: '📝 Heading', factory: () => ({ id: genId(), type: 'heading', level: 2, content: 'New Heading', gradient: false, glow: false }) },
      { label: '📄 Text', factory: () => ({ id: genId(), type: 'text', content: 'Add your text here.', variant: 'secondary' }) },
      { label: '🏷 Label', factory: () => ({ id: genId(), type: 'label', content: 'Section Label' }) },
      { label: '• List', factory: () => ({ id: genId(), type: 'list', items: ['First item', 'Second item', 'Third item'], style: 'disc' }) },
      { label: '😀 Emoji', factory: () => ({ id: genId(), type: 'emoji', content: '🎯', size: 64, animated: false }) },
      { label: '▦ 2-column grid', factory: () => ({
        id: genId(), type: 'grid', columns: 2, children: [
          { id: genId(), type: 'card', variant: 'glass', icon: '✨', title: 'Card Title', body: 'Card description here.' },
          { id: genId(), type: 'card', variant: 'glass', icon: '🚀', title: 'Card Title', body: 'Card description here.' },
        ],
      }) },
      { label: '▦▦ 3-column grid', factory: () => ({
        id: genId(), type: 'grid', columns: 3, children: [
          { id: genId(), type: 'card', variant: 'metric', icon: '💡', title: 'Feature', body: 'Description of this feature.' },
          { id: genId(), type: 'card', variant: 'metric', icon: '⚡', title: 'Feature', body: 'Description of this feature.' },
          { id: genId(), type: 'card', variant: 'metric', icon: '🔥', title: 'Feature', body: 'Description of this feature.' },
        ],
      }) },
    ]

    menu.innerHTML = ''
    elementTypes.forEach(({ label, factory }) => {
      const btn = document.createElement('button')
      btn.textContent = label
      btn.style.cssText = `
        display:block;width:100%;padding:8px 14px;
        background:none;border:none;
        color:#f1f5f9;cursor:pointer;text-align:left;
        font-size:13px;border-radius:4px;
        transition:background 0.15s;white-space:nowrap;
      `
      btn.addEventListener('mouseover', () => { btn.style.background = 'rgba(148,163,184,0.1)' })
      btn.addEventListener('mouseout', () => { btn.style.background = 'none' })
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        store.addElement(factory() as SlideElement)
        menu.style.display = 'none'
      })
      menu.appendChild(btn)
    })
  }

  private updateState() {
    const titleInput = this.querySelector<HTMLInputElement>('#pres-title')
    if (titleInput && titleInput !== document.activeElement) {
      titleInput.value = store.presentation.title
    }
  }
}

customElements.define('editor-toolbar', EditorToolbarElement)
