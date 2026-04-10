import type { Presentation, Slide, SlideElement, EditorMode } from '../models/types.ts'
import { savePresentation, loadPresentation } from '../services/storage.ts'
import { examplePresentation } from '../models/defaults.ts'

interface StoreState {
  presentation: Presentation
  currentSlideIndex: number
  selectedElementId: string | null
  mode: EditorMode
}

class PresentationStore extends EventTarget {
  private _state: StoreState

  constructor() {
    super()
    const saved = loadPresentation()
    this._state = {
      presentation: saved ?? examplePresentation(),
      currentSlideIndex: 0,
      selectedElementId: null,
      mode: 'edit',
    }
  }

  get state(): Readonly<StoreState> { return this._state }
  get presentation(): Presentation { return this._state.presentation }
  get currentSlideIndex(): number { return this._state.currentSlideIndex }
  get currentSlide(): Slide { return this._state.presentation.slides[this._state.currentSlideIndex] }
  get selectedElementId(): string | null { return this._state.selectedElementId }
  get mode(): EditorMode { return this._state.mode }

  private emit() {
    this.dispatchEvent(new CustomEvent('state-changed', { detail: this._state }))
  }

  private save() {
    this._state.presentation.meta.updatedAt = new Date().toISOString()
    savePresentation(this._state.presentation)
  }

  setPresentation(p: Presentation) {
    this._state.presentation = p
    this._state.currentSlideIndex = 0
    this._state.selectedElementId = null
    this.save()
    this.emit()
  }

  updatePresentation(updater: (p: Presentation) => void) {
    updater(this._state.presentation)
    this.save()
    this.emit()
  }

  goToSlide(index: number) {
    const clamped = Math.max(0, Math.min(index, this._state.presentation.slides.length - 1))
    this._state.currentSlideIndex = clamped
    this._state.selectedElementId = null
    this.emit()
  }

  selectElement(id: string | null) {
    this._state.selectedElementId = id
    this.emit()
  }

  setMode(mode: EditorMode) {
    this._state.mode = mode
    this._state.selectedElementId = null
    this.emit()
  }

  updateCurrentSlide(updater: (slide: Slide) => void) {
    const slide = this.currentSlide
    if (slide) {
      updater(slide)
      this.save()
      this.emit()
    }
  }

  updateElement(elementId: string, updater: (el: SlideElement) => void) {
    for (const slide of this._state.presentation.slides) {
      const el = slide.elements.find(e => e.id === elementId)
      if (el) { updater(el); break }
      // Check inside grids
      for (const topEl of slide.elements) {
        if (topEl.type === 'grid') {
          const card = topEl.children.find(c => c.id === elementId)
          if (card) { updater(card); break }
        }
      }
    }
    this.save()
    this.emit()
  }

  addSlide(slide: Slide, afterIndex?: number) {
    const idx = afterIndex !== undefined ? afterIndex + 1 : this._state.presentation.slides.length
    this._state.presentation.slides.splice(idx, 0, slide)
    this._state.currentSlideIndex = idx
    this._state.selectedElementId = null
    this.save()
    this.emit()
  }

  deleteSlide(index: number) {
    if (this._state.presentation.slides.length <= 1) return
    this._state.presentation.slides.splice(index, 1)
    this._state.currentSlideIndex = Math.min(index, this._state.presentation.slides.length - 1)
    this._state.selectedElementId = null
    this.save()
    this.emit()
  }

  duplicateSlide(index: number) {
    const original = this._state.presentation.slides[index]
    const copy: Slide = JSON.parse(JSON.stringify(original))
    copy.id = crypto.randomUUID()
    copy.elements = copy.elements.map(el => ({
      ...el,
      id: crypto.randomUUID(),
      ...(el.type === 'grid' ? { children: (el as { type: 'grid'; children: { id: string }[] }).children.map(c => ({ ...c, id: crypto.randomUUID() })) } : {}),
    })) as Slide['elements']
    this._state.presentation.slides.splice(index + 1, 0, copy)
    this._state.currentSlideIndex = index + 1
    this.save()
    this.emit()
  }

  moveSlide(fromIndex: number, toIndex: number) {
    const slides = this._state.presentation.slides
    const [slide] = slides.splice(fromIndex, 1)
    slides.splice(toIndex, 0, slide)
    this._state.currentSlideIndex = toIndex
    this.save()
    this.emit()
  }

  addElement(element: SlideElement) {
    this.currentSlide.elements.push(element)
    this._state.selectedElementId = element.id
    this.save()
    this.emit()
  }

  removeElement(elementId: string) {
    const slide = this.currentSlide
    slide.elements = slide.elements.filter(e => e.id !== elementId)
    if (this._state.selectedElementId === elementId) {
      this._state.selectedElementId = null
    }
    this.save()
    this.emit()
  }

  updateTitle(title: string) {
    this._state.presentation.title = title
    this.save()
    this.emit()
  }
}

export const store = new PresentationStore()
