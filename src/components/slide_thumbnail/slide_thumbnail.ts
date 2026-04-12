import { SlideRendererElement } from '../slide_renderer/slide_renderer.ts'
import type { Slide, Theme } from '../../models/types.ts'
import { duplicateSlide, deleteSlide, presentation } from '../../state/signalsStore.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import slideThumbnailHtml from './slide_thumbnail.html?raw'

const THUMB_SCALE = 160 / 1920

@Component({
  tag: 'slide-thumbnail',
  template: slideThumbnailHtml
})
export class SlideThumbnailElement extends EffectComponent {
  private _slide: Slide | null = null
  private _theme: Theme | null = null
  private _index = 0
  private _active = false
  private _renderer: SlideRendererElement | null = null
  private _contentScheduled = false

  connectedCallback() {
    this.style.cssText = `
      display: block;
      position: relative;
      cursor: pointer;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
    `
    this.render()
  }

  get slide(): Slide | null { return this._slide }
  get active(): boolean { return this._active }

  set slide(s: Slide) { this._slide = s; this.scheduleRenderContent() }
  set theme(t: Theme) { this._theme = t; this.scheduleRenderContent() }
  set index(i: number) { this._index = i; this.scheduleRenderContent() }
  set active(v: boolean) {
    this._active = v
    this.updateActiveStyle()
  }

  private scheduleRenderContent() {
    if (this._contentScheduled) return
    this._contentScheduled = true
    queueMicrotask(() => {
      this._contentScheduled = false
      this.renderContent()
    })
  }

  private updateActiveStyle() {
    this.style.outline = this._active ? '2px solid #06B6D4' : '2px solid rgba(148,163,184,0.2)'
    this.style.outlineOffset = this._active ? '2px' : '0'
  }

  protected render() {
    const thumbW = 160
    const thumbH = Math.round(1080 * THUMB_SCALE)

    this.style.width = `${thumbW}px`
    this.style.height = `${thumbH}px`

    super.render()

    this._renderer = this.querySelector('slide-renderer') as SlideRendererElement
    if (this._renderer) {
      this._renderer.isStatic = true
    }

    this.updateActiveStyle()
    this.wireActions()
    this.renderContent()
  }

  private wireActions() {
    this.querySelector('.thumb-actions')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
      if (!btn) return
      if (btn.dataset['action'] === 'duplicate') {
        duplicateSlide(this._index)
      } else if (btn.dataset['action'] === 'delete') {
        if (presentation.value.slides.length > 1) deleteSlide(this._index)
      }
    })
  }

  private renderContent() {
    if (!this._renderer || !this._slide || !this._theme) return
    this._renderer.theme = this._theme
    this._renderer.slide = this._slide
    this._renderer.isActive = true

    // Ensure render is completed synchronously for accurate preview
    this._renderer.flush()

    // Update index badge
    const badge = this.querySelector<HTMLElement>('.thumb-badge')
    if (badge) badge.textContent = String(this._index + 1)
  }
}
