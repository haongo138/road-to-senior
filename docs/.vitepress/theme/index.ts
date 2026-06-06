import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import '@fontsource-variable/dm-sans/index.css'
import Layout from './Layout.vue'
import CardGrid from './components/CardGrid.vue'
import TagsPage from './components/TagsPage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('CardGrid', CardGrid)
    app.component('TagsPage', TagsPage)
  },
} satisfies Theme
