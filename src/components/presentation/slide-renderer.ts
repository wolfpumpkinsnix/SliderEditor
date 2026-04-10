import type { Slide, SlideElement, CardElement, Theme } from '../../models/types.ts'

// Render a slide to an HTML string (used by export service)
export function renderSlideToHTML(slide: Slide, index: number): string {
  const isActive = index === 0 ? ' active' : ''
  return `
<div class="slide${isActive}" data-slide="${index + 1}">
  <div class="gradient-mesh">
    ${slide.background.blobs.map(blob => {
      const pos = [
        blob.top ? `top:${blob.top}` : '',
        blob.bottom ? `bottom:${blob.bottom}` : '',
        blob.left ? `left:${blob.left}` : '',
        blob.right ? `right:${blob.right}` : '',
      ].filter(Boolean).join(';')
      return `<div class="blob" style="width:${blob.width}px;height:${blob.height}px;${pos};background:${blob.color};opacity:${blob.opacity};"></div>`
    }).join('\n    ')}
  </div>
  ${slide.hasParticles ? '<canvas class="particle-canvas" style="position:absolute;inset:0;z-index:1;"></canvas>' : ''}
  <div class="content${slide.layout === 'center' ? ' text-center' : ''}">
    ${slide.elements.map(el => renderElementToHTML(el)).join('\n    ')}
  </div>
</div>`
}

function renderElementToHTML(el: SlideElement): string {
  switch (el.type) {
    case 'label':
      return `<p class="uppercase tracking-[0.3em] text-xs text-text-muted mb-3 reveal">${escHtml(el.content)}</p>`
    case 'heading': {
      const tag = el.level === 1 ? 'h1' : 'h2'
      const sizeClass = el.level === 1
        ? 'font-display text-[clamp(2.6rem,6vw,4.8rem)] font-black tracking-tight mb-4'
        : 'font-display text-[clamp(2rem,4.2vw,3rem)] font-bold mb-6'
      const colorClass = el.gradient
        ? 'bg-linear-to-br from-accent-1 via-accent-2 to-accent-1 bg-clip-text text-transparent'
        : ''
      return `<${tag} class="${sizeClass} ${colorClass} reveal">${escHtml(el.content)}</${tag}>`
    }
    case 'text': {
      const alignClass = el.align === 'center' ? 'mx-auto text-center' : ''
      const maxWClass = el.maxWidth ? `max-w-[${el.maxWidth}]` : 'max-w-3xl'
      const colorClass = el.variant === 'muted' ? 'text-text-muted' : el.variant === 'secondary' ? 'text-text-secondary' : ''
      return `<p class="text-sm ${colorClass} mb-4 ${maxWClass} ${alignClass} reveal">${escHtml(el.content)}</p>`
    }
    case 'list': {
      const colorClass = (el.variant ?? 'muted') === 'muted' ? 'text-text-muted' : 'text-text-secondary'
      const listClass = el.style === 'numbered' ? 'list-decimal' : 'list-disc'
      return `<ul class="${listClass} list-inside space-y-2 text-sm ${colorClass} reveal">${el.items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`
    }
    case 'grid': {
      const colClass = el.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
      return `<div class="grid ${colClass} gap-6 mt-2">${el.children.map(c => renderCardToHTML(c)).join('\n')}</div>`
    }
    case 'card':
      return renderCardToHTML(el)
    case 'emoji': {
      const animClass = el.animated ? 'animate-[float_3s_ease-in-out_infinite]' : ''
      return `<div class="text-[${el.size}px] mb-5 ${animClass} drop-shadow-xl mx-auto select-none">${el.content}</div>`
    }
  }
}

