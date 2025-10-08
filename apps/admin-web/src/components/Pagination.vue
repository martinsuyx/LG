// =============================
// File: apps/admin-web/src/components/Pagination.vue
// =============================
<template>
  <nav class="jg-pager" role="navigation" aria-label="Pagination">
    <button class="jg-pager__btn" :disabled="page<=1" @click="$emit('update:page', page-1)">上一页</button>
    <span class="jg-pager__info">第 {{ page }} / {{ pages }} 页</span>
    <button class="jg-pager__btn" :disabled="page>=pages" @click="$emit('update:page', page+1)">下一页</button>
    <select class="jg-pager__size" :value="pageSize" @change="$emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))">
      <option v-for="s in sizes" :key="s" :value="s">每页 {{ s }}</option>
    </select>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{ page:number; pages:number; pageSize:number; sizes?: number[] }>()
withDefaults(props, { sizes: () => [20, 50, 100, 200] })
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
.jg-pager{ display:flex; align-items:center; gap:$spacing-12; padding:$spacing-12; }
.jg-pager__btn{ @extend .jg-btn; height:$control-sm-h; padding:0 $spacing-12; border-radius:$radius-8; background:$surface-100; border:$border-1 solid $surface-300; }
.jg-pager__info{ color:$text-subtle; }
.jg-pager__size{ height:$control-sm-h; border:$border-1 solid $surface-300; border-radius:$radius-8; background:$surface-0; color:$text-strong; padding:0 $spacing-12; }
</style>


