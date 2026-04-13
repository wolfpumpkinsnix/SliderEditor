import { store } from '../../state/store.ts'
import { currentSlide, presentation, selectedElementId, findElement } from '../../state/signalsStore.ts'
import { SlideRendererElement } from '../slide_renderer/slide_renderer.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import slideCanvasHtml from './slide_canvas.html?raw'

@Component({
  tag: 'slide-canvas',
  template: slideCanvasHtml
})
export class SlideCanvasElement extends EffectComponent {
  private _renderer: SlideRendererElement | null = null
  private _resizeObserver: ResizeObserver | null = null

  connectedCallback() {
    this.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:1;overflow:hidden;background:#050d1a;position:relative;'
    this.render()

    this._renderer = this.querySelector('slide-renderer') as SlideRendererElement
    this._renderer.editMode = true

    this.setupListeners()

    this.addEffect(() => {
      this.update()
    })

    this._resizeObserver = new ResizeObserver(() => this.scale())
    this._resizeObserver.observe(this)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._resizeObserver?.disconnect()
  }

  private setupListeners() {
    const viewport = this.querySelector('.slide-viewport')!

    viewport.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const el = target.closest('[data-element-id]') as HTMLElement | null
      if (el) {
        store.selectElement(el.dataset['elementId'] ?? null)
      } else {
        store.selectElement(null)
      }
    })

    viewport.addEventListener('dblclick', (e) => {
      const target = e.target as HTMLElement
      const el = target.closest('[data-element-id]') as HTMLElement | null
      if (!el) return
      const elementId = el.dataset['elementId']
      if (!elementId) return
      this.startInlineEdit(el, elementId)
    })
  }

  private scale() {
    const wrapper = this.querySelector<HTMLElement>('#scale-wrapper')
    if (!wrapper) return
    const hostW = this.clientWidth - 48
    const hostH = this.clientHeight - 48
    const scaleX = hostW / 1920
    const scaleY = hostH / 1080
    const s = Math.min(scaleX, scaleY, 1)

    wrapper.style.transform = `scale(${s})`
    wrapper.style.width = `1920px`
    wrapper.style.height = `1080px`
    wrapper.style.marginLeft = `-${(1920 - 1920 * s) / 2}px`
    wrapper.style.marginRight = `-${(1920 - 1920 * s) / 2}px`
    wrapper.style.marginTop = `-${(1080 - 1080 * s) / 2}px`
    wrapper.style.marginBottom = `-${(1080 - 1080 * s) / 2}px`
  }

  private update() {
    const slide = currentSlide.value
    if (!this._renderer || !slide) return

    this._renderer.theme = presentation.value.theme
    this._renderer.slide = slide
    this._renderer.isActive = true
    this._renderer.editMode = true
    this._renderer.selectedElementId = selectedElementId.value

    this.scale()
  }

  private startInlineEdit(domEl: HTMLElement, elementId: string) {
    const slideEl = findElement(currentSlide.value!, elementId)
    if (!slideEl) return
    const textComp = slideEl.components.find(c => c.type === 'text') as any
    if (!textComp) return

    domEl.contentEditable = 'true'
    domEl.focus()

    const range = document.createRange()
    range.selectNodeContents(domEl)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    const controller = new AbortController()
    const { signal } = controller

    const commit = () => {
      domEl.contentEditable = 'false'
      controller.abort()
      const newContent = domEl.textContent ?? ''
      store.updateElement(elementId, el => {
        const tc = el.components.find(c => c.type === 'text')
        if (tc && tc.type === 'text') {
          tc.content = newContent
        }
      })
    }

    domEl.addEventListener('blur', commit, { once: true, signal })
    domEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        domEl.contentEditable = 'false'
        controller.abort()
      }
      if (e.key === 'Enter' && !e.shiftKey && textComp.fontSize !== 'body' && textComp.fontSize !== 'small') {
        e.preventDefault()
        domEl.blur()
      }
    }, { signal })
  }
}
