<template>
  <section class="campaign-basics">
    <header class="campaign-basics__header">
      <div>
        <h1 class="campaign-basics__title">{{ t('campaignBasics.title') }}</h1>
        <p class="campaign-basics__subtitle">{{ t('campaignBasics.subtitle') }}</p>
      </div>
      <div class="campaign-basics__actions">
        <Button
          size="sm"
          variant="secondary"
          :loading="parsing"
          :disabled="loading || !canParse"
          @click="testParse"
        >
          {{ t('campaignBasics.actions.test') }}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          :loading="saving"
          :disabled="loading"
          @click="saveDraft"
        >
          {{ t('campaignBasics.actions.save') }}
        </Button>
        <Button
          size="sm"
          variant="primary"
          :disabled="loading || saving"
          @click="goNext"
        >
          {{ t('campaignBasics.actions.next') }}
        </Button>
      </div>
    </header>

    <p v-if="feedback.message" class="campaign-basics__feedback" :data-variant="feedback.variant">
      {{ feedback.message }}
    </p>

    <div class="campaign-basics__layout" :aria-busy="loading ? 'true' : 'false'">
      <div v-if="loading" class="campaign-basics__loading">
        <span>{{ t('campaignBasics.loading') }}</span>
      </div>
      <template v-else>
        <form class="campaign-basics__form" @submit.prevent="saveDraft">
          <fieldset class="form-section">
            <legend>{{ t('campaignBasics.sections.base') }}</legend>
            <label class="form-field">
              <span>{{ t('campaignBasics.form.customer') }}</span>
              <input type="text" v-model="form.customerName" />
            </label>
            <label class="form-field">
              <span>{{ t('campaignBasics.form.campaignName') }}</span>
              <input type="text" v-model="form.campaignName" required />
            </label>
            <label class="form-field">
              <span>{{ t('campaignBasics.form.campaignCode') }}</span>
              <input type="text" :value="form.campaignCode" @input="onCodeInput" required />
            </label>
          </fieldset>

          <fieldset class="form-section form-section--inline">
            <legend>{{ t('campaignBasics.sections.period') }}</legend>
            <label class="form-field">
              <span>{{ t('campaignBasics.form.startTime') }}</span>
              <input type="datetime-local" v-model="form.startTime" required />
            </label>
            <label class="form-field">
              <span>{{ t('campaignBasics.form.endTime') }}</span>
              <input type="datetime-local" v-model="form.endTime" required />
            </label>
          </fieldset>

          <fieldset class="form-section">
            <legend>{{ t('campaignBasics.sections.channels') }}</legend>
            <label v-for="option in channelOptions" :key="option.value" class="checkbox">
              <input
                type="checkbox"
                :value="option.value"
                v-model="form.channels"
              />
              <span>{{ option.label }}</span>
            </label>
          </fieldset>

          <fieldset class="form-section">
            <legend>{{ t('campaignBasics.sections.matching') }}</legend>
            <label class="radio">
              <input
                type="radio"
                value="template"
                v-model="form.matchingMode"
              />
              <span>{{ t('campaignBasics.form.matching.template') }}</span>
            </label>
            <label class="radio">
              <input
                type="radio"
                value="manual"
                v-model="form.matchingMode"
              />
              <span>{{ t('campaignBasics.form.matching.manual') }}</span>
            </label>
          </fieldset>
        </form>

        <section class="campaign-basics__panel">
          <header class="panel-header">
            <div>
              <h2>{{ t('campaignBasics.template.title') }}</h2>
              <p>{{ t('campaignBasics.template.subtitle') }}</p>
            </div>
            <div class="panel-header__actions">
              <Button
                size="xs"
                variant="secondary"
                :loading="recognizing"
                :disabled="loading || !canRecognize"
                @click="recognizeTemplate"
              >
                {{ t('campaignBasics.template.recognize') }}
              </Button>
              <Button
                v-if="recognition && recognition.template_id && recognition.template_id !== form.templateId"
                size="xs"
                variant="ghost"
                @click="applyRecognition"
              >
                {{ t('campaignBasics.template.applySuggestion') }}
              </Button>
            </div>
          </header>

          <label class="form-field">
            <span>{{ t('campaignBasics.template.selectLabel') }}</span>
            <select v-model="form.templateId" @change="onTemplateChange">
              <option value="">{{ t('campaignBasics.template.selectPlaceholder') }}</option>
              <option v-for="tpl in templates" :key="tpl.template_id" :value="tpl.template_id">
                {{ tpl.name }}
              </option>
            </select>
          </label>

          <div v-if="recognition && recognition.template_id" class="recognition-card">
            <strong>{{ t('campaignBasics.template.recognitionTitle') }}</strong>
            <p>
              {{ recognition.template_name }}
              <span v-if="recognition.confidence">
                · {{ t('campaignBasics.template.confidence', { value: (recognition.confidence * 100).toFixed(1) }) }}
              </span>
            </p>
            <ul>
              <li v-for="field in recognition.matched_fields || []" :key="field.field">
                {{ field.label || field.field }}
                <span v-if="field.confidence"> ({{ (field.confidence * 100).toFixed(0) }}%)</span>
              </li>
            </ul>
            <p v-for="hint in recognition.hints || []" :key="hint" class="recognition-card__hint">
              • {{ hint }}
            </p>
          </div>

          <section class="mappings">
            <header class="mappings__header">
              <h3>{{ t('campaignBasics.mappings.title') }}</h3>
              <p v-if="currentTemplate">
                {{ t('campaignBasics.mappings.fieldCount', { count: currentTemplate.fields.length }) }}
              </p>
            </header>
            <table>
              <thead>
                <tr>
                  <th>{{ t('campaignBasics.mappings.field') }}</th>
                  <th>{{ t('campaignBasics.mappings.column') }}</th>
                  <th>{{ t('campaignBasics.mappings.required') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mapping in fieldMappings" :key="mapping.field">
                  <td>
                    <strong>{{ mapping.label }}</strong>
                    <span class="mappings__field-key">{{ mapping.field }}</span>
                  </td>
                  <td>
                    <input
                      type="text"
                      v-model="mapping.column"
                      :placeholder="t('campaignBasics.mappings.columnPlaceholder')"
                    />
                  </td>
                  <td>
                    <span :data-required="mapping.required">
                      {{ mapping.required ? t('campaignBasics.common.required') : t('campaignBasics.common.optional') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!fieldMappings.length" class="mappings__empty">
              {{ t('campaignBasics.mappings.empty') }}
            </p>
          </section>

          <section class="example">
            <header class="example__header">
              <h3>{{ t('campaignBasics.example.title') }}</h3>
              <span>{{ t('campaignBasics.example.hint') }}</span>
            </header>
            <textarea
              rows="8"
              v-model="form.exampleInput"
              :placeholder="t('campaignBasics.example.placeholder')"
            />

            <div class="example__result" v-if="exampleResult">
              <p class="example__summary">
                <strong>{{ t('campaignBasics.example.summaryTitle') }}</strong>
                <span v-if="exampleResult.rows != null">
                  {{ t('campaignBasics.example.rows', { count: exampleResult.rows }) }}
                </span>
              </p>
              <table v-if="exampleResult.columns?.length">
                <thead>
                  <tr>
                    <th>{{ t('campaignBasics.example.field') }}</th>
                    <th>{{ t('campaignBasics.example.samples') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="col in exampleResult.columns" :key="col.field">
                    <td>
                      <strong>{{ col.label }}</strong>
                      <span class="mappings__field-key">{{ col.field }}</span>
                    </td>
                    <td>
                      <span v-if="col.samples?.length">
                        {{ col.samples.join(', ') }}
                      </span>
                      <span v-else class="muted">{{ t('campaignBasics.example.noSample') }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <ul v-if="exampleResult.messages?.length" class="example__messages">
                <li v-for="(msg, index) in exampleResult.messages" :key="index" :data-level="msg.level || 'info'">
                  {{ msg.text }}
                </li>
              </ul>
            </div>
          </section>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from '@/components/Button.vue';
import {
  CampaignsService,
  type CampaignBasics,
  type CampaignBasicsFieldMapping,
  type CampaignBasicsExampleResult,
  type CampaignBasicsRecognition,
  type CampaignBasicsSaveRequest
} from '@/sdk/campaigns';
import {
  ReportTemplatesService,
  type ReportTemplateDetail,
  type ReportTemplateSummary,
  type ReportTemplateParseResponse
} from '@/sdk/reportTemplates';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();

const campaignId = computed(() => String(route.params.id || ''));

const loading = ref(false);
const saving = ref(false);
const parsing = ref(false);
const recognizing = ref(false);

const templates = ref<ReportTemplateSummary[]>([]);
const currentTemplate = ref<ReportTemplateDetail | null>(null);
const recognition = ref<CampaignBasicsRecognition | null>(null);
const fieldMappings = ref<Array<CampaignBasicsFieldMapping & { column?: string }>>([]);
const exampleResult = ref<CampaignBasicsExampleResult | null>(null);

const feedback = reactive<{ message: string; variant: 'info' | 'error' }>(() => ({
  message: '',
  variant: 'info'
}));

const form = reactive({
  customerName: '',
  campaignName: '',
  campaignCode: '',
  matchingMode: 'template' as 'template' | 'manual',
  channels: [] as string[],
  startTime: '',
  endTime: '',
  templateId: '',
  exampleInput: ''
});

const channelOptions = computed(() => [
  { value: 'wechat', label: t('campaignBasics.channels.wechat') },
  { value: 'h5', label: t('campaignBasics.channels.h5') },
  { value: 'scan', label: t('campaignBasics.channels.scan') },
  { value: 'api', label: t('campaignBasics.channels.api') }
]);

const canParse = computed(() => form.templateId && form.exampleInput.trim().length > 0);
const canRecognize = computed(() => form.exampleInput.trim().length > 0);

watch(
  () => campaignId.value,
  () => {
    void loadData();
  },
  { immediate: true }
);

async function loadData() {
  if (!campaignId.value) return;
  loading.value = true;
  feedback.message = '';
  try {
    const [basics, templateList] = await Promise.all([
      CampaignsService.getCampaignBasics(campaignId.value),
      ReportTemplatesService.listTemplates()
    ]);
    templates.value = templateList;
    applyBasics(basics);
    if (form.templateId) {
      await loadTemplateDetail(form.templateId);
    } else {
      fieldMappings.value = basics.field_mappings || [];
    }
    exampleResult.value = basics.example_result || null;
  } catch (error) {
    setFeedback((error as Error).message || t('campaignBasics.errors.load'), 'error');
  } finally {
    loading.value = false;
  }
}

function applyBasics(basics: CampaignBasics) {
  form.customerName = basics.customer_name || '';
  form.campaignName = basics.campaign_name || '';
  form.campaignCode = basics.campaign_code || '';
  form.matchingMode = basics.matching_mode || 'template';
  form.channels = [...(basics.channels || [])];
  form.startTime = toDateTimeLocal(basics.start_time);
  form.endTime = toDateTimeLocal(basics.end_time);
  form.templateId = basics.template_id || '';
  form.exampleInput = basics.example_input || '';
  recognition.value = basics.recognition || null;
  fieldMappings.value = (basics.field_mappings || []).map((item) => ({ ...item }));
}

async function loadTemplateDetail(templateId: string) {
  if (!templateId) {
    currentTemplate.value = null;
    return;
  }
  try {
    currentTemplate.value = await ReportTemplatesService.getTemplate(templateId);
    fieldMappings.value = ensureMappings(fieldMappings.value, currentTemplate.value.fields);
  } catch (error) {
    setFeedback((error as Error).message || t('campaignBasics.errors.templateDetail'), 'error');
    currentTemplate.value = null;
  }
}

function ensureMappings(existing: CampaignBasicsFieldMapping[], fields: ReportTemplateDetail['fields'] = []) {
  const map = new Map(existing.map((item) => [item.field, item]));
  return fields.map((field) => {
    const record = map.get(field.field);
    return {
      field: field.field,
      label: field.label,
      required: !!field.required,
      column: record?.column || field.label
    };
  });
}

async function saveDraft() {
  if (!campaignId.value) return;
  saving.value = true;
  setFeedback('', 'info');
  try {
    const payload: CampaignBasicsSaveRequest = {
      customer_name: form.customerName,
      campaign_name: form.campaignName,
      campaign_code: form.campaignCode,
      matching_mode: form.matchingMode,
      channels: [...form.channels],
      start_time: fromDateTimeLocal(form.startTime),
      end_time: fromDateTimeLocal(form.endTime),
      template_id: form.templateId || undefined,
      field_mappings: fieldMappings.value.map((item) => ({
        field: item.field,
        label: item.label,
        required: item.required,
        column: item.column
      })),
      example_input: form.exampleInput
    };
    await CampaignsService.saveCampaignBasics(campaignId.value, payload);
    setFeedback(t('campaignBasics.success.save'), 'info');
  } catch (error) {
    setFeedback((error as Error).message || t('campaignBasics.errors.save'), 'error');
  } finally {
    saving.value = false;
  }
}

async function testParse() {
  if (!campaignId.value || !form.templateId || !canParse.value) return;
  parsing.value = true;
  setFeedback('', 'info');
  try {
    const result = await ReportTemplatesService.parseExample(form.templateId, {
      example: form.exampleInput
    });
    exampleResult.value = normaliseParseResult(result);
    if (result.columns?.length) {
      const columns = result.columns.map((col) => {
        const existing = fieldMappings.value.find((item) => item.field === col.field);
        return {
        field: col.field,
        label: col.label,
        required: existing?.required ?? false,
        column: existing?.column ?? col.label
      };
      });
      fieldMappings.value = ensureMappings(columns, currentTemplate.value?.fields || []);
    }
    setFeedback(t('campaignBasics.success.parse'), 'info');
  } catch (error) {
    setFeedback((error as Error).message || t('campaignBasics.errors.parse'), 'error');
  } finally {
    parsing.value = false;
  }
}

async function recognizeTemplate() {
  if (!canRecognize.value) return;
  recognizing.value = true;
  setFeedback('', 'info');
  try {
    const result = await ReportTemplatesService.recognizeTemplate({
      sample: form.exampleInput,
      limit: 1
    });
    recognition.value = result || null;
    setFeedback(t('campaignBasics.success.recognize'), 'info');
  } catch (error) {
    recognition.value = null;
    setFeedback((error as Error).message || t('campaignBasics.errors.recognize'), 'error');
  } finally {
    recognizing.value = false;
  }
}

function applyRecognition() {
  if (!recognition.value?.template_id) return;
  form.templateId = recognition.value.template_id;
  void loadTemplateDetail(form.templateId);
}

function goNext() {
  setFeedback(t('campaignBasics.success.next'), 'info');
}

function onTemplateChange() {
  exampleResult.value = null;
  if (form.templateId) {
    void loadTemplateDetail(form.templateId);
  } else {
    fieldMappings.value = [];
  }
}

function onCodeInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const next = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  form.campaignCode = next;
  target.value = next;
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function fromDateTimeLocal(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

function pad(input: number) {
  return String(input).padStart(2, '0');
}

function setFeedback(message: string, variant: 'info' | 'error') {
  feedback.message = message;
  feedback.variant = variant;
}

function normaliseParseResult(result: ReportTemplateParseResponse): CampaignBasicsExampleResult {
  return {
    status: result.status,
    rows: result.rows,
    columns: result.columns?.map((col) => ({
      field: col.field,
      label: col.label,
      samples: col.samples,
      confidence: col.confidence
    })),
    messages: result.messages?.map((msg) => ({
      level: msg.level ?? 'info',
      text: msg.text
    }))
  };
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.campaign-basics {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.campaign-basics__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.campaign-basics__title {
  margin: 0;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
}

.campaign-basics__subtitle {
  margin: $spacing-8 0 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.campaign-basics__actions {
  display: flex;
  gap: $spacing-12;
}

.campaign-basics__feedback {
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-8;
  background: rgba($color-primary-100, 0.6);
  color: $color-primary-800;
  font-size: $text-12-regular-fs;
  line-height: 1.4;
}

.campaign-basics__feedback[data-variant='error'] {
  background: rgba($color-danger-300, 0.2);
  color: $color-danger-700;
}

.campaign-basics__layout {
  display: grid;
  grid-template-columns: minmax(22rem, 25rem) 1fr;
  gap: $spacing-24;
  align-items: start;
}

.campaign-basics__loading {
  grid-column: span 2;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  color: $text-muted;
}

.campaign-basics__form {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
  background: $color-surface-0;
  border-radius: $radius-16;
  padding: $spacing-20;
  border: $border-width-1 solid $color-surface-200;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  border: none;
  padding: 0;
  margin: 0;
}

.form-section > legend {
  font-weight: $font-weight-semibold;
  color: $text-strong;
  margin-bottom: $spacing-8;
}

.form-section--inline {
  flex-direction: row;
  gap: $spacing-16;
}

.form-section--inline .form-field {
  flex: 1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.form-field > span {
  color: $text-muted;
}

.form-field > input,
.form-field > select,
.form-field > textarea {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-10 $spacing-12;
  font: inherit;
  background: $color-surface-0;
  color: $text-strong;
}

.checkbox,
.radio {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
  color: $text-strong;
}

.campaign-basics__panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
  background: $color-surface-0;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-16;
  padding: $spacing-24;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
}

.panel-header h2 {
  margin: 0;
  font-size: $text-16-semibold-fs;
}

.panel-header p {
  margin: ($spacing-8 / 2) 0 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.panel-header__actions {
  display: flex;
  gap: $spacing-8;
  align-items: center;
}

.recognition-card {
  border-radius: $radius-12;
  border: $border-width-1 dashed $color-primary-200;
  padding: $spacing-16;
  background: rgba($color-primary-100, 0.25);
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.recognition-card strong {
  color: $color-primary-700;
}

.recognition-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: $text-12-regular-fs;
  color: $text-strong;
}

.recognition-card__hint {
  font-size: $text-12-regular-fs;
  color: $text-muted;
  margin: 0;
}

.mappings {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.mappings__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.mappings__header h3 {
  margin: 0;
  font-size: $text-16-semibold-fs;
}

.mappings__header p {
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.mappings table {
  width: 100%;
  border-collapse: collapse;
  font-size: $text-12-regular-fs;
}

.mappings th,
.mappings td {
  text-align: left;
  padding: $spacing-8;
  border-bottom: $border-width-1 solid $color-surface-200;
}

.mappings thead {
  background: $color-surface-50;
}

.mappings td input {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-10;
  font: inherit;
}

.mappings__empty {
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.mappings__field-key {
  display: block;
  color: $text-muted;
  font-size: 0.75rem;
}

.example {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.example__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: $spacing-12;
}

.example__header h3 {
  margin: 0;
  font-size: $text-16-semibold-fs;
}

.example__header span {
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.example textarea {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  resize: vertical;
}

.example__result {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  border-radius: $radius-12;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-16;
  background: $color-surface-50;
}

.example__summary {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ($spacing-8 / 2);
  font-size: $text-12-regular-fs;
}

.example__result table {
  width: 100%;
  border-collapse: collapse;
  font-size: $text-12-regular-fs;
}

.example__result th,
.example__result td {
  text-align: left;
  padding: $spacing-8;
  border-bottom: $border-width-1 solid $color-surface-200;
}

.example__messages {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ($spacing-8 / 2);
}

.example__messages li {
  font-size: $text-12-regular-fs;
}

.example__messages li[data-level='warning'] {
  color: $color-warning-strong;
}

.example__messages li[data-level='error'] {
  color: $color-danger-700;
}

.muted {
  color: $text-muted;
}

.example__result table .mappings__field-key {
  display: inline-block;
  margin-left: ($spacing-8 / 2);
}

.example textarea,
.mappings td input,
.form-field > input,
.form-field > select,
.form-field > textarea {
  transition: border-color 0.2s ease;
}

.example textarea:focus,
.mappings td input:focus,
.form-field > input:focus,
.form-field > select:focus,
.form-field > textarea:focus {
  outline: none;
  border-color: $color-primary-300;
  box-shadow: $focus-ring-primary;
}

@media (max-width: 80rem) {
  .campaign-basics__layout {
    grid-template-columns: 1fr;
  }
}
</style>
