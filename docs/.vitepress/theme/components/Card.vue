<script setup lang="ts">
import { withBase } from 'vitepress'
import type { CardItem } from '../lib/cards'
defineProps<{ item: CardItem }>()
</script>

<template>
  <a class="rs-card" :href="withBase(item.url)">
    <span class="rs-card__badge">{{ item.category }}</span>
    <h3 class="rs-card__title">{{ item.title }}</h3>
    <p class="rs-card__desc">{{ item.description }}</p>
    <div class="rs-card__tags">
      <span v-for="t in item.tags" :key="t" class="rs-card__tag">#{{ t }}</span>
    </div>
  </a>
</template>
