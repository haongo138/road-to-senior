<script setup lang="ts">
import { withBase } from 'vitepress'
import { data as cards } from '../../loaders/cards.data'
import { collectTags } from '../lib/cards'

const tags = collectTags(cards)
const cardsFor = (tag: string) => cards.filter((c) => c.tags.includes(tag))
</script>

<template>
  <div v-if="tags.length" class="rs-tags">
    <section v-for="{ tag, count } in tags" :key="tag" class="rs-tags__section">
      <h2 :id="tag">#{{ tag }} <small>({{ count }})</small></h2>
      <ul>
        <li v-for="c in cardsFor(tag)" :key="c.url">
          <a :href="withBase(c.url)">{{ c.title }}</a> — <em>{{ c.category }}</em>
        </li>
      </ul>
    </section>
  </div>
  <p v-else>No tags yet — add <code>tags</code> to your note frontmatter.</p>
</template>
