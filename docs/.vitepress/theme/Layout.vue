<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import Lightbox from './components/Lightbox.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <Lightbox />
    </template>
  </Layout>
</template>
