import type { Slide, SlideElement, CardElement, Theme } from '../../models/types.ts'
import { Component } from '../../lib/decorators.ts'
import slideRendererHtml from './slide_renderer.html?raw'
import slideRendererCss from './slide_renderer.css?raw'

/**
 * Web Component for live rendering (editor + presentation mode)
 */
@Component({
  tag: 'slide-renderer',
  template: slideRendererHtml,
  styles: slideRendererCss
})
export class SlideRendererElement extends HTMLElement {
  private _slide: Slide | null = null
  private _editMode = false
  private _selectedElementId: string | null = null
  private _renderScheduled = false
  private _isStatic = false
  private _lastRenderKey: string | null = null

  set slide(s: Slide) {
    this._slide = s
    this.scheduleRender()
  }

  set theme(_t: Theme) {
    this.scheduleRender()
  }

  set isActive(v: boolean) {
    this.classList.toggle('active', v)
  }

  set editMode(v: boolean) {
    this._editMode = v
    this.scheduleRender()
  }

  get editMode(): boolean { return this._editMode }

  set selectedElementId(id: string | null) {
    this._selectedElementId = id
    this.scheduleRender()
  }

  set isStatic(v: boolean) {
    this._isStatic = v
    this.scheduleRender()
  }

  private scheduleRender() {
    if (this._renderScheduled) return
    this._renderScheduled = true
    queueMicrotask(() => {
      this._renderScheduled = false
      this.render()
    })
  }

  /** Force any pending scheduled render to run immediately. */
  flush() {
    if (this._renderScheduled) {
      this._renderScheduled = false
      this.render()
    }
  }

  connectedCallback() {
    this.render()
  }

