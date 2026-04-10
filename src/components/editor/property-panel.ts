import { store } from '../../state/store.ts'
import type { SlideElement, CardElement } from '../../models/types.ts'

export class PropertyPanelElement extends HTMLElement {
  private _onStateChanged = () => this.render()

  connectedCallback() {
    store.addEventListener('state-changed', this._onStateChanged)
    this.render()
  }

  disconnectedCallback() {
    store.removeEventListener('state-changed', this._onStateChanged)
  }

  private render() {
    const { selectedElementId, currentSlide, presentation } = store
    if (!currentSlide) return

    this.innerHTML = ''

    // Always show slide properties section
    const slideSection = this.buildSlideSection()
    this.appendChild(slideSection)

    if (!selectedElementId) {
      const hint = document.createElement('div')
      hint.style.cssText = 'padding: 16px; color: #64748b; font-size: 12px; text-align: center;'
      hint.textContent = 'Click an element to edit its properties'
      this.appendChild(hint)
      return
    }

    const el = currentSlide.elements.find(e => e.id === selectedElementId)
      ?? currentSlide.elements.flatMap(e => e.type === 'grid' ? e.children : []).find(c => c.id === selectedElementId)

    if (!el) return

    const section = this.buildElementSection(el, presentation.theme.colors.accent1)
    this.appendChild(section)
  }

