import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROADMAP, stageCoverage, totalCoverage, type RoadmapStage } from './roadmap'

const DOCS = resolve(__dirname, '../../..')

describe('roadmap coverage', () => {
  const stage: RoadmapStage = {
    title: 's',
    summary: '',
    topics: [
      { title: 'a', items: [{ label: 'x', link: '/x' }, { label: 'y' }] },
      { title: 'b', items: [{ label: 'z', link: '/z' }] },
    ],
  }

  it('counts linked items per stage', () => {
    expect(stageCoverage(stage)).toEqual({ covered: 2, total: 3 })
  })

  it('sums across stages', () => {
    expect(totalCoverage([stage, stage])).toEqual({ covered: 4, total: 6 })
  })
})

describe('roadmap links', () => {
  // Links render inside a Vue component, so VitePress's dead-link check never sees them.
  const links = ROADMAP.flatMap((s) => s.topics.flatMap((t) => t.items.map((i) => i.link))).filter(
    (l): l is string => Boolean(l),
  )

  it.each(links)('%s points at an existing note', (link) => {
    const file = link.endsWith('/') ? `${link}index.md` : `${link}.md`
    expect(existsSync(DOCS + file)).toBe(true)
  })
})
