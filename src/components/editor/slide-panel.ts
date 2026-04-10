import { store } from '../../state/store.ts'
import { blankContentSlide, blankTitleSlide } from '../../models/defaults.ts'
import './slide-thumbnail.ts'
import type { SlideThumbnailElement } from './slide-thumbnail.ts'

export class SlidePanelElement extends HTMLElement {
  private _onStateChanged = () => this.render()

  connectedCallback() {
    store.addEventListener('state-changed', this._onStateChanged)
    this.render()
  }

  disconnectedCallback() {
    store.removeEventListener('state-changed', this._onStateChanged)
  }

  private render() {
    const { presentation, currentSlideIndex } = store
    this.innerHTML = `
      <div class="panel-header">
        <span class="panel-label">Slides</span>
        <div class="panel-actions">
          <button class="icon-btn" data-action="add-content" title="Add content slide">+</button>
        </div>
      </div>
      <div class="slides-list" id="slides-list"></div>
    `

    const list = this.querySelector('#slides-list')!
    presentation.slides.forEach((slide, i) => {
      const thumb = document.createElement('slide-thumbnail') as SlideThumbnailElement
      thumb.dataset['index'] = String(i)
      thumb.style.marginBottom = '8px'
      thumb.slide = slide
      thumb.theme = presentation.theme
      thumb.index = i
      thumb.active = i === currentSlideIndex
      thumb.addEventListener('click', () => store.goToSlide(i))
      thumb.addEventListener('contextmenu', (e) => { e.preventDefault(); this.showContextMenu(e as MouseEvent, i) })
      list.appendChild(thumb)
    })

    this.querySelector('[data-action="add-content"]')?.addEventListener('click', () => {
      store.addSlide(blankContentSlide(), store.currentSlideIndex)
    })
  }

  private showContextMenu(e: MouseEvent, index: number) {
    const existing = document.getElementById('slide-context-menu')
    if (existing) existing.remove()

    const menu = document.createElement('div')
    menu.id = 'slide-context-menu'
    menu.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      background: #1e293b;
      border: 1px solid rgba(148,163,184,0.2);
      border-radius: 8px;
      padding: 4px;
      z-index: 9999;
      min-width: 160px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      font-family: Inter, sans-serif;
      font-size: 13px;
    `

    const items = [
      { label: 'Duplicate', action: () => store.duplicateSlide(index) },
      { label: 'Add slide after', action: () => store.addSlide(blankContentSlide(), index) },
      { label: 'Add title slide after', action: () => store.addSlide(blankTitleSlide(), index) },
      { label: '---', action: null },
      { label: 'Move up', action: () => index > 0 && store.moveSlide(index, index - 1) },
      { label: 'Move down', action: () => index < store.presentation.slides.length - 1 && store.moveSlide(index, index + 1) },
      { label: '---', action: null },
      { label: 'Delete slide', action: () => store.deleteSlide(index), danger: true },
    ]

    items.forEach(item => {
      if (item.label === '---') {
        const sep = document.createElement('div')
        sep.style.cssText = 'height:1px;background:rgba(148,163,184,0.1);margin:4px 0;'
        menu.appendChild(sep)
        return
      }
      const btn = document.createElement('button')
      btn.textContent = item.label
      btn.style.cssText = `
        display: block; width: 100%;
        padding: 6px 12px;
        background: none; border: none;
        color: ${(item as { danger?: boolean }).danger ? '#f87171' : '#f1f5f9'};
        cursor: pointer;
        text-align: left;
        border-radius: 4px;
        transition: background 0.15s;
      `
      btn.addEventListener('mouseover', () => { btn.style.background = 'rgba(148,163,184,0.1)' })
      btn.addEventListener('mouseout', () => { btn.style.background = 'none' })
      btn.addEventListener('click', () => {
        item.action?.()
        menu.remove()
      })
      menu.appendChild(btn)
    })

    document.body.appendChild(menu)
    const closeMenu = () => menu.remove()
    setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 0)
  }
}

customElements.define('slide-panel', SlidePanelElement)
