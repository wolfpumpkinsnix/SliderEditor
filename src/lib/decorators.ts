/**
 * decorators.ts
 * 
 * Custom decorators for Web Components.
 */

export interface ComponentOptions {
  tag: string;
  template: string;
  styles?: string;
}

export function Component(options: ComponentOptions) {
  return function (constructor: any) {
    // Define the custom element
    if (!customElements.get(options.tag)) {
      customElements.define(options.tag, constructor);
    }
    
    // Inject styles into HEAD once
    if (options.styles && !document.querySelector(`style[data-tag="${options.tag}"]`)) {
      const style = document.createElement('style');
      style.dataset['tag'] = options.tag;
      style.textContent = options.styles;
      document.head.appendChild(style);
    }
    
    // Parse the template once and store it as a static property
    const tpl = document.createElement('template');
    tpl.innerHTML = options.template;
    constructor.template = tpl;
  };
}
