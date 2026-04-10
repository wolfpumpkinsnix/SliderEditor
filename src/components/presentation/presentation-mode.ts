import { store } from '../../state/store.ts'
import { SlideRendererElement } from './slide-renderer.ts'

export class PresentationModeElement extends HTMLElement {
  private _current = 0
  private _total = 0
  private _onStateChanged = () => this.onStoreUpdate()
  private _onKeyDown = (e: KeyboardEvent) => this.handleKey(e)
  private _touchStartX = 0

  connectedCallback() {
    store.addEventListener('state-changed', this._onStateChanged)
    document.addEventListener('keydown', this._onKeyDown)

    this.style.cssText = `
      position: fixed; inset: 0; z-index: 1000;
      background: #0f172a;
      display: flex; flex-direction: column;
    `

    this.buildDeck()

    // Request fullscreen
    this.requestFullscreen?.().catch(() => {})

    // Touch support
    this.addEventListener('touchstart', (e: TouchEvent) => { this._touchStartX = e.touches[0].clientX })
    this.addEventListener('touchend', (e: TouchEvent) => {
      const diff = this._touchStartX - e.changedTouches[0].clientX
      if (Math.abs(diff) > 50) this.navigate(diff > 0 ? 1 : -1)
    })
  }

  disconnectedCallback() {
    store.removeEventListener('state-changed', this._onStateChanged)
    document.removeEventListener('keydown', this._onKeyDown)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  private onStoreUpdate() {
    if (store.mode !== 'present') {
      this.remove()
    }
  }

  private buildDeck() {
    const { presentation } = store
    this._total = presentation.slides.length
    this._current = store.currentSlideIndex

    this.innerHTML = `
      <div class="mouse-spotlight" id="pres-spotlight" style="position:fixed;inset:0;z-index:99;pointer-events:none;"></div>
      <div id="pres-deck" style="flex:1;position:relative;overflow:hidden;"></div>
      <div class="nav-controls" id="pres-nav">
        <button class="nav-btn" id="pres-prev">&#8249;</button>
        <div class="slide-dots" id="pres-dots"></div>
        <button class="nav-btn" id="pres-next">&#8250;</button>
        <span class="slide-counter" id="pres-counter">1 / ${this._total}</span>
        <button class="nav-btn" id="pres-close" title="Exit (Esc)" style="margin-left:8px;font-size:14px;">✕</button>
      </div>
    `

    const deck = this.querySelector('#pres-deck')!
    presentation.slides.forEach((slide, i) => {
      const renderer = document.createElement('slide-renderer') as SlideRendererElement
      renderer.style.cssText = `
        display: block;
        position: absolute;
        inset: 0;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 0.7s ease, transform 0.7s ease;
        pointer-events: none;
      `
      renderer.theme = presentation.theme
      renderer.slide = slide
      renderer.dataset['slideIndex'] = String(i)
      deck.appendChild(renderer)
    })

    // Dots
    const dotsContainer = this.querySelector('#pres-dots')!
    for (let i = 0; i < this._total; i++) {
      const dot = document.createElement('div')
      dot.className = 'dot'
      dot.addEventListener('click', () => this.goTo(i))
      dotsContainer.appendChild(dot)
    }

    this.querySelector('#pres-prev')?.addEventListener('click', () => this.navigate(-1))
    this.querySelector('#pres-next')?.addEventListener('click', () => this.navigate(1))
    this.querySelector('#pres-close')?.addEventListener('click', () => this.exit())

    // Mouse spotlight
    const spotlight = this.querySelector<HTMLElement>('#pres-spotlight')
    document.addEventListener('mousemove', (e) => {
      if (spotlight) {
        spotlight.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(6,182,212,0.10), transparent 40%)`
      }
    })

    this.goTo(this._current, false)
  }

  private goTo(index: number, animate = true) {
    if (index < 0 || index >= this._total) return

    const deck = this.querySelector('#pres-deck')!
    const renderers = deck.querySelectorAll<SlideRendererElement>('slide-renderer')

    // Hide current
    renderers.forEach((r, i) => {
      const isTarget = i === index
      r.style.opacity = isTarget ? '1' : '0'
      r.style.transform = isTarget ? 'scale(1)' : 'scale(0.95)'
      r.style.pointerEvents = isTarget ? 'all' : 'none'

      if (isTarget) {
        r.isActive = true
      }
    })

    this._current = index

    if (animate) {
      // Trigger reveal animations
      const activeRenderer = renderers[index]
      if (activeRenderer) this.animateReveal(activeRenderer)
    } else {
      // Show all reveals immediately on first load
      const activeRenderer = renderers[index]
      if (activeRenderer) {
        activeRenderer.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        })
      }
    }

    // Update dots
    this.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === index)
    })

    // Update counter
    const counter = this.querySelector('#pres-counter')
    if (counter) counter.textContent = `${index + 1} / ${this._total}`
  }

  private animateReveal(container: HTMLElement) {
    const reveals = container.querySelectorAll<HTMLElement>('.reveal')
    reveals.forEach((el, i) => {
      el.style.transition = 'none'
      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'
      // Force reflow
      el.offsetHeight
      const delay = i * 0.08
      el.style.transition = `opacity 0.35s ease ${delay}s, transform 0.35s ease ${delay}s`
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }

  private navigate(dir: number) {
    let next = this._current + dir
    if (next < 0) next = this._total - 1
    if (next >= this._total) next = 0
    this.goTo(next)
  }

  private handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); this.navigate(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.navigate(-1) }
    if (e.key === 'Escape') this.exit()
    if (e.key === 'Home') this.goTo(0)
    if (e.key === 'End') this.goTo(this._total - 1)
  }

  private exit() {
    store.setMode('edit')
  }
}

customElements.define('presentation-mode', PresentationModeElement)
