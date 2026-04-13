import type { Slide, Entity, Component as EntityComponent, Theme } from '../../models/types.ts'
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

    // 3. Render Entities
    const content = this.querySelector('.slide-content')!
    if (slide.layout === 'center') content.classList.add('text-center')

    slide.entities.forEach(el => {
      content.appendChild(this.renderEntity(el))
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

  private renderEntity(entity: Entity): HTMLElement {
    const node = document.createElement('div')
    node.className = 'entity'
    
    // Editor metadata
    if (this._editMode) {
      node.dataset['elementId'] = entity.id
    }

    // Apply Components
    entity.components.forEach(comp => {
      this.applyComponent(node, comp)
    })

    // Render Children
    if (entity.children && entity.children.length > 0) {
      entity.children.forEach(child => {
        node.appendChild(this.renderEntity(child))
      })
    }

    return node
  }

  private applyComponent(node: HTMLElement, comp: EntityComponent) {
    switch (comp.type) {
      case 'text': {
        const textNode = document.createElement(this.getTextTag(comp.fontSize))
        textNode.textContent = comp.content
        textNode.className = 'comp-text'
        
        // Font size classes
        const sizeClasses = this.getTextSizeClasses(comp.fontSize)
        textNode.classList.add(...sizeClasses)

        if (comp.fontWeight === 'bold') textNode.classList.add('font-bold')
        if (comp.fontWeight === 'black') textNode.classList.add('font-black')
        
        if (comp.gradient) {
          textNode.classList.add('bg-linear-to-br', 'from-accent-1', 'via-accent-2', 'to-accent-1', 'bg-clip-text', 'text-transparent')
        }

        if (comp.align === 'center') textNode.classList.add('mx-auto', 'text-center')
        if (comp.maxWidth) textNode.style.maxWidth = comp.maxWidth
        
        if (comp.variant === 'muted') textNode.classList.add('text-text-muted')
        else if (comp.variant === 'secondary') textNode.classList.add('text-text-secondary')

        node.appendChild(textNode)
        break
      }

      case 'background': {
        node.classList.add('comp-background')
        if (comp.variant === 'glass') {
          node.classList.add('bg-glass-bg', 'border', 'border-glass-border', 'backdrop-blur-xl')
        } else if (comp.variant === 'metric') {
          node.classList.add('bg-white/5', 'border', 'border-white/10')
        }
        
        if (comp.color) node.style.backgroundColor = comp.color
        if (comp.rounded) node.classList.add('rounded-2xl')
        if (comp.padding) node.style.padding = comp.padding
        break
      }

      case 'layout': {
        node.classList.add('comp-layout')
        if (comp.layoutType === 'grid') {
          node.classList.add('grid')
          if (comp.columns === 3) node.classList.add('grid-cols-3')
          else node.classList.add('grid-cols-2')
          
          if (comp.gap !== undefined) node.style.gap = `${comp.gap}px`
        } else {
          node.classList.add('flex')
          if (comp.direction === 'column') node.classList.add('flex-col')
          if (comp.alignItems === 'center') node.classList.add('items-center')
        }
        break
      }

      case 'icon': {
        const iconNode = document.createElement('div')
        iconNode.className = 'comp-icon'
        iconNode.textContent = comp.value
        if (comp.size) iconNode.style.fontSize = `${comp.size}px`
        if (comp.animated && !this._isStatic) {
          iconNode.classList.add('animate-[float_3s_ease-in-out_infinite]')
        }
        node.appendChild(iconNode)
        break
      }

      case 'list': {
        const listNode = document.createElement(comp.style === 'numbered' ? 'ol' : 'ul')
        listNode.className = 'comp-list'
        const listClass = comp.style === 'numbered' ? 'list-decimal' : 'list-disc'
        const colorClass = (comp.variant ?? 'muted') === 'muted' ? 'text-text-muted' : 'text-text-secondary'
        listNode.classList.add(listClass, colorClass, 'pl-6', 'space-y-1')
        
        comp.items.forEach(item => {
          const li = document.createElement('li')
          li.textContent = item
          listNode.appendChild(li)
        })
        node.appendChild(listNode)
        break
      }
    }
  }

  private getTextTag(size?: string): string {
    if (size === 'h1') return 'h1'
    if (size === 'h2') return 'h2'
    return 'p'
  }

  private getTextSizeClasses(size?: string): string[] {
    switch (size) {
      case 'h1': return ['font-display', 'text-[4.5rem]', 'tracking-tight', 'mb-4', 'leading-tight']
      case 'h2': return ['font-display', 'text-[3rem]', 'mb-6', 'leading-tight']
      case 'label': return ['text-sm', 'uppercase', 'tracking-widest', 'mb-2']
      case 'body': return ['text-xl', 'leading-relaxed']
      case 'small': return ['text-base']
      default: return ['text-lg']
    }
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
