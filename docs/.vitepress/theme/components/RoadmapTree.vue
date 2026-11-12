<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import { ROADMAP, stageCoverage, totalCoverage } from '../lib/roadmap'

// Native <details> handles keyboard + a11y; we only mirror its open state so
// "expand all / collapse all" can drive it.
const open = ref<boolean[]>(ROADMAP.map((_, i) => i === 0))
const total = totalCoverage(ROADMAP)
const allOpen = computed(() => open.value.every(Boolean))

function setAll(value: boolean) {
  open.value = ROADMAP.map(() => value)
}

function onToggle(i: number, e: Event) {
  const isOpen = (e.target as HTMLDetailsElement).open
  if (open.value[i] !== isOpen) open.value = open.value.map((v, j) => (j === i ? isOpen : v))
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
      <button type="button" class="rs-roadmap__toggle" @click="setAll(!allOpen)">
        {{ allOpen ? 'Collapse all' : 'Expand all' }}
      </button>
    </div>

    <ol class="rs-roadmap__stages">
      <li v-for="(stage, i) in ROADMAP" :key="stage.title" class="rs-roadmap__stage">
        <details :open="open[i]" @toggle="onToggle(i, $event)">
          <summary class="rs-roadmap__summary">
            <span class="rs-roadmap__num">{{ i + 1 }}</span>
            <span class="rs-roadmap__head">
              <span class="rs-roadmap__title">{{ stage.title }}</span>
              <span class="rs-roadmap__desc">{{ stage.summary }}</span>
            </span>
            <span class="rs-roadmap__meter">
              {{ stageCoverage(stage).covered }}/{{ stageCoverage(stage).total }}
            </span>
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
