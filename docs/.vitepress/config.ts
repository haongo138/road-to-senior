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
          { text: 'Problem Solving', link: '/technical/problem-solving/dsa-roadmap' },
          { text: 'Tech Concepts', link: '/technical/concepts/concepts' },
        ],
      },
      { text: 'Behavioral', link: '/behavioral/' },
      { text: 'Notes', link: '/notes/' },
      { text: 'Tools', link: '/tools/' },
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
            { text: 'Overview (C4 model)', link: '/system-design/' },
            { text: 'Rate Limiter', link: '/system-design/rate-limiter' },
            { text: 'URL Shortener', link: '/system-design/url-shortener' },
            { text: 'News Feed', link: '/system-design/news-feed' },
            { text: 'Realtime Chat', link: '/system-design/realtime-chat' },
            { text: 'Payment System', link: '/system-design/payment' },
            { text: 'Video Streaming', link: '/system-design/video-streaming' },
          ],
        },
      ],
      '/technical/problem-solving/': [
        {
          text: 'Problem Solving',
          items: [
            { text: 'DSA Roadmap', link: '/technical/problem-solving/dsa-roadmap' },
            { text: '↩ Technical home', link: '/technical/' },
          ],
        },
        {
          text: 'Interview Method',
          items: [
            { text: 'Interview Process (UMPIRE)', link: '/technical/problem-solving/interview-process' },
            { text: 'Communication & Whiteboard', link: '/technical/problem-solving/communication' },
            { text: 'Big-O Primer', link: '/technical/problem-solving/big-o' },
            { text: 'Study Plan', link: '/technical/problem-solving/study-plan' },
          ],
        },
        {
          text: 'DSA Roadmap',
          items: [
            { text: 'Trees & Recursion', link: '/technical/problem-solving/tree' },
            { text: 'Backtracking', link: '/technical/problem-solving/backtracking' },
            { text: 'Dynamic Programming', link: '/technical/problem-solving/dynamic-programming' },
            { text: 'Divide and Conquer', link: '/technical/problem-solving/divide-and-conquer' },
            { text: 'Graphs', link: '/technical/problem-solving/graph' },
            { text: 'Linked List', link: '/technical/problem-solving/linked-list' },
            { text: 'Hashmap', link: '/technical/problem-solving/hashmap' },
            { text: 'Prefix Sum', link: '/technical/problem-solving/prefix-sum' },
            { text: 'Strings', link: '/technical/problem-solving/strings' },
            { text: 'Sliding Window', link: '/technical/problem-solving/sliding-window' },
            { text: 'Two Pointers', link: '/technical/problem-solving/two-pointers' },
            { text: 'Intervals', link: '/technical/problem-solving/intervals' },
            { text: 'Heap & Stack', link: '/technical/problem-solving/heap-stack' },
            { text: 'Greedy', link: '/technical/problem-solving/greedy' },
            { text: 'Binary Search', link: '/technical/problem-solving/binary-search' },
          ],
        },
        {
          text: 'Bonus (if time)',
          collapsed: true,
          items: [
            { text: 'Difference Array', link: '/technical/problem-solving/difference-array' },
            { text: 'Trie', link: '/technical/problem-solving/trie' },
            { text: 'Union-Find (DSU)', link: '/technical/problem-solving/union-find' },
            { text: 'Bit Manipulation', link: '/technical/problem-solving/bit-manipulation' },
            { text: 'Topological & Shortest Paths', link: '/technical/problem-solving/topological-shortest-path' },
          ],
        },
      ],
      '/technical/concepts/': [
        {
          text: 'Technical Concepts',
          items: [
            { text: 'Overview', link: '/technical/concepts/concepts' },
            { text: '↩ Technical home', link: '/technical/' },
          ],
        },
        {
          text: 'Concurrency & Reliability',
          items: [
            { text: 'Transactional Outbox', link: '/technical/concepts/outbox' },
            { text: 'Saga Pattern', link: '/technical/concepts/saga' },
            { text: 'Two-Phase Commit', link: '/technical/concepts/two-phase-commit' },
            { text: 'Change Data Capture', link: '/technical/concepts/change-data-capture' },
            { text: 'Idempotency Keys', link: '/technical/concepts/idempotency' },
          ],
        },
        {
          text: 'Databases',
          items: [
            { text: 'Database Indexing', link: '/technical/concepts/db-indexing' },
            { text: 'Transactions & Isolation', link: '/technical/concepts/transactions-isolation' },
            { text: 'Normalization', link: '/technical/concepts/normalization' },
            { text: 'Sharding & Replication', link: '/technical/concepts/sharding-replication' },
            { text: 'SQL vs NoSQL', link: '/technical/concepts/sql-vs-nosql' },
          ],
        },
        {
          text: 'Caching',
          items: [
            { text: 'Cache Strategies', link: '/technical/concepts/cache-strategies' },
            { text: 'Cache Invalidation & Eviction', link: '/technical/concepts/cache-invalidation' },
          ],
        },
        {
          text: 'Messaging & Consistency',
          items: [
            { text: 'Queues vs Streams', link: '/technical/concepts/queues-vs-streams' },
            { text: 'Delivery Semantics', link: '/technical/concepts/delivery-semantics' },
            { text: 'CAP Theorem', link: '/technical/concepts/cap-theorem' },
            { text: 'Eventual Consistency', link: '/technical/concepts/eventual-consistency' },
          ],
        },
        {
          text: 'Auth & Tokens',
          collapsed: true,
          items: [
            { text: 'JSON Web Tokens (JWT)', link: '/technical/concepts/jwt' },
            { text: 'OAuth 2.0', link: '/technical/concepts/oauth2' },
            { text: 'OpenID Connect (OIDC)', link: '/technical/concepts/openid-connect' },
            { text: 'Access & Refresh Tokens', link: '/technical/concepts/access-refresh-tokens' },
          ],
        },
        {
          text: 'OOP & Design',
          collapsed: true,
          items: [
            { text: 'SOLID & OOP', link: '/technical/concepts/solid-and-oop' },
            { text: 'Cohesion & Coupling', link: '/technical/concepts/cohesion-coupling' },
            { text: 'Composition over Inheritance', link: '/technical/concepts/composition-over-inheritance' },
          ],
        },
        {
          text: 'Go (Golang) · Concurrency',
          collapsed: true,
          items: [
            { text: 'Goroutines & the Scheduler', link: '/technical/concepts/go-goroutines-scheduler' },
            { text: 'Channels & select', link: '/technical/concepts/go-channels-select' },
            { text: 'context.Context', link: '/technical/concepts/go-context' },
            { text: 'sync Primitives', link: '/technical/concepts/go-sync-primitives' },
            { text: 'Channels vs Mutexes', link: '/technical/concepts/go-channels-vs-mutexes' },
            { text: 'Data Races & Memory Model', link: '/technical/concepts/go-data-races' },
            { text: 'Concurrency Patterns', link: '/technical/concepts/go-concurrency-patterns' },
            { text: 'Goroutine Leaks', link: '/technical/concepts/go-goroutine-leaks' },
          ],
        },
        {
          text: 'Go (Golang) · Runtime & Semantics',
          collapsed: true,
          items: [
            { text: 'GC & Escape Analysis', link: '/technical/concepts/go-gc-escape-analysis' },
            { text: 'Interfaces & nil gotcha', link: '/technical/concepts/go-interfaces' },
            { text: 'Slices & Maps Internals', link: '/technical/concepts/go-slices-maps' },
            { text: 'defer, panic, recover', link: '/technical/concepts/go-defer-panic-recover' },
            { text: 'Error Handling', link: '/technical/concepts/go-error-handling' },
            { text: 'Generics', link: '/technical/concepts/go-generics' },
          ],
        },
      ],
      '/technical/': [
        {
          text: 'Technical',
          items: [
            { text: 'Overview', link: '/technical/' },
            { text: 'Problem Solving', link: '/technical/problem-solving/dsa-roadmap' },
            { text: 'Tech Concepts', link: '/technical/concepts/concepts' },
          ],
        },
      ],
      '/behavioral/': [
        {
          text: 'Behavioral',
          items: [
            { text: 'Overview', link: '/behavioral/' },
            { text: 'STAR-L Method', link: '/behavioral/star-method' },
          ],
        },
        {
          text: 'Questions · Core',
          items: [
            { text: 'Conflict with a Teammate', link: '/behavioral/conflict-with-teammate' },
            { text: 'Hardest Technical Problem', link: '/behavioral/hardest-technical-problem' },
            { text: 'A Failure or Mistake', link: '/behavioral/failure-or-mistake' },
            { text: 'Disagreed with Your Manager', link: '/behavioral/disagreed-with-manager' },
            { text: 'Led a Project', link: '/behavioral/led-a-project' },
          ],
        },
        {
          text: 'Questions · Influence & Collaboration',
          collapsed: true,
          items: [
            { text: 'Influencing Without Authority', link: '/behavioral/influence-without-authority' },
            { text: 'Difficult Feedback', link: '/behavioral/difficult-feedback' },
            { text: 'Mentoring Someone', link: '/behavioral/mentoring' },
          ],
        },
        {
          text: 'Questions · Execution & Ownership',
          collapsed: true,
          items: [
            { text: 'Tight Deadline / Priorities', link: '/behavioral/tight-deadline-priorities' },
            { text: 'Owned an Ambiguous Problem', link: '/behavioral/ambiguous-ownership' },
            { text: 'Production Incident / Outage', link: '/behavioral/production-incident' },
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
      '/tools/': [
        {
          text: 'Tools',
          items: [
            { text: 'Overview', link: '/tools/' },
          ],
        },
        {
          text: 'Toolbox',
          items: [
            { text: 'Languages', link: '/tools/languages' },
            { text: 'Backend & Web', link: '/tools/backend-web' },
            { text: 'Data & Storage', link: '/tools/data-storage' },
            { text: 'Infra & DevOps', link: '/tools/infra-devops' },
            { text: 'Observability', link: '/tools/observability' },
            { text: 'Testing', link: '/tools/testing' },
          ],
        },
      ],
    },
  },
  mermaid: {},
})
