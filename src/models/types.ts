export interface Presentation {
  id: string
  title: string
  theme: Theme
  slides: Slide[]
  meta: { author: string; createdAt: string; updatedAt: string }
}

export interface Theme {
  colors: {
    bg: string
    bgDeep: string
    surface: string
    text: string
    textSecondary: string
    textMuted: string
    accent1: string
    accent2: string
    accent3: string
    glassBg: string
    glassBorder: string
    vignette: string
    glowColorRgb: string
  }
  fonts: {
    display: string
    body: string
  }
}

export interface Slide {
  id: string
  background: SlideBackground
  elements: SlideElement[]
  hasParticles: boolean
  layout: 'center' | 'top' // center for title slides, top for content slides
}

export interface SlideBackground {
  blobs: BlobConfig[]
}

export interface BlobConfig {
  color: string
  opacity: number
  width: number
  height: number
  top?: string
  bottom?: string
  left?: string
  right?: string

}

export type SlideElement =
  | LabelElement
  | HeadingElement
  | TextElement
  | ListElement
  | GridElement
  | CardElement
  | EmojiElement

export interface LabelElement {
  id: string
  type: 'label'
  content: string
}

export interface HeadingElement {
  id: string
  type: 'heading'
  level: 1 | 2
  content: string
  gradient: boolean
}

export interface TextElement {
  id: string
  type: 'text'
  content: string
  variant: 'body' | 'muted' | 'secondary'
  maxWidth?: string
  align?: 'left' | 'center' | 'right'
}

export interface ListElement {
  id: string
  type: 'list'
  items: string[]
  style: 'disc' | 'numbered'
  variant?: 'muted' | 'secondary'
}

export interface GridElement {
  id: string
  type: 'grid'
  columns: 2 | 3
  gap?: number
  children: CardElement[]
}

export interface CardElement {
  id: string
  type: 'card'
  variant: 'glass' | 'metric'
  icon?: string
  title?: string
  body?: string
  listItems?: string[]
  numberBadge?: number
}

export interface EmojiElement {
  id: string
  type: 'emoji'
  content: string
  size: number
  animated: boolean
}

export type EditorMode = 'edit' | 'present'
