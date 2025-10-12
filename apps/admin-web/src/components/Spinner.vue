// =============================
// File: apps/admin-web/src/components/Spinner.vue
// =============================
<template>
  <svg class="jg-spin" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
    <circle class="track" cx="12" cy="12" r="10" fill="none" stroke-width="4" />
    <circle class="bar" cx="12" cy="12" r="10" fill="none" stroke-width="4" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
interface Props { size?: number }
withDefaults(defineProps<Props>(), { size: 16 })
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.jg-spin { display:block; }
.track { stroke: $color-surface-300; opacity: .6; }
.bar { stroke: $color-primary-700; stroke-dasharray: 80; stroke-dashoffset: 60; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); stroke-dashoffset: 20; } }
</style>

