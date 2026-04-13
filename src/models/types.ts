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
  entities: Entity[]
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


export interface Entity {
  id: string
  name: string
  components: Component[]
  children?: Entity[]
}

export type Component =
  | TextComponent
  | BackgroundComponent
  | LayoutComponent
  | IconComponent
  | ListComponent

export interface TextComponent {
  type: 'text'
  content: string
  fontSize?: 'label' | 'h1' | 'h2' | 'body' | 'small'
  fontWeight?: 'normal' | 'bold' | 'black'
  gradient?: boolean
  align?: 'left' | 'center' | 'right'
  maxWidth?: string
  variant?: 'muted' | 'secondary' // mapping back to old text variants
}

export interface BackgroundComponent {
  type: 'background'
  variant?: 'solid' | 'glass' | 'metric'
  color?: string
  rounded?: boolean
  padding?: string
}

export interface LayoutComponent {
  type: 'layout'
  layoutType: 'flex' | 'grid'
  columns?: 2 | 3
  gap?: number
  direction?: 'row' | 'column'
  alignItems?: 'start' | 'center' | 'end'
}

export interface IconComponent {
  type: 'icon'
  value: string // emoji or icon id
  size?: number
  animated?: boolean
}

export interface ListComponent {
  type: 'list'
  items: string[]
  style: 'disc' | 'numbered'
  variant?: 'muted' | 'secondary'
}

export type EditorMode = 'edit' | 'present'

