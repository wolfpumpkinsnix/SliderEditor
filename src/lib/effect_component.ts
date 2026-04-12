import { effect } from '@preact/signals-core'

/**
 * Base class for all Web Components in this project.
 * Provides: template rendering, DOM helpers, and signal effect lifecycle management.
 */
export class EffectComponent extends HTMLElement {
  private readonly _disposables: (() => void)[] = []

  /**
   * Clone the static template (set by @Component) into this element.
   */
  protected render(): void {
    const template = (this.constructor as any).template as HTMLTemplateElement
    if (!template) {
      console.warn(`Template missing for component: ${this.tagName}`)
      return
    }
    this.replaceChildren(template.content.cloneNode(true))
  }

  /**
   * Query a child element by id.
   */
  protected get<T extends HTMLElement>(id: string): T | null {
    return this.querySelector(`#${id}`)
  }

  /**
   * Query a child <template> by id.
   */
  protected getTemplate(id: string): HTMLTemplateElement {
    return this.querySelector(`#${id}`) as HTMLTemplateElement
  }

  /**
   * Register a signal effect that is automatically disposed on disconnect.
   */
  protected addEffect(fn: () => void): void {
    this._disposables.push(effect(fn))
  }

  disconnectedCallback(): void {
    for (const dispose of this._disposables) dispose()
    this._disposables.length = 0
  }
}
