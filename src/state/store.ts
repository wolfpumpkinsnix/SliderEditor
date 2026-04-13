/**
 * store.ts
 *
 * Backward-compatible EventTarget-based store.
 *
 * Internally this module delegates all state to the signals-based store
 * (signalsStore.ts).  An effect() subscription bridges signal changes to the
 * 'state-changed' CustomEvent so that existing components that listen on the
 * store object continue to work without modification.
 *
 * New code should prefer importing signals and action functions directly from
 * signalsStore.ts and subscribing with effect() instead of 'state-changed'.
 */

import { effect } from '@preact/signals-core'
import type { Presentation, Slide, Entity, EditorMode } from '../models/types.ts'
import * as signals from './signalsStore.ts'

class PresentationStore extends EventTarget {
  constructor() {
    super()
    // Bridge every signal change to a 'state-changed' CustomEvent.
    // effect() runs immediately on creation and again whenever any of the four
    // accessed signals change.  batch() in the action functions ensures that
    // multi-signal updates only fire this effect once.
    effect(() => {
      const state = {
        presentation: signals.presentation.value,
        currentSlideIndex: signals.currentSlideIndex.value,
        selectedElementId: signals.selectedElementId.value,
        mode: signals.mode.value,
      }
      this.dispatchEvent(new CustomEvent('state-changed', { detail: state }))
    })
  }

  // ── Getters (mirror signals) ─────────────────────────────────────────────────

  get presentation(): Presentation { return signals.presentation.value }
  get currentSlideIndex(): number { return signals.currentSlideIndex.value }
  get currentSlide(): Slide { return signals.currentSlide.value }
  get selectedElementId(): string | null { return signals.selectedElementId.value }
  get mode(): EditorMode { return signals.mode.value }

  // ── Actions (delegate to signalsStore) ──────────────────────────────────────

  setPresentation(p: Presentation): void { signals.setPresentation(p) }
  updatePresentation(updater: (p: Presentation) => void): void { signals.updatePresentation(updater) }
  goToSlide(index: number): void { signals.goToSlide(index) }
  selectElement(id: string | null): void { signals.selectElement(id) }
  setMode(m: EditorMode): void { signals.setMode(m) }
  updateCurrentSlide(updater: (slide: Slide) => void): void { signals.updateCurrentSlide(updater) }
  updateElement(elementId: string, updater: (el: Entity) => void): void { signals.updateElement(elementId, updater) }
  addSlide(slide: Slide, afterIndex?: number): void { signals.addSlide(slide, afterIndex) }
  deleteSlide(index: number): void { signals.deleteSlide(index) }
  duplicateSlide(index: number): void { signals.duplicateSlide(index) }
  moveSlide(fromIndex: number, toIndex: number): void { signals.moveSlide(fromIndex, toIndex) }
  addElement(element: Entity): void { signals.addElement(element) }
  removeElement(elementId: string): void { signals.removeElement(elementId) }
  updateTitle(title: string): void { signals.updateTitle(title) }
  moveElementUp(id: string): void { signals.moveElementUp(id) }
  moveElementDown(id: string): void { signals.moveElementDown(id) }
  bringToFront(id: string): void { signals.bringToFront(id) }
  sendToBack(id: string): void { signals.sendToBack(id) }
}

export const store = new PresentationStore()
