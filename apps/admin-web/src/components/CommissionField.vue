<template>
  <div class="commission-field" :data-disabled="disabled ? 'true' : 'false'">
    <div class="commission-field__types">
      <label v-for="option in typeOptions" :key="option.value" class="commission-field__type">
        <input
          type="radio"
          :value="option.value"
          v-model="state.type"
          :disabled="disabled || (!allowTier && option.value === 'tier')"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>

    <div v-if="state.type === 'percent'" class="commission-field__row">
      <label>
        <span>{{ t('commissionField.percentLabel') }}</span>
        <div class="commission-field__input">
          <input
            type="number"
            step="0.1"
            :disabled="disabled"
            v-model.number="state.percent"
          />
          <span class="commission-field__suffix">%</span>
        </div>
      </label>
      <p class="commission-field__hint">
        {{ percentHint }}
      </p>
    </div>

    <div v-else-if="state.type === 'fixed'" class="commission-field__row">
      <label>
        <span>{{ t('commissionField.fixedLabel') }}</span>
        <div class="commission-field__input">
          <input type="number" step="0.01" :disabled="disabled" v-model.number="state.fixed" />
          <span class="commission-field__suffix">{{ currency }}</span>
        </div>
      </label>
    </div>

    <div v-else class="commission-field__tiers">
      <header class="commission-field__tiers-head">
        <span>{{ t('commissionField.tierHeader') }}</span>
        <Button size="xs" variant="secondary" :disabled="disabled" @click="addTier">
          {{ t('commissionField.addTier') }}
        </Button>
      </header>
      <table>
        <thead>
          <tr>
            <th>{{ t('commissionField.threshold') }}</th>
            <th>{{ t('commissionField.value') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tier, index) in state.tiers" :key="tier.id">
            <td>
              <input
                type="number"
                step="1"
                min="0"
                :disabled="disabled"
                v-model.number="tier.threshold"
              />
            </td>
            <td>
              <div class="commission-field__input">
                <input
                  type="number"
                  step="0.01"
                  :disabled="disabled"
                  v-model.number="tier.value"
                />
                <span class="commission-field__suffix">{{ currency }}</span>
              </div>
            </td>
            <td>
              <Button
                size="xs"
                variant="ghost"
                :disabled="disabled"
                @click="removeTier(index)"
              >
                {{ t('commissionField.remove') }}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!state.tiers.length" class="commission-field__hint">
        {{ t('commissionField.noTier') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from '@/components/Button.vue';
import type { CommissionValue } from '@/sdk/commission';

const props = defineProps<{
  modelValue: CommissionValue | null;
  maxPercent?: number | null;
  minPercent?: number | null;
  allowTier?: boolean;
  disabled?: boolean;
  currency?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: CommissionValue | null): void;
}>();

const { t } = useI18n({ useScope: 'global' });

const state = reactive({
  type: 'percent' as 'percent' | 'fixed' | 'tier',
  percent: 0,
  fixed: 0,
  tiers: [] as Array<{ id: string; threshold: number; value: number }>
});

const allowTier = computed(() => props.allowTier !== false);
const disabled = computed(() => props.disabled === true);
const currency = computed(() => props.currency || 'CNY');

const typeOptions = computed(() => [
  { value: 'percent', label: t('commissionField.type.percent') },
  { value: 'fixed', label: t('commissionField.type.fixed') },
  { value: 'tier', label: t('commissionField.type.tier') }
]);

const percentHint = computed(() => {
  const min = props.minPercent ?? 0;
  const max = props.maxPercent ?? 100;
  return t('commissionField.percentHint', { min, max });
});

watch(allowTier, (next) => {
  if (!next && state.type === 'tier') {
    state.type = 'percent';
    state.tiers = [];
  }
});

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      state.type = allowTier.value ? 'percent' : 'fixed';
      state.percent = 0;
      state.fixed = 0;
      state.tiers = [];
      return;
    }
    if (value.type === 'percent') {
      state.type = 'percent';
      state.percent = value.value ?? 0;
    } else if (value.type === 'fixed') {
      state.type = 'fixed';
      state.fixed = value.value ?? 0;
    } else if (value.type === 'tier') {
      if (!allowTier.value) {
        state.type = 'percent';
        state.percent = 0;
        state.tiers = [];
        emit('update:modelValue', { type: 'percent', value: state.percent });
        return;
      }
      state.type = 'tier';
      state.tiers = Array.isArray(value.tiers)
        ? value.tiers.map((tier, index) => ({
            id: `${index}-${tier.threshold}-${tier.value}`,
            threshold: tier.threshold ?? 0,
            value: tier.value ?? 0
          }))
        : [];
    }
  },
  { immediate: true }
);