  private buildSlideSection(): HTMLElement {
    const { currentSlide, presentation, currentSlideIndex } = store
    const section = document.createElement('div')
    section.innerHTML = `
      <div style="padding: 12px 16px; border-bottom: 1px solid rgba(148,163,184,0.1);">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 10px;">Slide ${currentSlideIndex + 1}</div>

        <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Layout</label>
        <select id="slide-layout" style="${selectStyle()}">
          <option value="top" ${currentSlide.layout === 'top' ? 'selected' : ''}>Content (top)</option>
          <option value="center" ${currentSlide.layout === 'center' ? 'selected' : ''}>Centered</option>
        </select>

        <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Particles</label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#f1f5f9;cursor:pointer;">
          <input type="checkbox" id="slide-particles" ${currentSlide.hasParticles ? 'checked' : ''} style="accent-color:#06B6D4;">
          Enable particle effect
        </label>

        <div style="margin-top:12px;">
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:6px;">Background blobs</label>
          ${currentSlide.background.blobs.map((blob, i) => `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <input type="color" data-blob-color="${i}" value="${blob.color}" style="width:28px;height:22px;border:none;border-radius:3px;cursor:pointer;padding:1px;background:none;">
              <input type="range" data-blob-opacity="${i}" min="0" max="0.5" step="0.01" value="${blob.opacity}" style="flex:1;accent-color:#06B6D4;">
              <span style="font-size:11px;color:#64748b;min-width:28px;">${Math.round(blob.opacity * 100)}%</span>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:12px;">
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:6px;">Theme accent colors</label>
          <div style="display:flex;gap:6px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <input type="color" data-theme-color="accent1" value="${presentation.theme.colors.accent1}" style="width:32px;height:24px;border:none;border-radius:3px;cursor:pointer;padding:1px;background:none;">
              <span style="font-size:9px;color:#64748b;">1</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <input type="color" data-theme-color="accent2" value="${presentation.theme.colors.accent2}" style="width:32px;height:24px;border:none;border-radius:3px;cursor:pointer;padding:1px;background:none;">
              <span style="font-size:9px;color:#64748b;">2</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
              <input type="color" data-theme-color="accent3" value="${presentation.theme.colors.accent3}" style="width:32px;height:24px;border:none;border-radius:3px;cursor:pointer;padding:1px;background:none;">
              <span style="font-size:9px;color:#64748b;">3</span>
            </div>
          </div>
        </div>
      </div>
    `

    section.querySelector('#slide-layout')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as 'top' | 'center'
      store.updateCurrentSlide(s => { s.layout = val })
    })

    section.querySelector('#slide-particles')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).checked
      store.updateCurrentSlide(s => { s.hasParticles = val })
    })

    section.querySelectorAll<HTMLInputElement>('[data-blob-color]').forEach(input => {
      input.addEventListener('input', () => {
        const i = Number(input.dataset['blobColor'])
        store.updateCurrentSlide(s => { s.background.blobs[i].color = input.value })
      })
    })

    section.querySelectorAll<HTMLInputElement>('[data-blob-opacity]').forEach(input => {
      input.addEventListener('input', () => {
        const i = Number(input.dataset['blobOpacity'])
        const val = Number(input.value)
        store.updateCurrentSlide(s => { s.background.blobs[i].opacity = val })
        const span = input.nextElementSibling as HTMLElement
        if (span) span.textContent = `${Math.round(val * 100)}%`
      })
    })

    section.querySelectorAll<HTMLInputElement>('[data-theme-color]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset['themeColor'] as keyof typeof presentation.theme.colors
        store.updatePresentation(p => { (p.theme.colors as Record<string, string>)[key] = input.value })
      })
    })

    return section
  }

  private buildElementSection(el: SlideElement, _accent: string): HTMLElement {
    const section = document.createElement('div')
    section.style.cssText = 'padding: 12px 16px;'

    const title = document.createElement('div')
    title.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-bottom:10px;'
    title.textContent = `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} Properties`
    section.appendChild(title)

    switch (el.type) {
      case 'label':
      case 'text':
      case 'heading': {
        section.innerHTML += `
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Content</label>
          <textarea id="el-content" rows="4" style="${textareaStyle()}">${el.content}</textarea>
        `
        if (el.type === 'heading') {
          section.innerHTML += `
            <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Level</label>
            <select id="el-level" style="${selectStyle()}">
              <option value="1" ${el.level === 1 ? 'selected' : ''}>H1 (large)</option>
              <option value="2" ${el.level === 2 ? 'selected' : ''}>H2 (medium)</option>
            </select>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#f1f5f9;cursor:pointer;margin-top:10px;">
              <input type="checkbox" id="el-gradient" ${el.gradient ? 'checked' : ''} style="accent-color:#06B6D4;">
              Gradient text
            </label>
          `
        }
        if (el.type === 'text') {
          section.innerHTML += `
            <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Style</label>
            <select id="el-variant" style="${selectStyle()}">
              <option value="body" ${el.variant === 'body' ? 'selected' : ''}>Body</option>
              <option value="secondary" ${el.variant === 'secondary' ? 'selected' : ''}>Secondary</option>
              <option value="muted" ${el.variant === 'muted' ? 'selected' : ''}>Muted</option>
            </select>
            <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Align</label>
            <select id="el-align" style="${selectStyle()}">
              <option value="left" ${(el.align ?? 'left') === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${el.align === 'center' ? 'selected' : ''}>Center</option>
            </select>
          `
        }
        break
      }
      case 'emoji': {
        section.innerHTML += `
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Emoji</label>
          <input id="el-content" type="text" value="${el.content}" style="${inputStyle()}">
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Size (px)</label>
          <input id="el-size" type="number" value="${el.size}" min="24" max="200" style="${inputStyle()}">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#f1f5f9;cursor:pointer;margin-top:10px;">
            <input type="checkbox" id="el-animated" ${el.animated ? 'checked' : ''} style="accent-color:#06B6D4;">
            Float animation
          </label>
        `
        break
      }
      case 'grid': {
        section.innerHTML += `
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Columns</label>
          <select id="el-columns" style="${selectStyle()}">
            <option value="2" ${el.columns === 2 ? 'selected' : ''}>2 columns</option>
            <option value="3" ${el.columns === 3 ? 'selected' : ''}>3 columns</option>
          </select>
          <div style="margin-top:12px;font-size:12px;color:#64748b;">
            ${el.children.length} card${el.children.length !== 1 ? 's' : ''} — click a card to edit
          </div>
        `
        break
      }
      case 'card': {
        section.innerHTML += `
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Style</label>
          <select id="el-variant" style="${selectStyle()}">
            <option value="glass" ${el.variant === 'glass' ? 'selected' : ''}>Glass</option>
            <option value="metric" ${el.variant === 'metric' ? 'selected' : ''}>Metric</option>
          </select>
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Icon (emoji)</label>
          <input id="el-icon" type="text" value="${el.icon ?? ''}" style="${inputStyle()}">
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Title</label>
          <input id="el-title" type="text" value="${el.title ?? ''}" style="${inputStyle()}">
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Body</label>
          <textarea id="el-body" rows="3" style="${textareaStyle()}">${el.body ?? ''}</textarea>
        `
        break
      }
      case 'list': {
        section.innerHTML += `
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Items (one per line)</label>
          <textarea id="el-items" rows="5" style="${textareaStyle()}">${el.items.join('\n')}</textarea>
          <label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;margin-top:10px;">Style</label>
          <select id="el-style" style="${selectStyle()}">
            <option value="disc" ${el.style === 'disc' ? 'selected' : ''}>Bullet</option>
            <option value="numbered" ${el.style === 'numbered' ? 'selected' : ''}>Numbered</option>
          </select>
        `
        break
      }
    }

    // Delete element button
    const deleteBtn = document.createElement('button')
    deleteBtn.textContent = 'Delete element'
    deleteBtn.style.cssText = `
      display:block;width:100%;margin-top:16px;
      padding:7px 12px;border:1px solid rgba(248,113,113,0.3);
      background:rgba(248,113,113,0.1);color:#f87171;
      border-radius:6px;font-size:12px;cursor:pointer;
      transition:background 0.15s;
    `
    deleteBtn.addEventListener('click', () => store.removeElement(el.id))
    section.appendChild(deleteBtn)

    // Wire up inputs
    setTimeout(() => this.wireInputs(section, el), 0)

    return section
  }

  private wireInputs(section: HTMLElement, el: SlideElement) {
    const get = <T extends HTMLElement>(id: string) => section.querySelector<T>(`#${id}`)

    const content = get<HTMLTextAreaElement | HTMLInputElement>('el-content')
    content?.addEventListener('input', () => {
      store.updateElement(el.id, e => {
        if (e.type === 'text' || e.type === 'heading' || e.type === 'label') {
          e.content = (content as HTMLInputElement).value
        }
      })
    })

    get<HTMLSelectElement>('el-level')?.addEventListener('change', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'heading') el2.level = Number((e.target as HTMLSelectElement).value) as 1 | 2
      })
    })

    get<HTMLInputElement>('el-gradient')?.addEventListener('change', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'heading') el2.gradient = (e.target as HTMLInputElement).checked
      })
    })

    get<HTMLSelectElement>('el-variant')?.addEventListener('change', e => {
      const val = (e.target as HTMLSelectElement).value
      store.updateElement(el.id, el2 => {
        if (el2.type === 'text') el2.variant = val as 'body' | 'muted' | 'secondary'
        if (el2.type === 'card') (el2 as CardElement).variant = val as 'glass' | 'metric'
      })
    })

    get<HTMLSelectElement>('el-align')?.addEventListener('change', e => {
      const val = (e.target as HTMLSelectElement).value as 'left' | 'center'
      store.updateElement(el.id, el2 => {
        if (el2.type === 'text') el2.align = val
      })
    })

    get<HTMLInputElement>('el-size')?.addEventListener('input', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'emoji') el2.size = Number((e.target as HTMLInputElement).value)
      })
    })

    get<HTMLInputElement>('el-animated')?.addEventListener('change', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'emoji') el2.animated = (e.target as HTMLInputElement).checked
      })
    })

    get<HTMLSelectElement>('el-columns')?.addEventListener('change', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'grid') el2.columns = Number((e.target as HTMLSelectElement).value) as 2 | 3
      })
    })

    get<HTMLInputElement>('el-icon')?.addEventListener('input', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'card') el2.icon = (e.target as HTMLInputElement).value
      })
    })

    get<HTMLInputElement>('el-title')?.addEventListener('input', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'card') el2.title = (e.target as HTMLInputElement).value
      })
    })

    get<HTMLTextAreaElement>('el-body')?.addEventListener('input', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'card') el2.body = (e.target as HTMLTextAreaElement).value
      })
    })

    get<HTMLTextAreaElement>('el-items')?.addEventListener('input', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'list') el2.items = (e.target as HTMLTextAreaElement).value.split('\n')
      })
    })

    get<HTMLSelectElement>('el-style')?.addEventListener('change', e => {
      store.updateElement(el.id, el2 => {
        if (el2.type === 'list') el2.style = (e.target as HTMLSelectElement).value as 'disc' | 'numbered'
      })
    })
  }
}

function selectStyle() {
  return `width:100%;padding:6px 8px;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:6px;color:#f1f5f9;font-size:12px;margin-bottom:4px;`
}

function inputStyle() {
  return `width:100%;padding:6px 8px;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:6px;color:#f1f5f9;font-size:12px;`
}

function textareaStyle() {
  return `width:100%;padding:6px 8px;background:#0f172a;border:1px solid rgba(148,163,184,0.2);border-radius:6px;color:#f1f5f9;font-size:12px;resize:vertical;font-family:Inter,sans-serif;`
}

customElements.define('property-panel', PropertyPanelElement)
