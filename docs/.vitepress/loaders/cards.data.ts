import { createContentLoader } from 'vitepress'
import { buildCards, type CardItem, type RawPage } from '../theme/lib/cards'

declare const data: CardItem[]
export { data }

export default createContentLoader('**/*.md', {
  transform(raw): CardItem[] {
    const pages: RawPage[] = raw.map((p) => ({ url: p.url, frontmatter: p.frontmatter }))
    return buildCards(pages)
  },
})
