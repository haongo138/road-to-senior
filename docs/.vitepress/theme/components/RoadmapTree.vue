<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'
import { ROADMAP, stageCoverage, totalCoverage } from '../lib/roadmap'

// Accordion: native <details> handles keyboard + a11y; we track the one open
// stage so opening another closes the previous.
const openIndex = ref<number | null>(0)
const total = totalCoverage(ROADMAP)

function onToggle(i: number, e: Event) {
  const isOpen = (e.target as HTMLDetailsElement).open
  if (isOpen) openIndex.value = i
  else if (openIndex.value === i) openIndex.value = null
}
</script>

<template>
  <section class="rs-roadmap" aria-label="Forward Deployed Engineer roadmap">
    <div class="rs-roadmap__bar">
      <p class="rs-roadmap__legend">
        <span class="rs-roadmap__dot rs-roadmap__dot--done" /> has a note
        <span class="rs-roadmap__dot" /> planned
        <span class="rs-roadmap__count">{{ total.covered }}/{{ total.total }} covered</span>
      </p>
    </div>

    <ol class="rs-roadmap__stages">
      <li v-for="(stage, i) in ROADMAP" :key="stage.title" class="rs-roadmap__stage">
        <details :open="openIndex === i" @toggle="onToggle(i, $event)">
          <summary class="rs-roadmap__summary">
            <span class="rs-roadmap__num">{{ i + 1 }}</span>
            <span class="rs-roadmap__head">
              <span class="rs-roadmap__title">{{ stage.title }}</span>
              <span class="rs-roadmap__desc">{{ stage.summary }}</span>
            </span>
            <span class="rs-roadmap__meter">
              {{ stageCoverage(stage).covered }}/{{ stageCoverage(stage).total }}
            </span>
            <svg class="rs-roadmap__chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </summary>

          <ul class="rs-roadmap__topics">
            <li v-for="topic in stage.topics" :key="topic.title" class="rs-roadmap__topic">
              <span class="rs-roadmap__topic-title">{{ topic.title }}</span>
              <ul class="rs-roadmap__items">
                <li v-for="item in topic.items" :key="item.label" class="rs-roadmap__item">
                  <a v-if="item.link" :href="withBase(item.link)" class="rs-roadmap__leaf rs-roadmap__leaf--done">
                    {{ item.label }}
                  </a>
                  <span v-else class="rs-roadmap__leaf">{{ item.label }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </details>
      </li>
    </ol>
  </section>
</template>
