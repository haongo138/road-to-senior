import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import '@fontsource-variable/dm-sans/index.css'
import Layout from './Layout.vue'
import CardGrid from './components/CardGrid.vue'
import TagsPage from './components/TagsPage.vue'
import './custom.css'

// --- Language persistence ------------------------------------------------
// VitePress derives locale from the URL path alone, so navigating via the
// top-nav or a cross-link drops you back to English. We remember the chosen
// language in localStorage and auto-route to the translated counterpart when
// one exists. Only the Behavioral section + home are translated, so the
// preference is a no-op everywhere else.
const BASE = '/road-to-senior/'
const LANG_KEY = 'rts-lang'
// URL prefixes whose pages are fully translated under /vi/. Every page below
// these (plus the home page) has a Vietnamese counterpart, so the language
// preference can safely auto-route between locales within them.
const TRANSLATED_PREFIXES = ['/behavioral/', '/technical/concepts/']

function normalize(raw: string): string {
  let p = raw.split('?')[0].split('#')[0]
  if (p === BASE || p === BASE.slice(0, -1)) return '/'
  if (p.startsWith(BASE)) p = '/' + p.slice(BASE.length)
  if (!p.startsWith('/')) p = '/' + p
  return p
}

function withBase(logical: string): string {
  return BASE.slice(0, -1) + logical
}

function isVi(logical: string): boolean {
  return logical === '/vi' || logical === '/vi/' || logical.startsWith('/vi/')
}

// Same page ignoring the locale prefix — used to detect the language switcher.
function sameLogicalPage(a: string, b: string): boolean {
  const strip = (p: string) => (isVi(p) ? p.slice(3) || '/' : p)
  return strip(a) === strip(b)
}

function toViCounterpart(logical: string): string | null {
  if (logical === '/') return '/vi/'
  if (TRANSLATED_PREFIXES.some((p) => logical.startsWith(p))) return '/vi' + logical
  return null
}

function toEnCounterpart(logical: string): string | null {
  if (logical === '/vi' || logical === '/vi/') return '/'
  if (logical.startsWith('/vi/')) {
    const stripped = logical.slice(3) // drop the leading '/vi'
    if (TRANSLATED_PREFIXES.some((p) => stripped.startsWith(p))) return stripped
  }
  return null
}

function getPref(): string | null {
  try {
    return localStorage.getItem(LANG_KEY)
  } catch {
    return null
  }
}

function setPref(v: string): void {
  try {
    localStorage.setItem(LANG_KEY, v)
  } catch {
    /* ignore */
  }
}

// Returns a redirect target (with base) if the preference should move the user
// to the other locale; otherwise records/keeps the preference and returns null.
function resolveRedirect(toRaw: string, fromRaw?: string): string | null {
  const to = normalize(toRaw)
  const toVi = isVi(to)

  // Explicit language switch (same page, other locale): honor + remember it.
  if (fromRaw) {
    const from = normalize(fromRaw)
    if (isVi(from) !== toVi && sameLogicalPage(to, from)) {
      setPref(toVi ? 'vi' : 'en')
      return null
    }
  }

  const pref = getPref()
  if (pref === 'vi' && !toVi) {
    const t = toViCounterpart(to)
    if (t) return withBase(t)
  }
  if (pref === 'en' && toVi) {
    const t = toEnCounterpart(to)
    if (t) return withBase(t)
  }

  // Being on a Vietnamese page implies a Vietnamese preference.
  if (toVi) setPref('vi')
  return null
}

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router }) {
    app.component('CardGrid', CardGrid)
    app.component('TagsPage', TagsPage)

    if (typeof window === 'undefined' || !router) return

    // Client-side navigations.
    const origBefore = router.onBeforeRouteChange
    router.onBeforeRouteChange = (to: string) => {
      const target = resolveRedirect(to, router.route.path)
      if (target && normalize(target) !== normalize(to)) {
        router.go(target)
        return false
      }
      return origBefore ? origBefore.call(router, to) : undefined
    }

    // Initial full-page load (onBeforeRouteChange doesn't fire for it).
    const initial = resolveRedirect(window.location.pathname)
    if (initial && normalize(initial) !== normalize(window.location.pathname)) {
      router.go(initial)
    }
  },
} satisfies Theme
