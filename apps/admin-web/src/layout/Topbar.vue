<template>
  <header class="topbar">
    <button class="hamburger" @click="$emit('toggleSidebar')" aria-label="Toggle Sidebar">☰</button>
    <div class="project" v-if="project">{{ project }}</div>
    <div class="spacer" />
    <div class="actions">
      <button class="icon-btn" aria-label="Search">🔍</button>
      <button class="icon-btn" aria-label="Notifications">🔔</button>
      <div class="avatar" title="Me">F</div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ project?: string }>();
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.topbar {
  height: calc(#{$spacing-16} * 3.5);
  display: flex;
  align-items: center;
  gap: $spacing-12;
  padding: 0 $spacing-16;
  border-bottom: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
}

.hamburger {
  background: transparent;
  border: 0;
  font-size: calc(#{$font-size-16} * 1.25);
  cursor: pointer;
  padding: $spacing-8;
  border-radius: $radius-8;
}

.hamburger:focus-visible {
  outline: $border-width-1 solid $color-primary-300;
}

.project {
  font-weight: $font-weight-semibold;
  color: $color-text-strong;
}

.spacer {
  flex: 1;
}

.actions {
  display: flex;
  align-items: center;
  gap: $spacing-8;
}

.icon-btn {
  width: calc(#{$spacing-12} * 3);
  height: calc(#{$spacing-12} * 3);
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-300;
  background: $color-surface-0;
  cursor: pointer;
}

.avatar {
  width: calc(#{$spacing-8} * 4);
  height: calc(#{$spacing-8} * 4);
  border-radius: 50%;
  background: $color-primary-700;
  color: $color-text-on-primary;
  display: grid;
  place-items: center;
  font-weight: $font-weight-semibold;
}
</style>
