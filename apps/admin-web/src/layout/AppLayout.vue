<template>
  <div class="app-shell" :class="{ 'is-collapsed': collapsed }">
    <aside class="app-sidebar">
      <Sidebar
        :collapsed="collapsed"
        :nav="filteredNav"
        :active-path="route.path"
        @toggle="collapsed = !collapsed"
      />
    </aside>

    <div class="app-main">
      <Topbar :project="TOPBAR.project" @toggleSidebar="collapsed = !collapsed" />
      <main class="app-content">
        <router-view />
      </main>
      <FooterBar :text="FOOTER.text" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { NAV, TOPBAR, FOOTER, type NavItem } from '@/config/nav';
import Sidebar from './Sidebar.vue';
import Topbar from './Topbar.vue';
import FooterBar from './Footer.vue';

const userRoles = ref<string[]>(['admin']);

const route = useRoute();
const collapsed = ref(false);

function filterByRoles(items: NavItem[], roles: string[]): NavItem[] {
  return items
    .filter((it) => !it.roles || it.roles.some((r) => roles.includes(r)))
    .map((it) => ({
      ...it,
      children: it.children ? filterByRoles(it.children, roles) : undefined
    }))
    .filter((it) => (it.children ? it.children.length > 0 || it.path : true));
}

const filteredNav = computed(() => filterByRoles(NAV, userRoles.value));

onMounted(() => {
  const mq = window.matchMedia('(max-width: 64rem)');
  const cb = (e: MediaQueryListEvent | MediaQueryList) => {
    collapsed.value = e.matches;
  };
  cb(mq as any);
  mq.addEventListener('change', cb as any);
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.app-shell {
  display: grid;
  grid-template-columns: calc(#{$spacing-16} * 16.5) 1fr;
  min-height: 100vh;
  background: $color-surface-50;
}

.app-shell.is-collapsed {
  grid-template-columns: calc(#{$spacing-16} * 4.5) 1fr;
}

.app-sidebar {
  background: $color-surface-0;
  border-right: $border-width-1 solid $color-surface-200;
  position: sticky;
  top: 0;
  height: 100vh;
}

.app-main {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-width: 0;
}

.app-content {
  padding: $spacing-24;
}

@media (max-width: 64rem) {
  .app-shell {
    grid-template-columns: calc(#{$spacing-16} * 4.5) 1fr;
  }
}
</style>
