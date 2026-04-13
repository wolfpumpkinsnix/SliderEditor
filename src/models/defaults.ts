import type { Theme, Slide, Presentation, BlobConfig, Entity, Component } from './types.ts'
import { genId } from '../services/id.ts'

export const DEFAULT_THEME: Theme = {
  colors: {
    bg: '#0f172a',
    bgDeep: '#020617',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    accent1: '#06B6D4',
    accent2: '#7C3AED',
    accent3: '#22C55E',
    glassBg: 'rgba(15,23,42,0.85)',
    glassBorder: 'rgba(148,163,184,0.45)',
    vignette: 'rgba(0,0,0,0.55)',
    glowColorRgb: '6,182,212',
  },
  fonts: {
    display: 'Instrument Serif',
    body: 'Inter',
  },
}

// ── Prefab Helpers ─────────────────────────────────────────────────────────────

export function createHeading(content: string, level: 1 | 2 = 1, gradient = false): Entity {
  return {
    id: genId(),
    name: level === 1 ? 'Heading 1' : 'Heading 2',
    components: [
      {
        type: 'text',
        content,
        fontSize: level === 1 ? 'h1' : 'h2',
        fontWeight: 'bold',
        gradient,
        align: level === 1 ? 'center' : 'left'
      }
    ]
  }
}

export function createText(content: string, variant: 'muted' | 'secondary' = 'secondary', align: 'left' | 'center' | 'right' = 'left'): Entity {
  return {
    id: genId(),
    name: 'Text Block',
    components: [
      {
        type: 'text',
        content,
        fontSize: 'body',
        variant,
        align,
        maxWidth: align === 'center' ? '42rem' : undefined
      }
    ]
  }
}

export function createLabel(content: string): Entity {
  return {
    id: genId(),
    name: 'Label',
    components: [
      { type: 'text', content, fontSize: 'label', fontWeight: 'bold', variant: 'muted' }
    ]
  }
}

export function createEmoji(emoji: string, size = 80, animated = true): Entity {
  return {
    id: genId(),
    name: 'Emoji',
    components: [
      { type: 'icon', value: emoji, size, animated }
    ]
  }
}

export function createList(items: string[], style: 'disc' | 'numbered' = 'disc'): Entity {
  return {
    id: genId(),
    name: 'List',
    components: [
      { type: 'list', items, style }
    ]
  }
}

export function createCard(title: string, body: string, variant: 'glass' | 'metric' = 'glass', iconOrBadge?: string | number): Entity {
  const components: Component[] = [
    { type: 'background', variant, rounded: true, padding: '2rem' }
  ]
  
  const children: Entity[] = []
  
  if (iconOrBadge !== undefined) {
    if (typeof iconOrBadge === 'string') {
      children.push(createEmoji(iconOrBadge, 32, false))
    }
  }

  children.push({
    id: genId(),
    name: 'Card Title',
    components: [{ type: 'text', content: title, fontSize: 'h2', fontWeight: 'bold' }]
  })

  children.push({
    id: genId(),
    name: 'Card Body',
    components: [{ type: 'text', content: body, fontSize: 'body', variant: 'secondary' }]
  })

  // Metric cards might have a number badge
  if (variant === 'metric' && typeof iconOrBadge === 'number') {
    children.push({
      id: genId(),
      name: 'Badge',
      components: [{ type: 'text', content: String(iconOrBadge), fontSize: 'small', fontWeight: 'black', variant: 'muted' }]
    })
  }

  return {
    id: genId(),
    name: 'Card',
    components,
    children
  }
}

/** A container entity with a grid layout */
export function createGrid(columns: 2 | 3, gap = 24, children: Entity[] = []): Entity {
  return {
    id: genId(),
    name: `Grid (${columns} cols)`,
    components: [
      { type: 'layout', layoutType: 'grid', columns, gap }
    ],
    children
  }
}

// ── Slide Backgrounds ──────────────────────────────────────────────────────────

export function cyanBlob(overrides: Partial<BlobConfig> = {}): BlobConfig {
  return { color: '#06B6D4', opacity: 0.14, width: 380, height: 380, top: '-100px', right: '-120px', ...overrides }
}
export function violetBlob(overrides: Partial<BlobConfig> = {}): BlobConfig {
  return { color: '#7C3AED', opacity: 0.12, width: 260, height: 260, bottom: '-80px', left: '-60px', ...overrides }
}
export function greenBlob(overrides: Partial<BlobConfig> = {}): BlobConfig {
  return { color: '#22C55E', opacity: 0.11, width: 260, height: 260, bottom: '-80px', left: '-60px', ...overrides }
}

// ── Slide Prefabs ─────────────────────────────────────────────────────────────

export function blankTitleSlide(): Slide {
  return {
    id: genId(),
    layout: 'center',
    hasParticles: true,
    background: {
      blobs: [
        cyanBlob({ width: 520, height: 520, top: '-120px', right: '-120px', opacity: 0.22 }),
        violetBlob({ width: 360, height: 360, bottom: '-120px', left: '-80px', opacity: 0.18 }),
        greenBlob({ width: 260, height: 260, top: '40%', left: '10%' }),
      ],
    },
    entities: [
      createEmoji('🎯'),
      createHeading('Presentation Title', 1, true),
      createText('Subtitle or tagline here', 'muted', 'center'),
    ],
  }
}

export function blankContentSlide(): Slide {
  return {
    id: genId(),
    layout: 'top',
    hasParticles: false,
    background: {
      blobs: [cyanBlob(), violetBlob()],
    },
    entities: [
      createHeading('Slide Title', 2),
      createText('Add your content here.', 'secondary'),
    ],
  }
}

