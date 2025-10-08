// =============================
// File: apps/admin-web/src/components/Table.vue
// =============================
<template>
  <div class="jg-table" :class="{ 'is-loading': loading }">
    <div class="jg-table__wrap" role="region" :aria-busy="loading ? 'true':'false'">
      <table>
        <thead>
          <tr>
            <th v-for="col in visibleColumns" :key="col.key" :style="{ width: col.width || undefined }">
              <button v-if="col.sortable" class="th-sort" @click="toggleSort(col.key)">
                {{ col.title }}
                <span class="sort-ind" :aria-hidden="true">{{ sortKey===col.key ? (sortOrder==='asc'?'↑':'↓') : '' }}</span>
              </button>
              <template v-else>{{ col.title }}</template>
            </th>
          </tr>
        </thead>
        <tbody v-if="!loading && rows.length">
          <tr v-for="row in sortedRows" :key="rowKey(row)" @click="$emit('rowClick', row)" tabindex="0">
            <td v-for="col in visibleColumns" :key="col.key">
              <slot :name="`cell:${col.key}`" :row="row">{{ row[col.key] }}</slot>
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="loading">
          <tr v-for="i in 5" :key="i" class="skeleton-row">
            <td v-for="col in visibleColumns" :key="col.key"><div class="skl" /></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr class="empty">
            <td :colspan="visibleColumns.length">
              <slot name="empty">暂无数据</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="jg-table__pagination">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Column {
  key: string
  title: string
  width?: string
  sortable?: boolean
  hidden?: boolean
}

const props = defineProps<{
  columns: Column[]
  rows: any[]
  loading?: boolean
  rowKey?: (row:any)=>string | ((row:any)=>number) | string
  defaultSortKey?: string
  defaultSortOrder?: 'asc'|'desc'
}>()

const emit = defineEmits<{ (e:'sortChange', key:string, order:'asc'|'desc'): void, (e:'rowClick', row:any): void }>()

const visibleColumns = computed(()=> props.columns.filter(c=>!c.hidden))

const sortKey = ref(props.defaultSortKey || '')
const sortOrder = ref<'asc'|'desc'>(props.defaultSortOrder || 'asc')

function rowKey(row:any){
  if (typeof props.rowKey === 'function') return (props.rowKey as any)(row)
  if (typeof props.rowKey === 'string') return row[props.rowKey]
  return row.id || row.order_id || JSON.stringify(row)
}

const sortedRows = computed(()=>{
  const data = [...(props.rows||[])]
  if (!sortKey.value) return data
  return data.sort((a,b)=>{
    const va = a[sortKey.value], vb = b[sortKey.value]
    return (va>vb?1:va<vb?-1:0) * (sortOrder.value==='asc'?1:-1)
  })
})

function toggleSort(key:string){
  if (sortKey.value !== key){ sortKey.value = key; sortOrder.value='asc' }
  else { sortOrder.value = sortOrder.value==='asc'?'desc':'asc' }
  emit('sortChange', sortKey.value, sortOrder.value)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.jg-table {
  .jg-table__wrap { overflow: auto; border: $border-1 solid $surface-200; border-radius: $radius-12; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; background: $surface-0; }
  thead th {
    position: sticky; top: 0; z-index: $z-sticky;
    background: $surface-50; color: $text-subtle; text-align: left;
    font-size: $text-12-medium-fs; line-height: $text-12-medium-lh; font-weight: $text-12-medium-wt;
    padding: $spacing-12 $spacing-16; border-bottom: $border-1 solid $surface-200;
  }
  tbody td {
    padding: $spacing-12 $spacing-16; border-bottom: $border-1 solid $surface-100; color: $text-strong;
    font-size: $text-14-regular-fs; line-height: $text-14-regular-lh; font-weight: $text-14-regular-wt;
  }
  tbody tr:hover { background: $surface-25; }
  tbody tr:focus-visible { outline: $outline-focus solid $primary-300; box-shadow: $focus-ring-primary; }

  .empty td { text-align: center; color: $text-muted; padding: $spacing-32; }

  .skeleton-row .skl { height: $skeleton-h; background: $skeleton-bg; border-radius: $radius-8; animation: skl 1.2s infinite linear; }
  @keyframes skl { 0%{ opacity:.6 } 50%{ opacity:.3 } 100%{ opacity:.6 } }

  .th-sort { display:inline-flex; align-items:center; gap:$spacing-8; background:transparent; border:0; color:inherit; cursor:pointer; }
}
</style>


