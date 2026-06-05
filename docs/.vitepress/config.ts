import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  title: 'Road to Senior',
  description: 'Notes & patterns on the way to passing the senior SWE interview',
  base: '/road-to-senior/',
  cleanUrls: true,
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
  },
  mermaid: {},
})
