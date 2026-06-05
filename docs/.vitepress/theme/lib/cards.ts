export interface RawPage {
  url: string
  frontmatter: Record<string, any>
}

export interface CardItem {
  title: string
  description: string
  url: string
  category: string
  tags: string[]
  status: string
}

export const CATEGORIES = ['system-design', 'technical', 'behavioral', 'notes'] as const
type Category = (typeof CATEGORIES)[number]

export function isContentCard(page: RawPage): boolean {
  const fm = page.frontmatter ?? {}
  return Boolean(fm.title) && CATEGORIES.includes(fm.category as Category)
}

export function toCard(page: RawPage): CardItem {
  const fm = page.frontmatter ?? {}
  return {
    title: fm.title,
    description: fm.description ?? '',
    url: page.url,
    category: fm.category,
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    status: fm.status ?? 'draft',
  }
}

export function buildCards(pages: RawPage[]): CardItem[] {
  return pages
    .filter(isContentCard)
    .map(toCard)
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function filterByCategory(cards: CardItem[], category: string): CardItem[] {
  return category === 'all' ? cards : cards.filter((c) => c.category === category)
}

export function collectTags(cards: CardItem[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const card of cards) {
    for (const tag of card.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
