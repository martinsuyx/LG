<template>
  <section class="system-settings">
    <aside class="system-settings__nav">
      <nav>
        <button
          v-for="group in groups"
          :key="group.value"
          type="button"
          class="nav-item"
          :data-active="activeGroup === group.value"
          @click="setActive(group.value)"
        >
          <span>{{ group.label }}</span>
          <small>{{ workflowStatus(group.value) }}</small>
        </button>
      </nav>
    </aside>

    <div class="system-settings__content">
      <header class="content-header">
        <div>
          <h1>{{ activeGroupLabel }}</h1>
          <p>{{ groupDescriptions[activeGroup] }}</p>
        </div>
        <div class="content-actions">
          <Button size="sm" variant="ghost" :loading="loading.fetch" @click="loadSettings">刷新</Button>
          <Button size="sm" variant="secondary" :loading="loading.test" @click="testGroup">测试连接</Button>
          <Button size="sm" variant="secondary" :loading="loading.save" @click="saveDraft">保存草稿</Button>
          <Button size="sm" variant="primary" :loading="loading.submit" @click="submitGroup">提交审批</Button>
          <Button size="sm" variant="primary" :loading="loading.approve" @click="approveGroup" :disabled="workflowStatus(activeGroup) !== '已提交'">审批通过</Button>
        </div>
      </header>

      <section v-if="activeGroup === 'uploads'" class="settings-card">
        <h2>上传策略</h2>
        <form class="settings-form" @submit.prevent>
          <label>
            <span>存储提供商</span>
            <select v-model="form.uploads.provider">
              <option value="aliyun">阿里云 OSS</option>
              <option value="aws">AWS S3</option>
              <option value="gcp">GCP Storage</option>
              <option value="minio">MinIO</option>
            </select>
          </label>
          <label>
            <span>Bucket</span>
            <input type="text" v-model.trim="form.uploads.bucket" />
          </label>
          <label>
            <span>Region</span>
            <input type="text" v-model.trim="form.uploads.region" />
          </label>
          <label>
            <span>最大文件 (MB)</span>
            <input type="number" min="1" v-model.number="form.uploads.max_size_mb" />
          </label>
          <label>
            <span>允许类型 (逗号分隔)</span>
            <input type="text" v-model="uploadsAllowTypes" />
          </label>
          <label>
            <span>STS 有效期 (秒)</span>
            <input type="number" min="300" v-model.number="form.uploads.sts_ttl_seconds" />
          </label>
          <label>
            <span>CDN 域名</span>
            <input type="text" v-model.trim="form.uploads.cdn_domain" />
          </label>
          <label class="full">
            <span>Key 模板 JSON</span>
            <textarea rows="4" v-model="uploadsKeyTpls" spellcheck="false"></textarea>
          </label>
        </form>
      </section>

      <section v-else-if="activeGroup === 'secrets'" class="settings-card">
        <h2>证书与密钥</h2>
        <table class="simple-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>类型</th>
              <th>状态</th>
              <th>KID</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in form.secrets.items" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.kid }}</td>
              <td>{{ formatDateTime(item.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <label class="full">
          <span>轮换策略 JSON</span>
          <textarea rows="4" v-model="secretsPolicyJson" spellcheck="false"></textarea>
        </label>
        <label>
          <span>KMS 提供商</span>
          <select v-model="form.secrets.kms_provider">
            <option value="local">Local</option>
            <option value="aliyun_kms">阿里云 KMS</option>
            <option value="aws_kms">AWS KMS</option>
            <option value="gcp_kms">GCP KMS</option>
          </select>
        </label>
        <label>
          <span>Vault 路径</span>
          <input type="text" v-model.trim="form.secrets.vault_path" />
        </label>
      </section>

      <section v-else-if="activeGroup === 'flags'" class="settings-card">
        <h2>Feature Flags</h2>
        <table class="simple-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>名称</th>
              <th>状态</th>
              <th>百分比</th>
              <th>负责人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="flag in form.flags.flags" :key="flag.flag_key">
              <td>{{ flag.flag_key }}</td>
              <td>{{ flag.name }}</td>
              <td>
                <select v-model="flag.status">
                  <option value="off">关闭</option>
                  <option value="gray">灰度</option>
                  <option value="on">开启</option>
                </select>
              </td>
              <td>
                <input type="number" min="0" max="100" v-model.number="flag.gray_percent" />
              </td>
              <td>{{ flag.owner }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else-if="activeGroup === 'notify'" class="settings-card">
        <h2>通知与回调</h2>
        <div class="channel-list">
          <article v-for="channel in form.notify.channels" :key="channel.name" class="channel-card">
            <header>
              <h3>{{ channel.name }}</h3>
              <span class="status" :data-enabled="channel.enabled">{{ channel.enabled ? '启用' : '停用' }}</span>
            </header>
            <label>
              <span>通道类型</span>
              <select v-model="channel.channel">
                <option value="email">邮件</option>
                <option value="feishu">飞书</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
              </select>
            </label>
            <label>
              <span>Endpoint</span>
              <input type="text" v-model.trim="channel.endpoint" />
            </label>
            <label>
              <span>最大重试次数</span>
              <input type="number" min="0" v-model.number="channel.retry.max_times" />
            </label>
            <label>
              <span>退避策略</span>
              <select v-model="channel.retry.backoff">
                <option value="linear">线性</option>
                <option value="exp">指数</option>
              </select>
            </label>
          </article>
        </div>
      </section>

      <section v-else-if="activeGroup === 'i18n'" class="settings-card">
        <h2>国际化与精度</h2>
        <form class="settings-form" @submit.prevent>
          <label>
            <span>默认时区</span>
            <input type="text" v-model.trim="form.i18n.default_timezone" />
          </label>
          <label>
            <span>默认货币</span>
            <input type="text" v-model.trim="form.i18n.default_currency" />
          </label>
          <label>
            <span>金额小数位</span>
            <input type="number" min="0" max="4" v-model.number="form.i18n.decimal_scale.money" />
          </label>
          <label>
            <span>百分比小数位</span>
            <input type="number" min="0" max="3" v-model.number="form.i18n.decimal_scale.percent" />
          </label>
          <label>
            <span>重量小数位</span>
            <input type="number" min="0" max="3" v-model.number="form.i18n.decimal_scale.weight" />
          </label>
          <label class="full">
            <span>公司覆盖 JSON</span>
            <textarea rows="4" v-model="i18nLocaleJson" spellcheck="false"></textarea>
          </label>
        </form>
      </section>

      <section v-else class="settings-card">
        <h2>认证与单点</h2>
        <form class="settings-form" @submit.prevent>
          <div class="form-group">
            <h3>JWT 配置</h3>
            <label>
              <span>Issuer</span>
              <input type="text" v-model.trim="form.auth.jwt.issuer" />
            </label>
            <label>
              <span>Audience</span>
              <input type="text" v-model.trim="form.auth.jwt.audience" />
            </label>
            <label>
              <span>算法</span>
              <select v-model="form.auth.jwt.alg">
                <option value="RS256">RS256</option>
                <option value="ES256">ES256</option>
                <option value="HS256">HS256</option>
              </select>
            </label>
            <label>
              <span>活动 KID</span>
              <input type="text" v-model.trim="form.auth.jwt.kid_active" />
            </label>
            <label>
              <span>Access TTL (分钟)</span>
              <input type="number" min="5" max="120" v-model.number="form.auth.jwt.access_ttl_minutes" />
            </label>
            <label>
              <span>Refresh TTL (天)</span>
              <input type="number" min="1" max="30" v-model.number="form.auth.jwt.refresh_ttl_days" />
            </label>
          </div>
          <div class="form-group">
            <h3>SSO / OIDC</h3>
            <label>
              <span>类型</span>
              <select v-model="form.auth.sso.type">
                <option value="oidc">OIDC</option>
                <option value="oauth2">OAuth2</option>
                <option value="saml2">SAML2</option>
              </select>
            </label>
            <label>
              <span>Client ID</span>
              <input type="text" v-model.trim="form.auth.sso.client_id" />
            </label>
            <label>
              <span>Redirect URI</span>
              <input type="text" v-model.trim="form.auth.sso.redirect_uri" />
            </label>
            <label class="full">
              <span>Scopes (逗号分隔)</span>
              <input type="text" v-model="ssoScopes" />
            </label>
          </div>
        </form>
      </section>

      <p v-if="feedback.message" :class="['feedback', feedback.error ? 'feedback--error' : '']" role="alert">
        {{ feedback.message }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import Button from '@/components/Button.vue';
import { SystemSettingsService, type SettingsResponse } from '@/sdk/settings';

type SettingsGroup = 'uploads' | 'secrets' | 'flags' | 'notify' | 'i18n' | 'auth';

const groups = [
  { value: 'uploads' as SettingsGroup, label: '上传策略' },
  { value: 'secrets' as SettingsGroup, label: '证书与密钥' },
  { value: 'flags' as SettingsGroup, label: 'Feature Flags' },
  { value: 'notify' as SettingsGroup, label: '通知与回调' },
  { value: 'i18n' as SettingsGroup, label: '国际化' },
  { value: 'auth' as SettingsGroup, label: '认证与单点' }
];

const groupDescriptions: Record<SettingsGroup, string> = {
  uploads: '配置文件上传、直传策略与允许的类型。',
  secrets: '维护证书和密钥轮换策略，保障凭证安全。',
  flags: '管理功能开关与灰度范围。',
  notify: '设置通知通道、模板与订阅策略。',
  i18n: '配置时区、货币与十进制精度。',
  auth: '配置 JWT & SSO 等认证策略。'
};

const loading = reactive({ fetch: false, save: false, submit: false, approve: false, test: false });
const feedback = reactive<{ message: string; error: boolean }>({ message: '', error: false });

const activeGroup = ref<SettingsGroup>('uploads');

const defaultSettings: SettingsResponse = {
  uploads: {
    provider: 'aliyun',
    bucket: 'lg-prod',
    region: 'cn-guangzhou',
    key_tpls: [{ biz: 'order_attachment', template: 'orders/${date}/${uuid}.jpg', ttl_seconds: 86400 }],
    max_size_mb: 10,
    allow_types: ['jpg', 'png', 'pdf'],
    sts_ttl_seconds: 900,
    cdn_domain: 'https://cdn.example.com'
  },
  secrets: {
    items: [],
    rotation_policy: { rotate_every_days: 90, overlap_days: 7, notify_before_days: 14 },
    kms_provider: 'local',
    vault_path: ''
  },
  flags: { flags: [] },
  notify: { channels: [], templates: [], subscriptions: [] },
  i18n: {
    default_timezone: 'Asia/Shanghai',
    default_currency: 'CNY',
    decimal_scale: { money: 2, percent: 2, weight: 3 },
    locale_options: []
  },
  auth: {
    jwt: {
      issuer: 'lg-platform',
      audience: 'lg-clients',
      alg: 'RS256',
      kid_active: 'kid-default',
      access_ttl_minutes: 30,
      refresh_ttl_days: 7,
      clock_skew_sec: 30
    },
    sso: {
      type: 'oidc',
      client_id: 'client-default',
      redirect_uri: 'https://admin.example.com/callback',
      issuer: 'https://login.example.com',
      auth_url: 'https://login.example.com/auth',
      token_url: 'https://login.example.com/token',
      scopes: ['openid', 'profile', 'email'],
      mapping: { email: 'username', groups: 'roles' }
    }
  },
  workflow: {
    uploads: { status: 'effective', updated_at: new Date().toISOString(), updated_by: 'ops_admin' }
  }
};

const form = reactive<Required<SettingsResponse>>({
  uploads: structuredClone(defaultSettings.uploads) as Record<string, any>,
  secrets: structuredClone(defaultSettings.secrets) as Record<string, any>,
  flags: structuredClone(defaultSettings.flags) as Record<string, any>,
  notify: structuredClone(defaultSettings.notify) as Record<string, any>,
  i18n: structuredClone(defaultSettings.i18n) as Record<string, any>,
  auth: structuredClone(defaultSettings.auth) as Record<string, any>,
  workflow: structuredClone(defaultSettings.workflow || {}) as Record<string, any>
});

async function loadSettings() {
  loading.fetch = true;
  try {
    const response = await SystemSettingsService.getAll();
    const payload = response && Object.keys(response).length ? response : defaultSettings;
    if (payload.uploads) {
      Object.assign(form.uploads, payload.uploads);
      form.uploads.allow_types = Array.isArray(payload.uploads.allow_types) ? [...payload.uploads.allow_types] : [];
      form.uploads.key_tpls = Array.isArray(payload.uploads.key_tpls) ? [...payload.uploads.key_tpls] : [];
    }
    if (payload.secrets) {
      Object.assign(form.secrets, payload.secrets);
      form.secrets.items = Array.isArray(payload.secrets.items) ? [...payload.secrets.items] : [];
    }
    if (payload.flags) {
      Object.assign(form.flags, payload.flags);
      form.flags.flags = Array.isArray(payload.flags.flags) ? [...payload.flags.flags] : [];
    }
    if (payload.notify) {
      Object.assign(form.notify, payload.notify);
      form.notify.channels = Array.isArray(payload.notify.channels) ? [...payload.notify.channels] : [];
      form.notify.templates = Array.isArray(payload.notify.templates) ? [...payload.notify.templates] : [];
      form.notify.subscriptions = Array.isArray(payload.notify.subscriptions) ? [...payload.notify.subscriptions] : [];
    }
    if (payload.i18n) {
      Object.assign(form.i18n, payload.i18n);
      form.i18n.locale_options = Array.isArray(payload.i18n.locale_options) ? [...payload.i18n.locale_options] : [];
    }
    if (payload.auth) {
      form.auth.jwt = { ...form.auth.jwt, ...(payload.auth.jwt || {}) };
      form.auth.sso = { ...form.auth.sso, ...(payload.auth.sso || {}) };
      form.auth = { ...form.auth };
      form.auth.sso.scopes = Array.isArray(form.auth.sso.scopes) ? [...form.auth.sso.scopes] : [];
    }
    form.workflow = payload.workflow ? { ...payload.workflow } : {};
  } catch (error) {
    setFeedback((error as Error).message || '加载设置失败，展示示例数据。', true);
  } finally {
    loading.fetch = false;
  }
}

onMounted(() => {
  loadSettings();
});

const activeGroupLabel = computed(() => groups.find((item) => item.value === activeGroup.value)?.label || '设置');

const uploadsAllowTypes = computed({
  get: () => (form.uploads.allow_types || []).join(','),
  set: (val: string) => {
    form.uploads.allow_types = val.split(',').map((item) => item.trim()).filter(Boolean);
  }
});

const uploadsKeyTpls = computed({
  get: () => stringifySafely(form.uploads.key_tpls),
  set: (val: string) => {
    form.uploads.key_tpls = parseSafely(val, form.uploads.key_tpls);
  }
});

const secretsPolicyJson = computed({
  get: () => stringifySafely(form.secrets.rotation_policy),
  set: (val: string) => {
    form.secrets.rotation_policy = parseSafely(val, form.secrets.rotation_policy);
  }
});

const i18nLocaleJson = computed({
  get: () => stringifySafely(form.i18n.locale_options),
  set: (val: string) => {
    form.i18n.locale_options = parseSafely(val, form.i18n.locale_options);
  }
});

const ssoScopes = computed({
  get: () => (form.auth.sso.scopes || []).join(','),
  set: (val: string) => {
    form.auth.sso.scopes = val.split(',').map((item) => item.trim()).filter(Boolean);
  }
});

function workflowStatus(group: SettingsGroup) {
  const status = form.workflow?.[group]?.status;
  if (!status) return '无记录';
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已审批',
    rejected: '已驳回',
    effective: '已生效'
  };
  return map[status] || status;
}

function setActive(group: SettingsGroup) {
  activeGroup.value = group;
}

async function saveDraft() {
  loading.save = true;
  try {
    const payload = extractGroupPayload(activeGroup.value);
    await SystemSettingsService.save(activeGroup.value, payload);
    updateWorkflow(activeGroup.value, 'draft');
    setFeedback('已保存草稿。', false);
  } catch (error) {
    setFeedback((error as Error).message || '保存草稿失败。', true);
  } finally {
    loading.save = false;
  }
}

async function submitGroup() {
  loading.submit = true;
  try {
    await SystemSettingsService.submit(activeGroup.value);
    updateWorkflow(activeGroup.value, 'submitted');
    setFeedback('已提交审批。', false);
  } catch (error) {
    setFeedback((error as Error).message || '提交失败。', true);
  } finally {
    loading.submit = false;
  }
}

async function approveGroup() {
  loading.approve = true;
  try {
    await SystemSettingsService.approve(activeGroup.value);
    updateWorkflow(activeGroup.value, 'effective');
    setFeedback('设置已生效。', false);
  } catch (error) {
    setFeedback((error as Error).message || '审批失败。', true);
  } finally {
    loading.approve = false;
  }
}

async function testGroup() {
  loading.test = true;
  try {
    const response = await SystemSettingsService.test(activeGroup.value, extractGroupPayload(activeGroup.value));
    const detail = response?.detail || '测试通过。';
    setFeedback(detail, !response?.ok);
  } catch (error) {
    setFeedback((error as Error).message || '测试失败。', true);
  } finally {
    loading.test = false;
  }
}

function extractGroupPayload(group: SettingsGroup) {
  return JSON.parse(JSON.stringify(form[group] || {}));
}

function updateWorkflow(group: SettingsGroup, status: 'draft' | 'submitted' | 'effective') {
  if (!form.workflow) form.workflow = {} as any;
  form.workflow[group] = {
    status,
    updated_at: new Date().toISOString(),
    updated_by: 'current_user'
  };
}

function setFeedback(message: string, error: boolean) {
  feedback.message = message;
  feedback.error = error;
  if (!message) return;
  window.setTimeout(() => {
    if (feedback.message === message) {
      feedback.message = '';
      feedback.error = false;
    }
  }, error ? 5000 : 3000);
}

function stringifySafely(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '[]';
  }
}

function parseSafely<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.system-settings {
  display: grid;
  grid-template-columns: minmax(14rem, 18rem) 1fr;
  gap: $spacing-24;
}

.system-settings__nav {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  box-shadow: 0 12px 32px rgba($color-surface-700, 0.08);
  padding: $spacing-16;
  nav {
    display: flex;
    flex-direction: column;
    gap: $spacing-8;
  }
}

.nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-lg;
  border: none;
  background: $surface-50;
  cursor: pointer;
  font: inherit;
  color: $text-strong;
  transition: $transition-fast;
  small {
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
  &[data-active='true'] {
    background: $primary-100;
    color: $primary-700;
    font-weight: $text-12-medium-wt;
  }
}

.system-settings__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
  h1 {
    margin: 0 0 $spacing-8;
    font-size: $title-18-semibold-fs;
  }
  p {
    margin: 0;
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.content-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-8;
}

.settings-card {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20 $spacing-24;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  h2 {
    margin: 0;
    font-size: $text-16-semibold-fs;
  }
}

.settings-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: $spacing-12;
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
    input,
    select,
    textarea {
      border: $border-width-1 solid $surface-200;
      border-radius: $radius-lg;
      padding: $spacing-8 $spacing-12;
      font: inherit;
      color: $text-strong;
      background: $surface-0;
    }
    textarea {
      resize: vertical;
      font-family: 'SFMono-Regular', ui-monospace, monospace;
    }
  }
}

.settings-form .full {
  grid-column: 1 / -1;
}

.simple-table {
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    text-align: left;
    padding: $spacing-8 $spacing-12;
    border-bottom: $border-width-1 solid $surface-200;
    font-size: $text-12-regular-fs;
  }
  th {
    color: $text-muted;
  }
}

