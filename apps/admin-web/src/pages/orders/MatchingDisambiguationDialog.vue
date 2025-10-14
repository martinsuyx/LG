<template>
  <Modal :model-value="modelValue" @update:modelValue="updateVisible">
    <template #title>候选消歧 · {{ row?.order_no || row?.report_row_id }}</template>
    <div class="disambiguation">
      <div class="disambiguation__intro">
        <p>
          根据字段命中及时间差共命中
          <strong>{{ candidates.length }}</strong>
          个候选，请选择最符合的线索。分值越高表示匹配可信度越高。
        </p>
        <label class="disambiguation__search">
          <span>搜索候选</span>
          <input v-model.trim="keyword" type="search" placeholder="按订单号 / 推广员 / 门店筛选" />
        </label>
      </div>
      <table class="disambiguation__table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>匹配分</th>
            <th>门店 / 推广员</th>
            <th>命中字段</th>
            <th>差异字段</th>
            <th>订购时间</th>
            <th>状态</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody v-if="filteredCandidates.length">
          <tr v-for="candidate in filteredCandidates" :key="candidate.order_id">
            <td>{{ candidate.order_id }}</td>
            <td>
              <span class="score">{{ formatScore(candidate.score) }}</span>
            </td>
            <td>
              <div class="meta">
                <span>{{ candidate.store_name || '-' }}</span>
                <small>{{ candidate.promoter_name || '未知推广员' }}</small>
              </div>
            </td>
            <td>
              <TagList :items="candidate.match_fields" variant="positive" />
            </td>
            <td>
              <TagList :items="candidate.diff_fields" variant="warning" />
            </td>
            <td>{{ formatDate(candidate.created_at) }}</td>
            <td>
              <span class="status">{{ statusLabel(candidate.status) }}</span>
            </td>
            <td class="col-actions">
              <Button size="sm" :loading="loading && selectedId === candidate.order_id" @click="confirm(candidate)">选择</Button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="8" class="empty">暂无满足条件的候选。</td>
          </tr>
        </tbody>
      </table>
    </div>
    <template #footer>
      <Button variant="secondary" :disabled="loading" @click="close">取消</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, defineComponent, ref } from 'vue';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import type { MatchingCandidate, MatchingResultItem } from '@/sdk/matching';

const props = defineProps<{
  modelValue: boolean;
  loading?: boolean;
  row?: MatchingResultItem | null;
  candidates: MatchingCandidate[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'resolve', payload: MatchingCandidate): void;
}>();

const keyword = ref('');
const selectedId = ref<string | null>(null);

const TagList = defineComponent({
  name: 'TagList',
  props: {
    items: {
      type: Array as () => string[] | undefined,
      default: () => []
    },
    variant: {
      type: String as () => 'positive' | 'warning',
      default: 'positive'
    }
  },
  setup(props) {
    return () =>
      props.items && props.items.length ? (
        <ul class={['tag-list', `tag-list--${props.variant}`]}>
          {props.items.map((item) => (
            <li class="tag-list__item" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <span class="tag-list__empty">-</span>
      );
  }
});

const filteredCandidates = computed(() => {
  if (!keyword.value) return props.candidates;
  const value = keyword.value.toLowerCase();
  return props.candidates.filter((candidate) => {
    return (
      candidate.order_id.toLowerCase().includes(value) ||
      (candidate.promoter_name && candidate.promoter_name.toLowerCase().includes(value)) ||
      (candidate.store_name && candidate.store_name.toLowerCase().includes(value))
    );
  });
});

function updateVisible(value: boolean) {
  emit('update:modelValue', value);
  if (!value) reset();
}

function close() {
  emit('update:modelValue', false);
  reset();
}

function reset() {
  keyword.value = '';
  selectedId.value = null;
}

function confirm(candidate: MatchingCandidate) {
  selectedId.value = candidate.order_id;
  emit('resolve', candidate);
}

function formatScore(score: number | undefined) {
  if (typeof score !== 'number') return '-';
  return (score * 100).toFixed(0) + ' 分';
}

function formatDate(value: string | undefined) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusLabel(status?: string) {
  if (!status) return '未知';
  const map: Record<string, string> = {
    completed: '已完成',
    processing: '处理中',
    pending: '待处理'
  };
  return map[status] || status;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.disambiguation {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  color: $text-strong;
}

.disambiguation__intro {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.disambiguation__intro strong {
  color: $text-strong;
}

.disambiguation__search {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  span {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  input {
    border: $border-1 solid $surface-200;
    border-radius: $radius-12;
    padding: $spacing-8 $spacing-12;
    font: inherit;
  }
}

.disambiguation__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: $border-1 solid $surface-200;
  border-radius: $radius-12;
  overflow: hidden;
  background: $surface-0;

  thead th {
    background: $surface-50;
    color: $text-subtle;
    text-align: left;
    font-size: $text-12-medium-fs;
    line-height: $text-12-medium-lh;
    font-weight: $text-12-medium-wt;
    padding: $spacing-12 $spacing-16;
  }

  tbody td {
    border-top: $border-1 solid $surface-100;
    padding: $spacing-12 $spacing-16;
    font-size: $text-14-regular-fs;
    color: $text-strong;
    vertical-align: top;
  }

  .empty {
    text-align: center;
    color: $text-muted;
  }
}

.score {
  font-weight: $title-18-semibold-wt;
  color: $primary-700;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  small {
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.status {
  display: inline-flex;
  align-items: center;
  padding: calc(#{$spacing-8} / 4) $spacing-8;
  background: $surface-100;
  border-radius: $radius-8;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.col-actions {
  width: 7rem;
}

.empty {
  padding: $spacing-16;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: calc(#{$spacing-8} / 2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag-list__item {
  padding: calc(#{$spacing-8} / 4) $spacing-8;
  border-radius: $radius-8;
  font-size: $text-12-regular-fs;
  line-height: $text-12-regular-lh;
}

.tag-list--positive .tag-list__item {
  background: rgba($primary-100, 0.6);
  color: $primary-700;
}

.tag-list--warning .tag-list__item {
  background: rgba($color-warning-soft, 0.6);
  color: $color-warning-strong;
}

.tag-list__empty {
  color: $text-muted;
  font-size: $text-12-regular-fs;
}
</style>
