<template>
  <section class="risk-config">
    <header class="risk-config__header">
      <div>
        <h1 class="risk-config__title">黑白名单与规则</h1>
        <p class="risk-config__subtitle">维护名单库与规则策略，支持导入、仿真与灰度发布。</p>
      </div>
      <nav class="risk-config__tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="risk-config__tab"
          :data-active="activeTab === tab.value"
          role="tab"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <ListsView v-if="activeTab === 'lists'" />
    <RulesView v-else />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ListsView from '@/views/risk/ListsView.vue';
import RulesView from '@/views/risk/RulesView.vue';

const tabs = [
  { value: 'lists', label: '名单' },
  { value: 'rules', label: '规则' }
];

const activeTab = ref<'lists' | 'rules'>('lists');
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.risk-config {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.risk-config__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.risk-config__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.risk-config__subtitle {
  margin: 0;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.risk-config__tabs {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
  background: $surface-50;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  padding: $spacing-8;
}

.risk-config__tab {
  border: none;
  background: transparent;
  padding: $spacing-8 $spacing-16;
  border-radius: $radius-lg;
  font: inherit;
  cursor: pointer;
  color: $text-muted;
  &[data-active='true'] {
    background: $surface-0;
    color: $text-strong;
    box-shadow: 0 4px 12px rgba($color-surface-700, 0.08);
  }
}
</style>