export function examplePresentation(): Presentation {
  const now = new Date().toISOString()
  return {
    id: genId(),
    title: 'GraphQL vs REST',
    theme: DEFAULT_THEME,
    meta: { author: '', createdAt: now, updatedAt: now },
    slides: [
      // Slide 1: Title
      {
        id: genId(),
        layout: 'center',
        hasParticles: true,
        background: {
          blobs: [
            cyanBlob({ width: 520, height: 520, top: '-120px', right: '-120px', opacity: 0.22 }),
            violetBlob({ width: 360, height: 360, bottom: '-120px', left: '-80px', opacity: 0.18 }),
            greenBlob({ width: 260, height: 260, top: '40%', left: '10%' }),
          ],
        },
        entities: [
          createEmoji('🧭'),
          createHeading('GraphQL vs REST', 1, true),
          createText('Choosing the Right API Style for Modern Applications', 'muted', 'center'),
        ],
      },
      // Slide 2: Agenda
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [cyanBlob({ opacity: 0.14 }), violetBlob({ opacity: 0.12 })] },
        entities: [
          createHeading('Agenda', 2),
          createGrid(2, 24, [
            createCard('What are REST and GraphQL?', 'Quick refresher on each API style and how they model data and operations.', 'glass', 1),
            createCard('Key architectural differences', 'Endpoints, data fetching, typing, versioning, and real-time capabilities.', 'glass', 2),
            createCard('Pros, cons, and trade-offs', 'Performance, caching, complexity, security, tooling, and team skills.', 'glass', 3),
            createCard('When to use which', 'Practical guidance and examples to choose the right approach.', 'glass', 4),
          ]),
        ],
      },
      // Slide 3: What is REST?
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [cyanBlob({ opacity: 0.14 }), greenBlob({ color: '#22C55E', opacity: 0.12 })] },
        entities: [
          createLabel('Foundations'),
          createHeading('What is REST?', 2),
          createText('REST (Representational State Transfer) is an architectural style for building networked APIs around resources, exposed as multiple endpoints that use HTTP methods like GET, POST, PUT, and DELETE.', 'secondary'),
          createGrid(2, 24, [
            createCard('Resource-based endpoints', 'Each resource has its own URL (e.g. /users, /orders), and the server defines the shape of the JSON it returns.', 'glass', '🔗'),
            createCard('Stateless, HTTP-native', 'Every request is independent, can be cached using standard HTTP caching, and uses status codes for clear error handling.', 'glass', '⚙️'),
            createCard('Fixed response structures', 'Endpoints return full representations, which can lead to over-fetching or under-fetching for some clients.', 'glass', '📦'),
            createCard('Mature ecosystem', 'REST is widely adopted, well understood, and supported by tooling, libraries, and infrastructure.', 'glass', '✅'),
          ]),
        ],
      },
      // Slide 4: What is GraphQL?
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [violetBlob({ width: 360, height: 360, top: '-90px', right: '-110px', opacity: 0.16 }), cyanBlob({ width: 260, height: 260, bottom: '-70px', left: '-40px', opacity: 0.14 })] },
        entities: [
          createLabel('Foundations'),
          createHeading('What is GraphQL?', 2),
          createText('GraphQL is a query language and runtime for APIs that exposes a single endpoint and strongly typed schema, letting clients request exactly the fields they need.', 'secondary'),
          createGrid(2, 24, [
            createCard('Single endpoint, flexible queries', 'All queries, mutations, and subscriptions go through one URL, and the client shapes the response.', 'glass', '🎯'),
            createCard('Strongly typed schema', 'A schema defines types and relationships, acting as a contract between client and server and enabling validation and introspection.', 'glass', '🧩'),
            createCard('Nested, graph-shaped data', 'Clients can fetch related resources in a single query instead of chaining multiple endpoint calls.', 'glass', '🌐'),
            createCard('Real-time via subscriptions', 'Subscriptions let clients get live updates (e.g. chats, notifications) over WebSockets.', 'glass', '⚡'),
          ]),
        ],
      },
      // Slide 5: REST vs GraphQL side by side
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [cyanBlob({ opacity: 0.14 }), violetBlob({ opacity: 0.12 })] },
        entities: [
          createLabel('At a Glance'),
          createHeading('REST vs GraphQL in one slide', 2),
          createGrid(2, 24, [
            createCard('REST', 'Multiple resource endpoints such as /users, /orders. Server controls response shape; payloads can over- or under-fetch.', 'metric', '🌍'),
            createCard('GraphQL', 'Single endpoint with queries, mutations, and subscriptions. Client specifies required fields, avoiding over- and under-fetching.', 'metric', '🧬'),
          ]),
        ],
      },
      // Slide 6: Closing
      {
        id: genId(),
        layout: 'center',
        hasParticles: true,
        background: {
          blobs: [
            cyanBlob({ width: 520, height: 520, top: '-120px', right: '-120px', opacity: 0.22 }),
            violetBlob({ width: 360, height: 360, bottom: '-120px', left: '-80px', opacity: 0.18 }),
            greenBlob({ width: 260, height: 260, top: '40%', left: '10%' }),
          ],
        },
        entities: [
          createHeading('REST and GraphQL work best when used intentionally', 2, true),
          createText('REST remains a great default for simple, resource-based services, while GraphQL shines in complex, client-driven domains where flexibility and a unified graph pay off.', 'secondary', 'center'),
          createText('Questions? Discussion? Examples from your own stack?', 'muted', 'center'),
        ],
      },
    ],
  }
}