  render() {
    try {
      if (!this._slide) return
      const slide = this._slide

      // Dirty-flag: skip full DOM rebuild if nothing changed
      const renderKey = JSON.stringify(slide) + '|' + this._editMode + '|' + this._selectedElementId + '|' + this._isStatic
      if (renderKey === this._lastRenderKey) return
      this._lastRenderKey = renderKey

      const constructor = this.constructor as any
      const template = constructor.template as HTMLTemplateElement
      if (!template) return

      this.replaceChildren(template.content.cloneNode(true))

    // 1. Render Blobs
    const mesh = this.querySelector('.gradient-mesh')!
    const blobs = slide.background.blobs
    const blobFrags = document.createDocumentFragment()
    blobs.forEach(b => {
      const blob = document.createElement('div')
      blob.className = 'blob'
      const pos = [
        b.top ? `top:${b.top}` : '',
        b.bottom ? `bottom:${b.bottom}` : '',
        b.left ? `left:${b.left}` : '',
        b.right ? `right:${b.right}` : '',
      ].filter(Boolean).join(';')
      blob.style.cssText = `width:${b.width}px;height:${b.height}px;${pos};background:${b.color};opacity:${b.opacity};`
      blobFrags.appendChild(blob)
    })
    mesh.replaceChildren(blobFrags)

    // 2. Render Particles
    if (slide.hasParticles) {
      const container = this.querySelector('.particles-container')!
      if (!this._isStatic) {
        // Only init particles if not static
        const canvas = document.createElement('canvas')
        canvas.className = 'particle-canvas'
        canvas.style.cssText = 'position:absolute;inset:0;z-index:1;'
        container.replaceChildren(canvas)
        initParticles(canvas)
      } else {
        container.replaceChildren()
      }
    }

    // 3. Render Elements
    const content = this.querySelector('.slide-content')!
    if (slide.layout === 'center') content.classList.add('text-center')

    slide.elements.forEach(el => {
      content.appendChild(this.renderElement(el))
    })

    // 4. Editor/Static overrides — applied after every render so new elements are correct
    if (this._isStatic) {
      this.classList.add('static')
    } else {
      this.classList.remove('static')
    }

    if (this._editMode || this._isStatic) {
      this.querySelectorAll<HTMLElement>('.reveal').forEach(el => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
    }

    if (this._editMode) {
      this.querySelectorAll<HTMLElement>('[data-element-id]').forEach(el => {
        el.classList.toggle('selected', el.dataset['elementId'] === this._selectedElementId)
      })
    }
    } catch (err) {
      console.error('SlideRenderer: render failure', err)
    }
  }

  private renderElement(el: SlideElement): HTMLElement {
    let node: HTMLElement
    switch (el.type) {
      case 'label': {
        node = this.cloneTemplate('tpl-label')
        node.textContent = el.content
        break
      }
      case 'heading': {
        node = this.cloneTemplate('tpl-heading')
        const tag = el.level === 1 ? 'h1' : 'h2'
        const newNode = document.createElement(tag)
        newNode.className = node.className // Copy classes from template
        node.replaceWith(newNode)
        node = newNode
        
        node.textContent = el.content
        const sizeClass = el.level === 1
          ? ['font-display', 'text-[4.5rem]', 'font-black', 'tracking-tight', 'mb-4']
          : ['font-display', 'text-[3rem]', 'font-bold', 'mb-6']
        node.classList.add(...sizeClass)
        if (el.gradient) {
          node.classList.add('bg-linear-to-br', 'from-accent-1', 'via-accent-2', 'to-accent-1', 'bg-clip-text', 'text-transparent')
        }
        break
      }
      case 'text': {
        node = this.cloneTemplate('tpl-text')
        node.textContent = el.content
        if (el.align === 'center') node.classList.add('mx-auto', 'text-center')
        const maxWClass = el.maxWidth ? `max-w-[${el.maxWidth}]` : 'max-w-3xl'
        node.classList.add(maxWClass)
        const colorClass = el.variant === 'muted' ? 'text-text-muted' : el.variant === 'secondary' ? 'text-text-secondary' : ''
        if (colorClass) node.classList.add(colorClass)
        break
      }
      case 'list': {
        node = this.cloneTemplate('tpl-list')
        const colorClass = (el.variant ?? 'muted') === 'muted' ? 'text-text-muted' : 'text-text-secondary'
        const listClass = el.style === 'numbered' ? 'list-decimal' : 'list-disc'
        node.classList.add(colorClass, listClass)
        el.items.forEach(item => {
          const li = document.createElement('li')
          li.textContent = item
          node.appendChild(li)
        })
        break
      }
      case 'grid': {
        node = this.cloneTemplate('tpl-grid')
        const colClass = el.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
        node.classList.add(colClass)
        if (el.gap !== undefined) node.style.gap = `${el.gap}px`
        el.children.forEach(c => {
          node.appendChild(this.renderCardElement(c))
        })
        break
      }
      case 'card': {
        node = this.renderCardElement(el)
        break
      }
      case 'emoji': {
        node = this.cloneTemplate('tpl-emoji')
        node.textContent = el.content
        node.style.fontSize = `${el.size}px`
        if (el.animated && !this._isStatic) node.classList.add('animate-[float_3s_ease-in-out_infinite]')
        break
      }
      default:
        node = document.createElement('div')
    }

    if (this._editMode) {
      node.dataset['elementId'] = el.id
    }
    return node
  }

  private renderCardElement(card: CardElement): HTMLElement {
    const tplId = card.variant === 'metric' ? 'tpl-card-metric' : 'tpl-card-glass'
    const node = this.cloneTemplate(tplId)

    const title = node.querySelector('.card-title')
    if (title) title.textContent = card.title ?? ''

    const body = node.querySelector('.card-body')
    if (body) body.textContent = card.body ?? ''

    const icon = node.querySelector('.card-icon')
    if (icon) icon.textContent = card.icon ?? ''

    const badge = node.querySelector('.card-badge')
    if (badge) badge.textContent = card.numberBadge !== undefined ? String(card.numberBadge) : ''

    const list = node.querySelector('.card-list')
    if (list && card.listItems) {
      card.listItems.forEach(item => {
        const li = document.createElement('li')
        li.textContent = item
        list.appendChild(li)
      })
    }

    return node
  }

  private getTemplate(id: string): HTMLTemplateElement {
    return this.querySelector(`#${id}`) as HTMLTemplateElement
  }

  private cloneTemplate(id: string): HTMLElement {
    return (this.getTemplate(id).content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement
  }
}

function initParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = 1920
  canvas.height = 1080
  const count = 55
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 2.5 + 0.8,
    alpha: Math.random() * 0.35 + 0.1,
  }))

  let visible = true
  let rafId = 0

  function animate() {
    if (!visible) return
    ctx!.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.vx *= 0.98; p.vy *= 0.98
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0
      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(6,182,212,${p.alpha})`
      ctx!.fill()
    })
    rafId = requestAnimationFrame(animate)
  }

  // Pause animation when canvas is off-screen; resume when visible
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (!visible) {
          visible = true
          animate()
        }
      } else {
        visible = false
        cancelAnimationFrame(rafId)
      }
    }
    // Stop observing once disconnected
    if (!canvas.isConnected) observer.disconnect()
  }, { threshold: 0 })

  observer.observe(canvas)
  animate()
}
