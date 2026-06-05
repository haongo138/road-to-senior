<script setup lang="ts">
import { ref, computed } from 'vue'
import { data as cards } from '../../loaders/cards.data'
import { filterByCategory } from '../lib/cards'
import Card from './Card.vue'
import TagFilter from './TagFilter.vue'

const categories = [
  { key: 'all', label: 'All' },
  { key: 'system-design', label: 'System Design' },
  { key: 'technical', label: 'Technical' },
  { key: 'behavioral', label: 'Behavioral' },
  { key: 'notes', label: 'Notes' },
]
const active = ref('all')
const visible = computed(() => filterByCategory(cards, active.value))
</script>

<template>
  <div class="rs-grid-wrap">
    <TagFilter :categories="categories" :active="active" @select="active = $event" />
    <div class="rs-grid">
      <Card v-for="c in visible" :key="c.url" :item="c" />
    </div>
    <p v-if="!visible.length" class="rs-grid__empty">No notes in this category yet.</p>
  </div>
</template>
