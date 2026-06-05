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
      {
        text: 'Technical',
        items: [
          { text: 'Problem Solving', link: '/technical/dsa-roadmap' },
          { text: 'Tech Concepts', link: '/technical/concepts' },
        ],
      },
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
          text: 'Technical',
          items: [
            { text: 'Overview', link: '/technical/' },
            { text: 'Problem Solving', link: '/technical/dsa-roadmap' },
            { text: 'Tech Concepts', link: '/technical/concepts' },
          ],
        },
        {
          text: 'Problem Solving · Interview Method',
          collapsed: true,
          items: [
            { text: 'Interview Process (UMPIRE)', link: '/technical/interview-process' },
            { text: 'Communication & Whiteboard', link: '/technical/communication' },
            { text: 'Big-O Primer', link: '/technical/big-o' },
            { text: 'Study Plan', link: '/technical/study-plan' },
          ],
        },
        {
          text: 'Problem Solving · DSA Roadmap',
          collapsed: true,
          items: [
            { text: 'Trees & Recursion', link: '/technical/tree' },
            { text: 'Backtracking', link: '/technical/backtracking' },
            { text: 'Dynamic Programming', link: '/technical/dynamic-programming' },
            { text: 'Divide and Conquer', link: '/technical/divide-and-conquer' },
            { text: 'Graphs', link: '/technical/graph' },
            { text: 'Linked List', link: '/technical/linked-list' },
            { text: 'Hashmap', link: '/technical/hashmap' },
            { text: 'Prefix Sum', link: '/technical/prefix-sum' },
            { text: 'Strings', link: '/technical/strings' },
            { text: 'Sliding Window', link: '/technical/sliding-window' },
            { text: 'Two Pointers', link: '/technical/two-pointers' },
            { text: 'Intervals', link: '/technical/intervals' },
            { text: 'Heap & Stack', link: '/technical/heap-stack' },
            { text: 'Greedy', link: '/technical/greedy' },
            { text: 'Binary Search', link: '/technical/binary-search' },
          ],
        },
        {
          text: 'Problem Solving · Bonus',
          collapsed: true,
          items: [
            { text: 'Difference Array', link: '/technical/difference-array' },
            { text: 'Trie', link: '/technical/trie' },
            { text: 'Union-Find (DSU)', link: '/technical/union-find' },
            { text: 'Bit Manipulation', link: '/technical/bit-manipulation' },
            { text: 'Topological & Shortest Paths', link: '/technical/topological-shortest-path' },
          ],
        },
        {
          text: 'Tech Concepts · Concurrency & Reliability',
          collapsed: true,
          items: [
            { text: 'Transactional Outbox', link: '/technical/outbox' },
            { text: 'Saga Pattern', link: '/technical/saga' },
            { text: 'Two-Phase Commit', link: '/technical/two-phase-commit' },
            { text: 'Change Data Capture', link: '/technical/change-data-capture' },
            { text: 'Idempotency Keys', link: '/technical/idempotency' },
          ],
        },
        {
          text: 'Tech Concepts · Databases',
          collapsed: true,
          items: [
            { text: 'Database Indexing', link: '/technical/db-indexing' },
            { text: 'Transactions & Isolation', link: '/technical/transactions-isolation' },
            { text: 'Normalization', link: '/technical/normalization' },
            { text: 'Sharding & Replication', link: '/technical/sharding-replication' },
            { text: 'SQL vs NoSQL', link: '/technical/sql-vs-nosql' },
          ],
        },
        {
          text: 'Tech Concepts · Caching',
          collapsed: true,
          items: [
            { text: 'Cache Strategies', link: '/technical/cache-strategies' },
            { text: 'Cache Invalidation & Eviction', link: '/technical/cache-invalidation' },
          ],
        },
        {
          text: 'Tech Concepts · Messaging & Consistency',
          collapsed: true,
          items: [
            { text: 'Queues vs Streams', link: '/technical/queues-vs-streams' },
            { text: 'Delivery Semantics', link: '/technical/delivery-semantics' },
            { text: 'CAP Theorem', link: '/technical/cap-theorem' },
            { text: 'Eventual Consistency', link: '/technical/eventual-consistency' },
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
