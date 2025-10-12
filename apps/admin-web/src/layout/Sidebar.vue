<template>
  <div class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="brand" @click="$emit('toggle')">
      <div class="logo" aria-hidden="true">LG</div>
      <div class="title" v-if="!collapsed">Joincom · LG Admin</div>
    </div>

    <nav class="nav" role="navigation" aria-label="Left Navigation">
      <ul class="tree">
        <template v-for="group in nav" :key="group.key">
          <li class="group">
            <div class="group-label" :title="t(group.label)">
              <i class="icon" :class="group.icon" aria-hidden="true" />
              <span v-if="!collapsed">{{ t(group.label) }}</span>
            </div>
            <ul class="children">
              <li v-for="item in group.children" :key="item.key" v-show="!item.hidden">
                <RouterLink
                  :to="item.path!"
                  class="link"
                  :class="{ active: isActive(item.path!) }"
                  :title="t(item.label)"
                >
                  <i class="icon" :class="item.icon" aria-hidden="true" />
                  <span v-if="!collapsed">{{ t(item.label) }}</span>
                </RouterLink>
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { NavItem } from '@/config/nav';

defineProps<{ collapsed?: boolean; nav: NavItem[]; 'active-path': string }>();

const route = useRoute();
const { t } = useI18n({ useScope: 'global' });

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.sidebar {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: $spacing-12;
  padding: $spacing-16;
  border-bottom: $border-width-1 solid $color-surface-200;
  cursor: pointer;
}

.logo {
  width: calc(#{$spacing-8} * 4);
  height: calc(#{$spacing-8} * 4);
  border-radius: $radius-8;
  background: $color-primary-700;
  color: $color-text-on-primary;
  display: grid;
  place-items: center;
  font-weight: $font-weight-semibold;
}

.title {
  color: $color-text-strong;
  font-size: $font-size-16;
  line-height: $font-line-height-16;
  font-weight: $font-weight-semibold;
}

.nav {
  padding: $spacing-8;
  overflow: auto;
}

.group {
  margin-bottom: $spacing-8;
}

.group-label {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  color: $color-surface-500;
  padding: $spacing-8 $spacing-12;
  font-size: $font-size-12;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.children {
  list-style: none;
  padding-left: 0;
}

.link {
  display: flex;
  align-items: center;
  gap: $spacing-12;
  padding: $spacing-10 $spacing-12;
  color: $color-surface-700;
  border-radius: $radius-8;
  text-decoration: none;
}

.link:hover {
  background: $color-surface-100;
}

.link.active {
  background: $color-primary-50;
  color: $color-primary-700;
  font-weight: $font-weight-medium;
}

.is-collapsed .group-label span,
.is-collapsed .link span {
  display: none;
}
</style>
