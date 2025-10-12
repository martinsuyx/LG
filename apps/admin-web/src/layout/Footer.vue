<template>
  <footer class="footer" role="contentinfo">
    <div class="left">{{ text }}</div>
    <div class="right">{{ versionLabel }} {{ version }}</div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: '© 2025 Joincom · Linggong Admin'
});

const text = computed(() => props.text);

const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v0.1.0';
const versionLabel = 'v';
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.footer {
  height: calc(#{$spacing-16} * 3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-12;
  padding: 0 $spacing-16;
  border-top: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
  color: $color-surface-500;
}
</style>
