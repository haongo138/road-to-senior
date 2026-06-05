<script setup lang="ts">
defineProps<{ categories: { key: string; label: string }[]; active: string }>()
defineEmits<{ (e: 'select', key: string): void }>()
</script>

<template>
  <div class="rs-filter">
    <button
      v-for="c in categories"
      :key="c.key"
      class="rs-filter__btn"
      :class="{ 'is-active': c.key === active }"
      @click="$emit('select', c.key)"
    >
      {{ c.label }}
    </button>
  </div>
</template>
