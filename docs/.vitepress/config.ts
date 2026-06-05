import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  title: 'Road to Senior',
  description: 'Notes & patterns on the way to passing the senior SWE interview',
  base: '/road-to-senior/',
  cleanUrls: true,
  srcExclude: ['superpowers/**'],
  themeConfig: {
    search: { provider: 'local' },
    nav: [
      { text: 'System Design', link: '/system-design/' },
      { text: 'Technical', link: '/technical/' },
      { text: 'Behavioral', link: '/behavioral/' },
      { text: 'Notes', link: '/notes/' },
      { text: 'Tags', link: '/tags' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/haongo138/road-to-senior' },
    ],
    sidebar: {
      '/system-design/': [
        {
          text: 'System Design',
          items: [
            { text: 'Overview', link: '/system-design/' },
            { text: 'Rate Limiter', link: '/system-design/rate-limiter' },
          ],
        },
      ],
      '/technical/': [
        {
          text: 'Technical Patterns',
          items: [
            { text: 'Overview', link: '/technical/' },
            { text: 'DSA Roadmap', link: '/technical/dsa-roadmap' },
            { text: 'Idempotency Keys', link: '/technical/idempotency' },
          ],
        },
        {
          text: 'DSA Roadmap',
          items: [
            { text: 'Trees & Recursion', link: '/technical/tree' },
            { text: 'Backtracking', link: '/technical/backtracking' },
            { text: 'Dynamic Programming', link: '/technical/dynamic-programming' },
            { text: 'Divide and Conquer', link: '/technical/divide-and-conquer' },
            { text: 'Graphs', link: '/technical/graph' },
            { text: 'Hashmap', link: '/technical/hashmap' },
            { text: 'Prefix Sum', link: '/technical/prefix-sum' },
            { text: 'Strings', link: '/technical/strings' },
            { text: 'Sliding Window', link: '/technical/sliding-window' },
            { text: 'Two Pointers', link: '/technical/two-pointers' },
            { text: 'Heap & Stack', link: '/technical/heap-stack' },
            { text: 'Binary Search', link: '/technical/binary-search' },
          ],
        },
        {
          text: 'Bonus (if time)',
          items: [
            { text: 'Difference Array', link: '/technical/difference-array' },
            { text: 'Trie', link: '/technical/trie' },
            { text: 'Union-Find (DSU)', link: '/technical/union-find' },
            { text: 'Topological & Shortest Paths', link: '/technical/topological-shortest-path' },
          ],
        },
      ],
      '/behavioral/': [
        {
          text: 'Behavioral',
          items: [
            { text: 'Overview', link: '/behavioral/' },
            { text: 'STAR Method', link: '/behavioral/star-method' },
          ],
        },
      ],
      '/notes/': [
        {
          text: 'Notes',
          items: [
            { text: 'Overview', link: '/notes/' },
            { text: 'How I use this site', link: '/notes/welcome' },
          ],
        },
      ],
    },
  },
  mermaid: {},
})
