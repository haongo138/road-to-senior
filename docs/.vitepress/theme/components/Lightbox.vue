<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// A single global lightbox. Click any diagram or image in the docs to zoom it
// to fill the screen; close via the ✕ button, Esc, or clicking the backdrop.

type Mode = 'img' | 'svg'

const open = ref(false)
const mode = ref<Mode>('img')
const imgSrc = ref('')
const imgAlt = ref('')
const svgHtml = ref('')

function show() {
  open.value = true
  // Lock background scroll while zoomed.
  document.documentElement.style.overflow = 'hidden'
}

function close() {
  open.value = false
  document.documentElement.style.overflow = ''
}

function openImg(el: HTMLImageElement) {
  mode.value = 'img'
  imgSrc.value = el.currentSrc || el.src
  imgAlt.value = el.alt || ''
  show()
}

function openSvg(svg: SVGElement) {
  mode.value = 'svg'
  svgHtml.value = svg.outerHTML
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
  document.documentElement.style.overflow = ''
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
        <div v-else class="lb-content lb-svg" v-html="svgHtml"></div>
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
  display: flex;
  background: var(--vp-c-bg);
  padding: 1.5rem 2rem;
  overflow: auto;
}
.lb-svg :deep(svg) {
  width: auto;
  height: auto;
  max-width: 88vw;
  max-height: 86vh;
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
