<template>
  <teleport to="body">
    <aside v-if="visible" class="matching-drawer" role="dialog" aria-modal="true">
      <header class="matching-drawer__header">
        <div>
          <h2>匹配详情 · {{ detail?.order_no || row?.order_no || row?.report_row_id }}</h2>
          <p>模板：{{ detail?.template_id || row?.template_id }} @ {{ detail?.template_version || row?.template_version }}</p>
        </div>
        <button class="matching-drawer__close" type="button" @click="$emit('close')" aria-label="关闭">×</button>
      </header>

      <section class="matching-drawer__body" :aria-busy="loading ? 'true' : 'false'">
        <div v-if="loading" class="matching-drawer__loading">详情加载中…</div>
        <template v-else>
          <section class="matching-drawer__summary">
            <div class="summary__item">
              <span>匹配状态</span>
              <strong :class="['status-tag', `status-tag--${row?.match_status}`]">{{ statusLabel(row?.match_status) }}</strong>
            </div>
            <div class="summary__item">
              <span>有效性</span>
              <strong :class="row?.valid ? 'tag-success' : 'tag-muted'">{{ row?.valid ? '有效' : '未生效' }}</strong>
            </div>
            <div class="summary__item">
              <span>匹配方式</span>
              <strong>{{ modeLabel(row?.match_mode) }}</strong>
            </div>
            <div class="summary__item">
              <span>规则版本</span>
              <strong>{{ detail?.matching_rule_version || row?.matching_rule_version || '-' }}</strong>
            </div>
          </section>

          <section class="matching-drawer__actions">
            <Button size="sm" variant="primary" :disabled="row?.valid" @click="$emit('set-valid', true)">设为有效</Button>
            <Button size="sm" variant="secondary" :disabled="row?.valid === false" @click="$emit('set-valid', false)">设为无效</Button>
            <Button size="sm" variant="ghost" @click="toggleRisk">
              {{ hasRisk ? '取消风险标记' : '标记风险' }}
            </Button>
          </section>

          <section class="matching-drawer__content">
            <article class="panel">
              <header>
                <h3>报表原始数据</h3>
              </header>
              <dl>
                <div v-for="field in reportFields" :key="field.key" :class="['entry', highlightClass(field.highlight)]">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ field.value }}</dd>
                </div>
              </dl>
            </article>
            <article class="panel">
              <header>
                <h3>平台线索 / 订单</h3>
              </header>
              <dl v-if="matchedFields.length">
                <div v-for="field in matchedFields" :key="field.key" :class="['entry', highlightClass(field.highlight)]">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ field.value }}</dd>
                </div>
              </dl>
              <p v-else class="panel__empty">尚未绑定平台订单。</p>
            </article>
          </section>

          <section v-if="detail?.timeline?.length" class="matching-drawer__timeline">
            <h3>操作日志</h3>
            <ol>
              <li v-for="item in detail.timeline" :key="item.ts">
                <time>{{ formatDateTime(item.ts) }}</time>
                <span class="timeline__actor">{{ item.actor }}</span>
                <span class="timeline__action">{{ timelineLabel(item.action) }}</span>
                <p v-if="item.note">{{ item.note }}</p>
              </li>
            </ol>
          </section>
        </template>
      </section>
    </aside>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from '@/components/Button.vue';
import type { MatchingDetail, MatchingResultItem } from '@/sdk/matching';

const props = defineProps<{
  visible: boolean;
  loading?: boolean;
  row?: MatchingResultItem | null;
  detail?: MatchingDetail | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'set-valid', value: boolean): void;
  (e: 'toggle-risk', value: boolean): void;
}>();

const reportFields = computed(() => buildEntries(props.detail?.report));
const matchedFields = computed(() => buildEntries(props.detail?.matched_order || null));
const hasRisk = computed(() => Boolean(props.row?.risk_flags && props.row.risk_flags.length));

function buildEntries(data: Record<string, unknown> | null | undefined) {
  if (!data) return [];
  const highlights = (data.highlights as Record<string, string> | undefined) || {};
  return Object.entries(data)
    .filter(([key]) => key !== 'highlights')
    .map(([key, value]) => ({
      key,
      label: fieldLabel(key),
      value: formatValue(value),
      highlight: highlights[key]
    }));
}

function fieldLabel(key: string) {
  const map: Record<string, string> = {
    order_no: '订单号',
    order_id: '订单号',
    product_key: '产品键',
    phone: '手机号',
    promoter_unique_id: '推广唯一 ID',
    promoter_name: '推广员',
    store_name: '门店',
    report_amount: '报表金额',
    amount: '订单金额',
    report_date: '报表日期',
    created_at: '下单时间',
    activated_at: '生效时间',
    campaign_name: '活动',
    plan_name: '套餐'
  };
  return map[key] || key;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value.toString() : '-';
  if (Array.isArray(value)) return value.join(', ');
  return JSON.stringify(value);
}