watch(
  () => ({ ...state, tiers: state.tiers.map((tier) => ({ ...tier })) }),
  () => {
    let next: CommissionValue | null = null;
    if (state.type === 'percent') {
      const min = props.minPercent ?? 0;
      const max = props.maxPercent ?? 100;
      const value = clamp(state.percent, min, max);
      if (value !== state.percent) state.percent = value;
      next = { type: 'percent', value };
    } else if (state.type === 'fixed') {
      next = { type: 'fixed', value: round(state.fixed, 2) };
    } else if (state.tiers.length) {
      next = {
        type: 'tier',
        tiers: state.tiers
          .map((tier) => ({ threshold: Math.max(0, tier.threshold), value: round(tier.value, 2) }))
          .sort((a, b) => a.threshold - b.threshold)
      };
    } else {
      next = { type: 'tier', tiers: [] };
    }
    emit('update:modelValue', next);
  },
  { deep: true }
);

function addTier() {
  state.tiers.push({ id: cryptoId(), threshold: 0, value: 0 });
}

function removeTier(index: number) {
  state.tiers.splice(index, 1);
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function round(value: number, precision = 2) {
  if (Number.isNaN(value)) return 0;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function cryptoId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.commission-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.commission-field[data-disabled='true'] {
  opacity: 0.6;
}

.commission-field__types {
  display: inline-flex;
  gap: $spacing-12;
}

.commission-field__type {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.commission-field__row {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.commission-field__row label {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.commission-field__input {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
}

.commission-field__input input {
  width: 7rem;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
}

.commission-field__suffix {
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.commission-field__hint {
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.commission-field__tiers {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.commission-field__tiers table {
  width: 100%;
  border-collapse: collapse;
  font-size: $text-12-regular-fs;
}

.commission-field__tiers th,
.commission-field__tiers td {
  padding: $spacing-8;
  text-align: left;
  border-bottom: $border-width-1 solid $color-surface-200;
}

.commission-field__tiers input {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
}

.commission-field__tiers-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $text-12-regular-fs;
}

.commission-field__tiers-head span {
  color: $text-muted;
}

.commission-field__tiers .commission-field__input {
  width: auto;
}

.commission-field__tiers .commission-field__input input {
  width: 6.5rem;
}

.commission-field__tiers .commission-field__suffix {
  font-size: $text-12-regular-fs;
}

.commission-field__tiers table td:last-child {
  width: 5rem;
}

.commission-field__tiers table tr:last-child td {
  border-bottom: none;
}

.commission-field__tiers table thead {
  background: $color-surface-50;
}

.commission-field__tiers table input:focus,
.commission-field__input input:focus {
  outline: none;
  border-color: $color-primary-300;
  box-shadow: $focus-ring-primary;
}

.commission-field__types input:disabled + span,
.commission-field__types input:disabled {
  cursor: not-allowed;
}

.commission-field__types input:disabled + span {
  opacity: 0.5;
}

.commission-field__row input:disabled,
.commission-field__tiers input:disabled {
  cursor: not-allowed;
  background: $color-surface-50;
}

.commission-field__types input {
  accent-color: $color-primary-600;
}

.commission-field__tiers table button {
  white-space: nowrap;
}
</style>
