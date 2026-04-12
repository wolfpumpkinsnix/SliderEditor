import { store } from '../../state/store.ts'
import { presentation, currentSlideIndex } from '../../state/signalsStore.ts'
import type { Slide } from '../../models/types.ts'
import { blankContentSlide, blankTitleSlide } from '../../models/defaults.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import slidePanelHtml from './slide_panel.html?raw'

import '../slide_thumbnail/slide_thumbnail.ts'
import type { SlideThumbnailElement } from '../slide_thumbnail/slide_thumbnail.ts'

@Component({
  tag: 'slide-panel',
  template: slidePanelHtml
})
export class SlidePanelElement extends EffectComponent {
  connectedCallback() {
    this.render()
    this.setupListeners()

    this.addEffect(() => {
      this.updateSlidesList(presentation.value.slides, currentSlideIndex.value)
    })
  }

  private setupListeners() {
    this.querySelector('[data-action="add-content"]')?.addEventListener('click', () => {
      store.addSlide(blankContentSlide(), store.currentSlideIndex)
    })

    const list = this.querySelector('#slides-list')!

    // Event delegation for clicks and context menus
    list.addEventListener('click', (e) => {
      const thumb = (e.target as HTMLElement).closest('slide-thumbnail') as SlideThumbnailElement | null
      if (thumb) {
        const index = Number(thumb.dataset['index'])
        store.goToSlide(index)
      }
    })

    list.addEventListener('contextmenu', (e) => {
      const thumb = (e.target as HTMLElement).closest('slide-thumbnail') as SlideThumbnailElement | null
      if (thumb) {
        e.preventDefault()
        const index = Number(thumb.dataset['index'])
        this.showContextMenu(e as MouseEvent, index)
      }
    })
  }

  private updateSlidesList(slides: Slide[], activeIndex: number) {
    const list = this.querySelector('#slides-list')
    if (!list) return

    const children = Array.from(list.children) as SlideThumbnailElement[]

    if (children.length !== slides.length) {
      const frag = document.createDocumentFragment()
      slides.forEach((slide, i) => {
        const thumb = document.createElement('slide-thumbnail') as SlideThumbnailElement
        thumb.dataset['index'] = String(i)
        thumb.slide = slide
        thumb.theme = presentation.value.theme
        thumb.index = i
        thumb.active = i === activeIndex
        frag.appendChild(thumb)
      })
      list.replaceChildren(frag)
    } else {
      children.forEach((thumb, i) => {
        thumb.slide = slides[i]
        if (thumb.active !== (i === activeIndex)) thumb.active = i === activeIndex
        if (Number(thumb.dataset['index']) !== i) {
          thumb.index = i
          thumb.dataset['index'] = String(i)
        }
      })
    }
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
      { label: 'Move down', action: () => index < presentation.value.slides.length - 1 && store.moveSlide(index, index + 1) },
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