function highlightClass(type?: string) {
  if (type === 'match') return 'is-match';
  if (type === 'conflict') return 'is-conflict';
  return '';
}

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    matched: '已匹配',
    unmatched: '未匹配',
    ambiguous: '待消歧',
    invalid: '无效',
    risky: '风险待复核',
    duplicate: '疑似重复',
    cross_period: '跨期数据'
  };
  return map[status || ''] || '未知状态';
}

function modeLabel(mode?: string | null) {
  const map: Record<string, string> = {
    auto_id: '自动匹配（唯一 ID）',
    manual_form: '人工匹配（表单字段）'
  };
  return map[mode || ''] || '未知';
}

function timelineLabel(action: string) {
  const map: Record<string, string> = {
    imported: '导入完成',
    auto_matched: '自动匹配成功',
    auto_match_failed: '自动匹配失败',
    ambiguous: '候选待消歧',
    set_valid: '设为有效',
    set_invalid: '设为无效'
  };
  return map[action] || action;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function toggleRisk() {
  emit('toggle-risk', !hasRisk.value);
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.matching-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(34rem, 90vw);
  background: $surface-0;
  box-shadow: -18px 0 48px rgba($color-surface-700, 0.15);
  display: flex;
  flex-direction: column;
  z-index: $z-dialog;
  border-left: $border-1 solid $surface-200;
}

.matching-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-20 $spacing-24;
  border-bottom: $border-1 solid $surface-200;

  h2 {
    margin: 0 0 $spacing-8;
    font-size: $title-18-semibold-fs;
    line-height: $title-18-semibold-lh;
    font-weight: $title-18-semibold-wt;
    color: $text-strong;
  }

  p {
    margin: 0;
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.matching-drawer__close {
  background: transparent;
  border: none;
  font-size: $title-18-semibold-fs;
  cursor: pointer;
  color: $text-subtle;
}

.matching-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-24;
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
}

.matching-drawer__loading {
  text-align: center;
  color: $text-muted;
}

.matching-drawer__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-16;

  .summary__item {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;

    strong {
      font-size: $text-14-regular-fs;
      color: $text-strong;
    }
  }
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: calc(#{$spacing-8} / 2) $spacing-12;
  border-radius: $radius-12;
  background: $surface-100;
  color: $text-strong;
  font-size: $text-12-regular-fs;
}

.status-tag--matched {
  background: rgba($primary-100, 0.6);
  color: $primary-700;
}

.status-tag--ambiguous {
  background: rgba($color-warning-soft, 0.6);
  color: $color-warning-strong;
}

.status-tag--unmatched,
.status-tag--invalid {
  background: rgba($danger-300, 0.3);
  color: $danger-700;
}

.status-tag--risky,
.status-tag--duplicate,
.status-tag--cross_period {
  background: rgba($color-warning-soft, 0.5);
  color: $color-warning-strong;
}

.tag-success {
  color: $primary-700;
}

.tag-muted {
  color: $text-muted;
}

.matching-drawer__actions {
  display: flex;
  gap: $spacing-12;
  flex-wrap: wrap;
}

.matching-drawer__content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-16;
}

.panel {
  border: $border-1 solid $surface-200;
  border-radius: $radius-12;
  background: $surface-0;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;

  header h3 {
    margin: 0;
    font-size: $text-14-regular-fs;
    color: $text-strong;
  }

  dl {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: $spacing-12;
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-strong;

    dt {
      color: $text-muted;
    }
  }

  .entry.is-match {
    background: rgba($primary-100, 0.45);
    border-radius: $radius-8;
    padding: $spacing-8;
  }

  .entry.is-conflict {
    background: rgba($danger-300, 0.3);
    border-radius: $radius-8;
    padding: $spacing-8;
  }
}

.panel__empty {
  text-align: center;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.matching-drawer__timeline {
  border-top: $border-1 solid $surface-200;
  padding-top: $spacing-16;

  h3 {
    margin: 0 0 $spacing-12;
    font-size: $text-14-regular-fs;
    color: $text-strong;
  }

  ol {
    margin: 0;
    padding-left: $spacing-16;
    display: flex;
    flex-direction: column;
    gap: $spacing-12;
  }

  li {
    font-size: $text-12-regular-fs;
    color: $text-strong;

    time {
      display: block;
      color: $text-muted;
    }

    .timeline__actor {
      margin-right: $spacing-8;
      font-weight: $text-12-medium-wt;
    }

    p {
      margin: calc(#{$spacing-8} / 2) 0 0;
      color: $text-muted;
    }
  }
}

@media (max-width: 56rem) {
  .matching-drawer__content {
    grid-template-columns: 1fr;
  }
}
</style>