.channel-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: $spacing-12;
}

.channel-card {
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    h3 {
      margin: 0;
      font-size: $text-14-regular-fs;
      font-weight: $text-16-semibold-wt;
    }
    .status {
      font-size: $text-12-regular-fs;
      color: $text-muted;
      &[data-enabled='true'] {
        color: $primary-700;
      }
      &[data-enabled='false'] {
        color: $danger-600;
      }
    }
  }
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
    input,
    select {
      border: $border-width-1 solid $surface-200;
      border-radius: $radius-lg;
      padding: $spacing-8 $spacing-12;
      font: inherit;
    }
  }
}

.form-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: $spacing-12;
  h3 {
    grid-column: 1 / -1;
    margin: 0;
    font-size: $text-14-regular-fs;
    font-weight: $text-16-semibold-wt;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
    input,
    select {
      border: $border-width-1 solid $surface-200;
      border-radius: $radius-lg;
      padding: $spacing-8 $spacing-12;
      font: inherit;
    }
  }
  .full {
    grid-column: 1 / -1;
  }
}

.chain-list code {
  padding: 0 calc(#{$spacing-8} / 2);
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-lg;
  background: rgba($primary-100, 0.6);
  color: $primary-700;
  font-size: $text-12-regular-fs;
  &.feedback--error {
    background: rgba($danger-600, 0.12);
    color: $danger-700;
  }
}

.event-drawer__close,
.row-actions .link-btn,
.content-actions Button {
  white-space: nowrap;
}

@media (max-width: 70rem) {
  .system-settings {
    grid-template-columns: 1fr;
  }
  .system-settings__nav {
    position: static;
  }
}
</style>
