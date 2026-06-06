<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// A single global lightbox. Click any diagram or image in the docs to zoom it
// to fill the screen; close via the ✕ button, Esc, or clicking the backdrop.

type Mode = 'img' | 'svg'

const open = ref(false)
const mode = ref<Mode>('img')
const imgSrc = ref('')
const imgAlt = ref('')
const svgHtml = ref('')
// Box that wraps the scaled SVG; sized to the diagram's scaled dimensions.
const svgBox = reactive({ width: '0px', height: '0px' })

// Lock scroll on <body> (not <html>): the Mermaid plugin runs a MutationObserver
// on <html> attributes and re-renders — blanking diagrams — if we touch its style.
let savedScrollY = 0

function lockScroll() {
  savedScrollY = window.scrollY
  const body = document.body
  body.style.position = 'fixed'
  body.style.top = `-${savedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
}

function unlockScroll() {
  const body = document.body
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  window.scrollTo(0, savedScrollY)
}

function show() {
  open.value = true
  lockScroll()
}

function close() {
  open.value = false
  unlockScroll()
}

function openImg(el: HTMLImageElement) {
  mode.value = 'img'
  imgSrc.value = el.currentSrc || el.src
  imgAlt.value = el.alt || ''
  show()
}

function openSvg(svg: SVGElement) {
  // Scale the diagram to fill the screen with a CSS transform — this enlarges the
  // rendered content regardless of how Mermaid sized its <svg> (viewBox, inline
  // max-width, width="100%", etc.). We size a wrapper box to the scaled dimensions
  // so the overlay can center it.
  const rect = svg.getBoundingClientRect()
  const natW = rect.width || 800
  const natH = rect.height || 450
  const scale = Math.min(
    (window.innerWidth * 0.92) / natW,
    (window.innerHeight * 0.88) / natH,
  )

  const clone = svg.cloneNode(true) as SVGElement
  clone.removeAttribute('width')
  clone.removeAttribute('height')
  clone.style.width = `${natW}px`
  clone.style.height = `${natH}px`
  clone.style.maxWidth = 'none'
  clone.style.maxHeight = 'none'
  clone.style.transform = `scale(${scale})`
  clone.style.transformOrigin = 'top left'
  clone.style.display = 'block'

  svgBox.width = `${Math.round(natW * scale)}px`
  svgBox.height = `${Math.round(natH * scale)}px`
  mode.value = 'svg'
  svgHtml.value = clone.outerHTML
  show()
}

function onDocClick(e: MouseEvent) {
  // Respect modified clicks (open-in-new-tab, etc.) and already-handled events.
  if (e.defaultPrevented || e.button !== 0) return
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

  const t = e.target as HTMLElement | null
  if (!t || typeof t.closest !== 'function') return
  if (t.closest('.lb-overlay')) return // clicks inside the lightbox

  const img = t.closest('.vp-doc img') as HTMLImageElement | null
  if (img) {
    e.preventDefault()
    openImg(img)
    return
  }

  const mer = t.closest('.mermaid') as HTMLElement | null
  if (mer) {
    const svg = mer.querySelector('svg')
    if (svg) openSvg(svg as unknown as SVGElement)
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  if (open.value) unlockScroll()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lb-fade">
      <div
        v-if="open"
        class="lb-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Zoomed image"
        @click.self="close"
      >
        <button class="lb-close" aria-label="Close" title="Close (Esc)" @click="close">
          ✕
        </button>
        <img v-if="mode === 'img'" class="lb-content" :src="imgSrc" :alt="imgAlt" />
        <!-- svgHtml is our own Mermaid output (trusted, not user input) -->
        <div
          v-else
          class="lb-content lb-svg"
          :style="{ width: svgBox.width, height: svgBox.height }"
          v-html="svgHtml"
        ></div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lb-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vmin;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(2px);
  cursor: zoom-out;
}
.lb-content {
  max-width: 92vw;
  max-height: 92vh;
  object-fit: contain;
  cursor: default;
  border-radius: 8px;
}
.lb-svg {
  background: var(--vp-c-bg);
  overflow: visible;
}
.lb-svg :deep(svg) {
  display: block;
  overflow: visible;
}
.lb-svg :deep(foreignObject) {
  overflow: visible;
}
.lb-close {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  line-height: 1;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  cursor: pointer;
  transition: background-color var(--rs-ease), transform var(--rs-ease);
}
.lb-close:hover {
  background: rgba(255, 255, 255, 0.26);
}
.lb-close:active {
  transform: scale(0.94);
}
.lb-close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity var(--rs-ease);
}
.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
}
</style>
