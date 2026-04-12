import { store } from '../../state/store.ts'
import { mode, presentation, currentSlideIndex } from '../../state/signalsStore.ts'
import { SlideRendererElement } from '../slide_renderer/slide_renderer.ts'
import { Component } from '../../lib/decorators.ts'
import { EffectComponent } from '../../lib/effect_component.ts'
import presentationModeHtml from './presentation_mode.html?raw'

@Component({
  tag: 'presentation-mode',
  template: presentationModeHtml
})
export class PresentationModeElement extends EffectComponent {
  private _current = 0
  private _total = 0
  private _touchStartX = 0
  private _onKeyDown: ((e: KeyboardEvent) => void) | null = null
  private _onMouseMove: ((e: MouseEvent) => void) | null = null

  connectedCallback() {
    this.style.cssText = `
      position: fixed; inset: 0; z-index: 1000;
      background: #0f172a;
      display: flex; flex-direction: column;
    `
    this.render()
    this.buildDeck()

    this.addEffect(() => {
      if (mode.value !== 'present') {
        this.remove()
      }
    })

    this.setupListeners()
    this.requestFullscreen?.().catch(() => {})
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown)
    if (this._onMouseMove) document.removeEventListener('mousemove', this._onMouseMove)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  private setupListeners() {
    this._onKeyDown = (e: KeyboardEvent) => this.handleKey(e)
    document.addEventListener('keydown', this._onKeyDown)

    // Touch support
    this.addEventListener('touchstart', (e: TouchEvent) => { this._touchStartX = e.touches[0].clientX })
    this.addEventListener('touchend', (e: TouchEvent) => {
      const diff = this._touchStartX - e.changedTouches[0].clientX
      if (Math.abs(diff) > 50) this.navigate(diff > 0 ? 1 : -1)
    })

    this.querySelector('#pres-prev')?.addEventListener('click', () => this.navigate(-1))
    this.querySelector('#pres-next')?.addEventListener('click', () => this.navigate(1))
    this.querySelector('#pres-close')?.addEventListener('click', () => this.exit())

    // Mouse spotlight
    const spotlight = this.querySelector<HTMLElement>('#pres-spotlight')
    this._onMouseMove = (e: MouseEvent) => {
      if (spotlight) {
        spotlight.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(6,182,212,0.10), transparent 40%)`
      }
    }
    document.addEventListener('mousemove', this._onMouseMove)

    // Dots delegation
    this.querySelector('#pres-dots')?.addEventListener('click', (e) => {
      const dot = (e.target as HTMLElement).closest('.dot') as HTMLElement
      if (dot) {
        this.goTo(Number(dot.dataset['index']))
      }
    })
  }

  private buildDeck() {
    const pres = presentation.value
    this._total = pres.slides.length
    this._current = currentSlideIndex.value

    const deck = this.querySelector('#pres-deck')!
    const rendererTpl = this.getTemplate('tpl-deck-renderer')

    pres.slides.forEach((slide, i) => {
      const renderer = (rendererTpl.content.cloneNode(true) as DocumentFragment).firstElementChild as SlideRendererElement
      deck.appendChild(renderer)

      renderer.theme = pres.theme
      renderer.slide = slide
      renderer.dataset['slideIndex'] = String(i)
    })

    // Dots
    const dotsContainer = this.querySelector('#pres-dots')!
    const dotTpl = this.getTemplate('tpl-dot')
    for (let i = 0; i < this._total; i++) {
      const dot = (dotTpl.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement
      dot.dataset['index'] = String(i)
      dotsContainer.appendChild(dot)
    }

    this.goTo(this._current, false)
  }

  private goTo(index: number, animate = true) {
    if (index < 0 || index >= this._total) return

    const deck = this.querySelector('#pres-deck')!
    const renderers = deck.querySelectorAll<SlideRendererElement>('slide-renderer')

    renderers.forEach((r, i) => {
      const isTarget = i === index
      r.style.opacity = isTarget ? '1' : '0'
      r.style.transform = isTarget ? 'scale(1)' : 'scale(0.95)'
      r.style.pointerEvents = isTarget ? 'all' : 'none'

      if (isTarget) {
        r.isActive = true
        if (animate) {
          this.animateReveal(r)
        } else {
          r.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          })
        }
      }
    })

    this._current = index

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
      el.offsetHeight // force reflow
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
