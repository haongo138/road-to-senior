import { describe, it, expect } from 'vitest'
import { buildCards, filterByCategory, collectTags, type RawPage } from './cards'

const pages: RawPage[] = [
  { url: '/system-design/rate-limiter', frontmatter: { title: 'Rate Limiter', description: 'd', category: 'system-design', tags: ['scaling', 'api'], status: 'solid' } },
  { url: '/technical/idempotency', frontmatter: { title: 'Idempotency', description: 'd', category: 'technical', tags: ['api'], status: 'review' } },
  { url: '/system-design/', frontmatter: { title: 'Overview' } },
  { url: '/', frontmatter: { layout: 'home' } },
]

describe('buildCards', () => {
  it('keeps only pages with a title and a known category', () => {
    const cards = buildCards(pages)
    expect(cards.map((c) => c.url)).toEqual(['/technical/idempotency', '/system-design/rate-limiter'])
  })

  it('sorts by title and applies frontmatter defaults', () => {
    const cards = buildCards(pages)
    expect(cards[0].title).toBe('Idempotency')
    expect(cards[0].tags).toEqual(['api'])
    expect(cards[1].status).toBe('solid')
  })
})

describe('filterByCategory', () => {
  it('returns all cards for "all"', () => {
    expect(filterByCategory(buildCards(pages), 'all')).toHaveLength(2)
  })
  it('filters to a single category', () => {
    const only = filterByCategory(buildCards(pages), 'technical')
    expect(only.map((c) => c.url)).toEqual(['/technical/idempotency'])
  })
})

describe('collectTags', () => {
  it('counts tags across cards, sorted by count then name', () => {
    expect(collectTags(buildCards(pages))).toEqual([
      { tag: 'api', count: 2 },
      { tag: 'scaling', count: 1 },
    ])
  })
})
