import { SlideRendererElement } from '../presentation/slide-renderer.ts'
import type { Slide, Theme } from '../../models/types.ts'

const THUMB_SCALE = 160 / 1920

export class SlideThumbnailElement extends HTMLElement {
  private _slide: Slide | null = null
  private _theme: Theme | null = null
  private _index = 0
  private _active = false
  private _renderer: SlideRendererElement | null = null

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

  set slide(s: Slide) { this._slide = s; this.renderContent() }
  set theme(t: Theme) { this._theme = t; this.renderContent() }
  set index(i: number) { this._index = i; this.renderContent() }
  set active(v: boolean) {
    this._active = v
    this.updateActiveStyle()
  }

  private updateActiveStyle() {
    this.style.outline = this._active ? '2px solid #06B6D4' : '2px solid rgba(148,163,184,0.2)'
    this.style.outlineOffset = this._active ? '2px' : '0'
  }

  private render() {
    const thumbW = 160
    const thumbH = Math.round(1080 * THUMB_SCALE)

    this.style.width = `${thumbW}px`
    this.style.height = `${thumbH}px`

    const wrapper = document.createElement('div')
    wrapper.style.cssText = `
      width: 1920px;
      height: 1080px;
      transform: scale(${THUMB_SCALE});
      transform-origin: top left;
      position: absolute;
      top: 0; left: 0;
      pointer-events: none;
    `

    this._renderer = document.createElement('slide-renderer') as SlideRendererElement
    this._renderer.style.cssText = 'display:block;width:100%;height:100%;position:relative;'
    wrapper.appendChild(this._renderer)
    this.appendChild(wrapper)

    // Number badge
    const badge = document.createElement('div')
    badge.style.cssText = `
      position: absolute;
      bottom: 4px; left: 4px;
      background: rgba(15,23,42,0.85);
      color: #94a3b8;
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 3px;
      font-family: Inter, sans-serif;
      z-index: 10;
    `
    badge.textContent = String(this._index + 1)
    this.appendChild(badge)

    this.updateActiveStyle()
    this.renderContent()
  }

  private renderContent() {
    if (!this._renderer || !this._slide || !this._theme) return
    this._renderer.theme = this._theme
    this._renderer.slide = this._slide
    this._renderer.isActive = true
    // Force reveal elements visible in thumbnail
    this._renderer.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
    // Update index badge
    const badge = this.querySelector<HTMLElement>('div[style*="bottom: 4px"]')
    if (badge) badge.textContent = String(this._index + 1)
  }
}

customElements.define('slide-thumbnail', SlideThumbnailElement)
