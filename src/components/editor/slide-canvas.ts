import { store } from '../../state/store.ts'
import { SlideRendererElement } from '../presentation/slide-renderer.ts'

export class SlideCanvasElement extends HTMLElement {
  private _renderer: SlideRendererElement | null = null
  private _onStateChanged = () => this.update()
  private _resizeObserver: ResizeObserver | null = null

  connectedCallback() {
    this.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:1;overflow:hidden;background:#050d1a;position:relative;'
    store.addEventListener('state-changed', this._onStateChanged)

    const wrapper = document.createElement('div')
    wrapper.id = 'scale-wrapper'
    wrapper.style.cssText = 'position:relative;transform-origin:center center;'

    const viewport = document.createElement('div')
    viewport.style.cssText = 'width:1920px;height:1080px;position:relative;overflow:hidden;background:#0f172a;border-radius:4px;box-shadow:0 24px 64px rgba(0,0,0,0.7);'

    this._renderer = document.createElement('slide-renderer') as SlideRendererElement
    this._renderer.editMode = true
    this._renderer.style.cssText = 'display:block;width:100%;height:100%;position:relative;'
    viewport.appendChild(this._renderer)

    // Selection overlay click handler
    viewport.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const el = target.closest('[data-element-id]') as HTMLElement | null
      if (el) {
        store.selectElement(el.dataset['elementId'] ?? null)
      } else {
        store.selectElement(null)
      }
    })

    // Double-click to edit text
    viewport.addEventListener('dblclick', (e) => {
      const target = e.target as HTMLElement
      const el = target.closest('[data-element-id]') as HTMLElement | null
      if (!el) return
      const elementId = el.dataset['elementId']
      if (!elementId) return
      this.startInlineEdit(el, elementId)
    })

    wrapper.appendChild(viewport)
    this.appendChild(wrapper)

    this._resizeObserver = new ResizeObserver(() => this.scale())
    this._resizeObserver.observe(this)

    this.update()
  }

  disconnectedCallback() {
    store.removeEventListener('state-changed', this._onStateChanged)
    this._resizeObserver?.disconnect()
  }

  private scale() {
    const wrapper = this.querySelector<HTMLElement>('#scale-wrapper')
    if (!wrapper) return
    const hostW = this.clientWidth - 64
    const hostH = this.clientHeight - 64
    const scaleX = hostW / 1920
    const scaleY = hostH / 1080
    const s = Math.min(scaleX, scaleY, 1)
    wrapper.style.transform = `scale(${s})`
    wrapper.style.width = `${1920 * s}px`
    wrapper.style.height = `${1080 * s}px`
  }

  private update() {
    const { currentSlide, presentation, selectedElementId } = store
    if (!this._renderer || !currentSlide) return
    this._renderer.theme = presentation.theme
    this._renderer.slide = currentSlide
    this._renderer.isActive = true
    this._renderer.editMode = true

    // Force reveal visible in editor
    this._renderer.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
      el.style.opacity = '1'
      el.style.transform = 'none'
    })

    // Update selection highlight
    this._renderer.querySelectorAll<HTMLElement>('[data-element-id]').forEach(el => {
      el.classList.toggle('selected', el.dataset['elementId'] === selectedElementId)
    })

    this.scale()
  }

  private startInlineEdit(domEl: HTMLElement, elementId: string) {
    const slideEl = store.currentSlide?.elements.find(e => e.id === elementId)
    if (!slideEl) return
    if (slideEl.type !== 'text' && slideEl.type !== 'heading' && slideEl.type !== 'label') return

    // Make element contenteditable
    domEl.contentEditable = 'true'
    domEl.focus()

    // Select all text
    const range = document.createRange()
    range.selectNodeContents(domEl)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    const commit = () => {
      domEl.contentEditable = 'false'
      const newContent = domEl.textContent ?? ''
      store.updateElement(elementId, el => {
        if (el.type === 'text' || el.type === 'heading' || el.type === 'label') {
          el.content = newContent
        }
      })
    }

    domEl.addEventListener('blur', commit, { once: true })
    domEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        domEl.contentEditable = 'false'
        domEl.removeEventListener('blur', commit)
      }
      if (e.key === 'Enter' && !e.shiftKey && slideEl.type !== 'text') {
        e.preventDefault()
        domEl.blur()
      }
    })
  }
}

customElements.define('slide-canvas', SlideCanvasElement)
