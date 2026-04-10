import type { Theme, Slide, Presentation, BlobConfig } from './types.ts'
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

export function cyanBlob(overrides: Partial<BlobConfig> = {}): BlobConfig {
  return { color: '#06B6D4', opacity: 0.14, width: 380, height: 380, top: '-100px', right: '-120px', ...overrides }
}
export function violetBlob(overrides: Partial<BlobConfig> = {}): BlobConfig {
  return { color: '#7C3AED', opacity: 0.12, width: 260, height: 260, bottom: '-80px', left: '-60px', ...overrides }
}
export function greenBlob(overrides: Partial<BlobConfig> = {}): BlobConfig {
  return { color: '#22C55E', opacity: 0.11, width: 260, height: 260, bottom: '-80px', left: '-60px', ...overrides }
}

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
    elements: [
      { id: genId(), type: 'emoji', content: '🎯', size: 80, animated: true },
      { id: genId(), type: 'heading', level: 1, content: 'Presentation Title', gradient: true, glow: false },
      { id: genId(), type: 'text', content: 'Subtitle or tagline here', variant: 'muted', align: 'center' },
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
    elements: [
      { id: genId(), type: 'heading', level: 2, content: 'Slide Title', gradient: false, glow: false },
      { id: genId(), type: 'text', content: 'Add your content here.', variant: 'secondary' },
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
        elements: [
          { id: genId(), type: 'emoji', content: '🧭', size: 80, animated: true },
          { id: genId(), type: 'heading', level: 1, content: 'GraphQL vs REST', gradient: true, glow: false },
          { id: genId(), type: 'text', content: 'Choosing the Right API Style for Modern Applications', variant: 'muted', align: 'center' },
        ],
      },
      // Slide 2: Agenda
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [cyanBlob({ opacity: 0.14 }), violetBlob({ opacity: 0.12 })] },
        elements: [
          { id: genId(), type: 'heading', level: 2, content: 'Agenda', gradient: false, glow: false },
          {
            id: genId(), type: 'grid', columns: 2, children: [
              { id: genId(), type: 'card', variant: 'glass', numberBadge: 1, title: 'What are REST and GraphQL?', body: 'Quick refresher on each API style and how they model data and operations.' },
              { id: genId(), type: 'card', variant: 'glass', numberBadge: 2, title: 'Key architectural differences', body: 'Endpoints, data fetching, typing, versioning, and real-time capabilities.' },
              { id: genId(), type: 'card', variant: 'glass', numberBadge: 3, title: 'Pros, cons, and trade-offs', body: 'Performance, caching, complexity, security, tooling, and team skills.' },
              { id: genId(), type: 'card', variant: 'glass', numberBadge: 4, title: 'When to use which', body: 'Practical guidance and examples to choose the right approach.' },
            ],
          },
        ],
      },
      // Slide 3: What is REST?
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [cyanBlob({ opacity: 0.14 }), greenBlob({ color: '#22C55E', opacity: 0.12 })] },
        elements: [
          { id: genId(), type: 'label', content: 'Foundations' },
          { id: genId(), type: 'heading', level: 2, content: 'What is REST?', gradient: false, glow: false },
          { id: genId(), type: 'text', content: 'REST (Representational State Transfer) is an architectural style for building networked APIs around resources, exposed as multiple endpoints that use HTTP methods like GET, POST, PUT, and DELETE.', variant: 'secondary' },
          {
            id: genId(), type: 'grid', columns: 2, children: [
              { id: genId(), type: 'card', variant: 'glass', icon: '🔗', title: 'Resource-based endpoints', body: 'Each resource has its own URL (e.g. /users, /orders), and the server defines the shape of the JSON it returns.' },
              { id: genId(), type: 'card', variant: 'glass', icon: '⚙️', title: 'Stateless, HTTP-native', body: 'Every request is independent, can be cached using standard HTTP caching, and uses status codes for clear error handling.' },
              { id: genId(), type: 'card', variant: 'glass', icon: '📦', title: 'Fixed response structures', body: 'Endpoints return full representations, which can lead to over-fetching or under-fetching for some clients.' },
              { id: genId(), type: 'card', variant: 'glass', icon: '✅', title: 'Mature ecosystem', body: 'REST is widely adopted, well understood, and supported by tooling, libraries, and infrastructure.' },
            ],
          },
        ],
      },
      // Slide 4: What is GraphQL?
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [violetBlob({ width: 360, height: 360, top: '-90px', right: '-110px', opacity: 0.16 }), cyanBlob({ width: 260, height: 260, bottom: '-70px', left: '-40px', opacity: 0.14 })] },
        elements: [
          { id: genId(), type: 'label', content: 'Foundations' },
          { id: genId(), type: 'heading', level: 2, content: 'What is GraphQL?', gradient: false, glow: false },
          { id: genId(), type: 'text', content: 'GraphQL is a query language and runtime for APIs that exposes a single endpoint and strongly typed schema, letting clients request exactly the fields they need.', variant: 'secondary' },
          {
            id: genId(), type: 'grid', columns: 2, children: [
              { id: genId(), type: 'card', variant: 'glass', icon: '🎯', title: 'Single endpoint, flexible queries', body: 'All queries, mutations, and subscriptions go through one URL, and the client shapes the response.' },
              { id: genId(), type: 'card', variant: 'glass', icon: '🧩', title: 'Strongly typed schema', body: 'A schema defines types and relationships, acting as a contract between client and server and enabling validation and introspection.' },
              { id: genId(), type: 'card', variant: 'glass', icon: '🌐', title: 'Nested, graph-shaped data', body: 'Clients can fetch related resources in a single query instead of chaining multiple endpoint calls.' },
              { id: genId(), type: 'card', variant: 'glass', icon: '⚡', title: 'Real-time via subscriptions', body: 'Subscriptions let clients get live updates (e.g. chats, notifications) over WebSockets.' },
            ],
          },
        ],
      },
      // Slide 5: REST vs GraphQL side by side
      {
        id: genId(),
        layout: 'top',
        hasParticles: false,
        background: { blobs: [cyanBlob({ opacity: 0.14 }), violetBlob({ opacity: 0.12 })] },
        elements: [
          { id: genId(), type: 'label', content: 'At a Glance' },
          { id: genId(), type: 'heading', level: 2, content: 'REST vs GraphQL in one slide', gradient: false, glow: false },
          {
            id: genId(), type: 'grid', columns: 2, children: [
              {
                id: genId(), type: 'card', variant: 'metric', icon: '🌍', title: 'REST',
                listItems: ['Multiple resource endpoints such as /users, /orders.', 'Server controls response shape; payloads can over- or under-fetch.', 'Leverages HTTP verbs, status codes, and caching (CDN, browser, proxy).', 'Simple mental model, great for CRUD-style and resource-centric APIs.'],
              },
              {
                id: genId(), type: 'card', variant: 'metric', icon: '🧬', title: 'GraphQL',
                listItems: ['Single endpoint with queries, mutations, and subscriptions.', 'Client specifies required fields, avoiding over- and under-fetching.', 'Strongly typed schema with introspection and self-documenting API.', 'Ideal for complex, frontend-driven apps needing flexible data access.'],
              },
            ],
          },
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
        elements: [
          { id: genId(), type: 'heading', level: 2, content: 'REST and GraphQL work best when used intentionally', gradient: true, glow: false },
          { id: genId(), type: 'text', content: 'REST remains a great default for simple, resource-based services, while GraphQL shines in complex, client-driven domains where flexibility and a unified graph pay off.', variant: 'secondary', align: 'center', maxWidth: '36rem' },
          { id: genId(), type: 'text', content: 'Questions? Discussion? Examples from your own stack?', variant: 'muted', align: 'center' },
        ],
      },
    ],
  }
}
