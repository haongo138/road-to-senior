// FDE roadmap shown as an interactive tree on the home page.
// `link` points at an existing note (logical path, no base). No link = planned.
// Sources: Palantir decomposition/learning rounds, AI-lab FDE loops, fde.academy
// and systemdesign.academy 12-week plans (researched 2026-11-12).

export interface RoadmapItem {
  label: string
  link?: string
}

export interface RoadmapTopic {
  title: string
  items: RoadmapItem[]
}

export interface RoadmapStage {
  title: string
  summary: string
  topics: RoadmapTopic[]
}

export const ROADMAP: RoadmapStage[] = [
  {
    title: 'Engineering foundations',
    summary: 'Ship working code fast in the languages customers actually run.',
    topics: [
      {
        title: 'Languages',
        items: [
          { label: 'Python for scripting, data, and AI glue' },
          { label: 'TypeScript for quick internal tools and UIs' },
          { label: 'Go concurrency patterns', link: '/technical/concepts/go-concurrency-patterns' },
          { label: 'Go vs Java vs Rust', link: '/tools/go-vs-java-vs-rust' },
        ],
      },
      {
        title: 'Problem solving',
        items: [
          { label: 'DSA roadmap', link: '/technical/problem-solving/dsa-roadmap' },
          { label: 'Interview method (UMPIRE)', link: '/technical/problem-solving/interview-process' },
          { label: 'Big-O', link: '/technical/problem-solving/big-o' },
        ],
      },
      {
        title: 'Data & APIs',
        items: [
          { label: 'SQL vs NoSQL', link: '/technical/concepts/sql-vs-nosql' },
          { label: 'Indexing', link: '/technical/concepts/db-indexing' },
          { label: 'Transactions & isolation', link: '/technical/concepts/transactions-isolation' },
          { label: 'REST vs gRPC vs GraphQL', link: '/tools/rest-vs-grpc-vs-graphql' },
        ],
      },
    ],
  },
  {
    title: 'Integrations & data movement',
    summary: 'Get into the customer’s systems and move their messy data reliably.',
    topics: [
      {
        title: 'Auth into customer systems',
        items: [
          { label: 'OAuth 2.0', link: '/technical/concepts/oauth2' },
          { label: 'OpenID Connect', link: '/technical/concepts/openid-connect' },
          { label: 'JWT', link: '/technical/concepts/jwt' },
          { label: 'Access & refresh tokens', link: '/technical/concepts/access-refresh-tokens' },
        ],
      },
      {
        title: 'Pipelines',
        items: [
          { label: 'ETL and messy schema ingestion' },
          { label: 'Change data capture', link: '/technical/concepts/change-data-capture' },
          { label: 'Outbox pattern', link: '/technical/concepts/outbox' },
          { label: 'Queues vs streams', link: '/technical/concepts/queues-vs-streams' },
          { label: 'Kafka vs RabbitMQ', link: '/tools/kafka-vs-rabbitmq' },
        ],
      },
      {
        title: 'Reliability',
        items: [
          { label: 'Idempotency', link: '/technical/concepts/idempotency' },
          { label: 'Delivery semantics', link: '/technical/concepts/delivery-semantics' },
          { label: 'Integrating with legacy systems' },
        ],
      },
    ],
  },
  {
    title: 'Systems in production',
    summary: 'Design, deploy, and debug inside an environment you do not own.',
    topics: [
      {
        title: 'System design',
        items: [
          { label: 'C4 system design method', link: '/system-design/' },
          { label: 'Caching strategies', link: '/technical/concepts/cache-strategies' },
          { label: 'CAP theorem', link: '/technical/concepts/cap-theorem' },
          { label: 'Saga', link: '/technical/concepts/saga' },
        ],
      },
      {
        title: 'Deploy & operate',
        items: [
          { label: 'DevOps stack & flow', link: '/tools/devops-flow' },
          { label: 'Observability', link: '/tools/observability' },
          { label: 'Debugging in customer environments' },
          { label: 'Security & customer data handling' },
        ],
      },
    ],
  },
  {
    title: 'Applied AI',
    summary: 'Turn LLMs into systems a customer can trust, measure, and afford.',
    topics: [
      {
        title: 'LLM building blocks',
        items: [
          { label: 'Tokens, context windows, cost & latency', link: '/ai/tokens-cost-latency' },
          { label: 'Prompt & context engineering', link: '/ai/prompt-context-engineering' },
          { label: 'RAG pipelines', link: '/ai/rag' },
        ],
      },
      {
        title: 'Agents',
        items: [
          { label: 'Building effective agents', link: '/ai/building-effective-agents' },
          { label: 'Tool use & MCP servers', link: '/ai/tool-use-mcp' },
        ],
      },
      {
        title: 'Evals',
        items: [
          { label: 'Golden datasets & regression suites', link: '/ai/eval-datasets' },
          { label: 'Drift detection & failure tracking', link: '/ai/drift-detection' },
        ],
      },
    ],
  },
  {
    title: 'Customer craft',
    summary: 'Find the real problem behind the ask, then scope what ships.',
    topics: [
      {
        title: 'Discovery',
        items: [
          { label: 'Interviewing non-technical stakeholders' },
          { label: 'Turning vague asks into requirements' },
          { label: 'Scoping an MVP under a deadline' },
        ],
      },
      {
        title: 'Trust',
        items: [
          { label: 'Communicating while you build', link: '/technical/problem-solving/communication' },
          { label: 'Influence without authority', link: '/behavioral/influence-without-authority' },
          { label: 'Incidents & root cause analysis', link: '/behavioral/production-incident' },
          { label: 'Saying no to a customer' },
        ],
      },
    ],
  },
  {
    title: 'The FDE interview loop',
    summary: 'Rounds you will meet at Palantir-style and AI-lab FDE loops.',
    topics: [
      {
        title: 'Rounds',
        items: [
          { label: 'Decomposition (open-ended case)' },
          { label: 'Learning round' },
          { label: 'Re-engineering / debugging round' },
          { label: 'Practical coding', link: '/technical/problem-solving/interview-process' },
          { label: 'System design', link: '/system-design/' },
          { label: 'Behavioral (STAR-L)', link: '/behavioral/star-method' },
        ],
      },
    ],
  },
]

export interface Coverage {
  covered: number
  total: number
}

export function stageCoverage(stage: RoadmapStage): Coverage {
  const items = stage.topics.flatMap((t) => t.items)
  return { covered: items.filter((i) => i.link).length, total: items.length }
}

export function totalCoverage(stages: RoadmapStage[]): Coverage {
  return stages.map(stageCoverage).reduce(
    (acc, c) => ({ covered: acc.covered + c.covered, total: acc.total + c.total }),
    { covered: 0, total: 0 },
  )
}