function renderCardToHTML(card: CardElement): string {
  const baseClass = card.variant === 'metric'
    ? 'metric-card transition reveal'
    : 'bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl p-5 reveal'

  const iconHtml = card.icon ? `<span class="text-lg">${card.icon}</span> ` : ''
  const badgeHtml = card.numberBadge !== undefined
    ? `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-1 to-accent-2 text-slate-950 text-sm font-semibold">${card.numberBadge}</div>`
    : ''

  const titleHtml = card.title
    ? `<h3 class="text-base font-semibold mb-2 flex items-center gap-2">${iconHtml || badgeHtml}${escHtml(card.title)}</h3>`
    : ''
  const bodyHtml = card.body
    ? `<p class="text-sm text-text-muted">${escHtml(card.body)}</p>`
    : ''
  const listHtml = card.listItems
    ? `<ul class="list-disc list-inside space-y-2 text-sm text-text-muted">${card.listItems.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`
    : ''

  if (badgeHtml && card.body) {
    return `<div class="${baseClass} flex gap-4 items-start">
  ${badgeHtml}
  <div>${titleHtml.replace(badgeHtml, '')}${bodyHtml}</div>
</div>`
  }

  return `<div class="${baseClass}">${titleHtml}${bodyHtml}${listHtml}</div>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Web Component for live rendering (editor + presentation mode)
export class SlideRendererElement extends HTMLElement {
  private _slide: Slide | null = null
  private _isActive = false
  private _editMode = false

  set slide(s: Slide) {
    this._slide = s
    this.render()
  }

  // Theme stored for future use (e.g. dynamic accent color updates)
  set theme(_t: Theme) {
    this.render()
  }

  set isActive(v: boolean) {
    this._isActive = v
    this.classList.toggle('active', v)
  }

  set editMode(v: boolean) {
    this._editMode = v
    this.render()
  }

  get editMode(): boolean { return this._editMode }

  connectedCallback() {
    this.classList.add('slide')
    this.render()
  }

  render() {
    if (!this._slide) return
    const slide = this._slide

    // Build blob HTML
    const blobsHTML = slide.background.blobs.map(blob => {
      const style = [
        `width:${blob.width}px`,
        `height:${blob.height}px`,
        blob.top ? `top:${blob.top}` : '',
        blob.bottom ? `bottom:${blob.bottom}` : '',
        blob.left ? `left:${blob.left}` : '',
        blob.right ? `right:${blob.right}` : '',
        `background:${blob.color}`,
        `opacity:${blob.opacity}`,
      ].filter(Boolean).join(';')
      return `<div class="blob" style="${style}"></div>`
    }).join('')

    const contentAlign = slide.layout === 'center' ? ' text-center' : ''

    this.innerHTML = `
      <div class="gradient-mesh">${blobsHTML}</div>
      ${slide.hasParticles ? '<canvas class="particle-canvas" style="position:absolute;inset:0;z-index:1;pointer-events:none;"></canvas>' : ''}
      <div class="slide-content${contentAlign}">
        ${slide.elements.map(el => this.renderElement(el)).join('')}
      </div>
    `

    if (slide.hasParticles && this._isActive) {
      const canvas = this.querySelector<HTMLCanvasElement>('.particle-canvas')
      if (canvas) initParticles(canvas)
    }
  }

  renderElement(el: SlideElement): string {
    const sel = this._editMode ? ` data-element-id="${el.id}"` : ''
    switch (el.type) {
      case 'label':
        return `<p class="slide-element uppercase tracking-[0.3em] text-xs text-text-muted mb-3 reveal"${sel}>${escHtml(el.content)}</p>`
      case 'heading': {
        const tag = el.level === 1 ? 'h1' : 'h2'
        const sizeClass = el.level === 1
          ? 'font-display text-[clamp(2.6rem,6vw,4.8rem)] font-black tracking-tight mb-4'
          : 'font-display text-[clamp(2rem,4.2vw,3rem)] font-bold mb-6'
        const colorClass = el.gradient
          ? 'bg-linear-to-br from-accent-1 via-accent-2 to-accent-1 bg-clip-text text-transparent'
          : ''
        return `<${tag} class="slide-element ${sizeClass} ${colorClass} reveal"${sel}>${escHtml(el.content)}</${tag}>`
      }
      case 'text': {
        const alignClass = el.align === 'center' ? 'mx-auto text-center' : ''
        const maxWClass = el.maxWidth ? `max-w-[${el.maxWidth}]` : 'max-w-3xl'
        const colorClass = el.variant === 'muted' ? 'text-text-muted' : el.variant === 'secondary' ? 'text-text-secondary' : ''
        return `<p class="slide-element text-sm ${colorClass} mb-4 ${maxWClass} ${alignClass} reveal"${sel}>${escHtml(el.content)}</p>`
      }
      case 'list': {
        const colorClass = (el.variant ?? 'muted') === 'muted' ? 'text-text-muted' : 'text-text-secondary'
        const listClass = el.style === 'numbered' ? 'list-decimal' : 'list-disc'
        return `<ul class="slide-element ${listClass} list-inside space-y-2 text-sm ${colorClass} reveal"${sel}>${el.items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`
      }
      case 'grid': {
        const colClass = el.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
        return `<div class="slide-element grid ${colClass} gap-6 mt-2"${sel}>${el.children.map(c => this.renderCardElement(c)).join('')}</div>`
      }
      case 'card':
        return `<div${sel}>${this.renderCardElement(el)}</div>`
      case 'emoji': {
        const animClass = el.animated ? 'animate-[float_3s_ease-in-out_infinite]' : ''
        return `<div class="slide-element text-[${el.size}px] mb-5 ${animClass} drop-shadow-xl mx-auto select-none"${sel}>${el.content}</div>`
      }
    }
  }

  renderCardElement(card: CardElement): string {
    const baseClass = card.variant === 'metric'
      ? 'metric-card transition reveal'
      : 'bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl p-5 reveal'

    const iconHtml = card.icon ? `<span class="text-lg">${card.icon}</span>` : ''
    const badgeHtml = card.numberBadge !== undefined
      ? `<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-1 to-accent-2 text-slate-950 text-sm font-semibold">${card.numberBadge}</div>`
      : ''

    const titleHtml = card.title
      ? card.numberBadge !== undefined
        ? `<h3 class="text-base font-semibold mb-1 leading-snug">${escHtml(card.title)}</h3>`
        : `<h3 class="text-sm font-semibold mb-2 flex items-center gap-2">${iconHtml}${escHtml(card.title)}</h3>`
      : ''

    const bodyHtml = card.body
      ? `<p class="text-sm text-text-muted">${escHtml(card.body)}</p>`
      : ''
    const listHtml = card.listItems
      ? `<ul class="list-disc list-inside space-y-2 text-sm text-text-muted">${card.listItems.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`
      : ''

    if (badgeHtml) {
      return `<div class="${baseClass} flex gap-4 items-start">${badgeHtml}<div>${titleHtml}${bodyHtml}${listHtml}</div></div>`
    }

    return `<div class="${baseClass}">${titleHtml}${bodyHtml}${listHtml}</div>`
  }
}

function initParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = canvas.offsetWidth || canvas.parentElement?.clientWidth || 800
  canvas.height = canvas.offsetHeight || canvas.parentElement?.clientHeight || 450
  const count = 55
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 2.5 + 0.8,
    alpha: Math.random() * 0.35 + 0.1,
  }))
  let running = true
  ;(function animate() {
    if (!running) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.vx *= 0.98; p.vy *= 0.98
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(6,182,212,${p.alpha})`
      ctx.fill()
    })
    requestAnimationFrame(animate)
  })()
  // Stop when canvas is removed
  const obs = new MutationObserver(() => {
    if (!canvas.isConnected) { running = false; obs.disconnect() }
  })
  obs.observe(document.body, { childList: true, subtree: true })
}

customElements.define('slide-renderer', SlideRendererElement)
