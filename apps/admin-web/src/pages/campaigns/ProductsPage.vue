<template>
  <section class="campaign-products">
    <header class="campaign-products__header">
      <div>
        <h1 class="campaign-products__title">{{ t('campaignProducts.title') }}</h1>
        <p class="campaign-products__subtitle">{{ t('campaignProducts.subtitle') }}</p>
      </div>
      <div class="campaign-products__actions">
        <Button size="sm" variant="primary" :disabled="loading" @click="openCreateProduct">
          {{ t('campaignProducts.actions.newProduct') }}
        </Button>
        <Button size="sm" variant="secondary" :disabled="loading || !canAddPackage" @click="openCreatePackage">
          {{ t('campaignProducts.actions.newPackage') }}
        </Button>
        <Button size="sm" variant="secondary" :disabled="loading" @click="openCopyModal">
          {{ t('campaignProducts.actions.copyTemplate') }}
        </Button>
        <Button size="sm" variant="secondary" :disabled="loading" @click="openImportModal">
          {{ t('campaignProducts.actions.import') }}
        </Button>
        <Button size="sm" variant="ghost" :disabled="loading" @click="exportPackages">
          {{ t('campaignProducts.actions.export') }}
        </Button>
      </div>
    </header>

    <section class="campaign-products__info">
      <dl>
        <div>
          <dt>{{ t('campaignProducts.info.campaign') }}</dt>
          <dd>{{ campaignSummary.name || '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('campaignProducts.info.period') }}</dt>
          <dd>{{ campaignSummary.period || '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('campaignProducts.info.status') }}</dt>
          <dd>{{ campaignSummary.status || '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('campaignProducts.info.matching') }}</dt>
          <dd>{{ campaignSummary.matchingMode || '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('campaignProducts.info.updated') }}</dt>
          <dd>{{ campaignSummary.updatedAt || '—' }}</dd>
        </div>
      </dl>
    </section>

    <p v-if="feedback.message" class="campaign-products__feedback" :data-variant="feedback.variant">
      {{ feedback.message }}
    </p>

    <div class="campaign-products__layout">
      <aside class="products-tree">
        <form class="products-tree__search" @submit.prevent>
          <input
            type="search"
            :placeholder="t('campaignProducts.searchPlaceholder')"
            v-model.trim="treeKeyword"
          />
        </form>
        <ul class="products-tree__list">
          <li
            v-for="item in flattenedTree"
            :key="item.node.node_id"
            class="tree-node"
            :data-type="item.node.type"
            :data-active="activeNodeId === item.node.node_id"
            :style="{ '--depth': item.depth }"
          >
            <div class="tree-node__row">
              <button
                type="button"
                class="tree-node__toggle"
                :disabled="!item.node.children.length"
                @click.stop="toggleNode(item.node.node_id)"
              >
                <span v-if="item.node.children.length">{{ expandedNodes.has(item.node.node_id) ? '▾' : '▸' }}</span>
              </button>
              <button type="button" class="tree-node__label" @click="selectNode(item.node.node_id)">
                <span class="tree-node__name">{{ item.node.name }}</span>
                <span class="tree-node__meta" v-if="item.node.type === 'package'">
                  {{ item.node.package_detail?.price?.toFixed(2) ?? '0.00' }} ¥
                </span>
              </button>
            </div>
          </li>
        </ul>
      </aside>

      <main class="products-panel" :aria-busy="panelLoading ? 'true' : 'false'">
        <div v-if="panelLoading" class="products-panel__loading">{{ t('campaignProducts.loading') }}</div>

        <template v-else>
          <div v-if="selectedPackage" class="package-form">
            <header class="package-form__head">
              <div>
                <h2>{{ selectedPackage.name }}</h2>
                <p>{{ packageForm.description || t('campaignProducts.package.noDescription') }}</p>
              </div>
              <span class="package-form__status" :data-status="selectedPackage.status">
                {{ packageStatusLabel(selectedPackage.status) }}
              </span>
            </header>

            <ul v-if="packageForm.metrics" class="package-form__stats">
              <li>
                <strong>{{ packageForm.metrics.promoter_count ?? 0 }}</strong>
                <span>{{ t('campaignProducts.package.metrics.promoters') }}</span>
              </li>
              <li>
                <strong>{{ packageForm.metrics.matched_orders ?? 0 }}</strong>
                <span>{{ t('campaignProducts.package.metrics.orders') }}</span>
              </li>
            </ul>

            <div class="package-form__grid">
              <label>
                <span>{{ t('campaignProducts.package.planName') }}</span>
                <input
                  type="text"
                  :aria-label="t('campaignProducts.package.planName')"
                  v-model.trim="packageForm.name"
                  :disabled="saving"
                />
              </label>
              <label>
                <span>{{ t('campaignProducts.package.price') }}</span>
                <div class="package-form__input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    :aria-label="t('campaignProducts.package.price')"
                    v-model.number="packageForm.price"
                    :disabled="saving"
                  />
                  <span>¥</span>
                </div>
              </label>
              <label>
                <span>{{ t('campaignProducts.package.status') }}</span>
                <select v-model="packageForm.status" :disabled="saving" :aria-label="t('campaignProducts.package.status')">
                  <option value="active">{{ t('campaignProducts.package.statusActive') }}</option>
                  <option value="archived">{{ t('campaignProducts.package.statusArchived') }}</option>
                </select>
              </label>
              <label class="package-form__textarea">
                <span>{{ t('campaignProducts.package.description') }}</span>
                <textarea
                  rows="3"
                  :aria-label="t('campaignProducts.package.description')"
                  v-model.trim="packageForm.description"
                  :disabled="saving"
                />
              </label>
            </div>

            <section class="package-form__section">
              <header>
                <h3>{{ t('campaignProducts.package.defaultCommission') }}</h3>
                <p>{{ t('campaignProducts.package.defaultCommissionHint') }}</p>
              </header>
              <CommissionField
                v-model="packageForm.commission_default"
                :disabled="saving"
                :allow-tier="true"
              />
            </section>

            <section class="package-form__section">
              <header>
                <h3>{{ t('campaignProducts.package.caps.title') }}</h3>
                <p>{{ t('campaignProducts.package.caps.subtitle') }}</p>
              </header>
              <div class="caps-grid">
                <label>
                  <span>{{ t('campaignProducts.package.caps.min') }}</span>
                  <input
                    type="number"
                    step="0.01"
                    :aria-label="t('campaignProducts.package.caps.min')"
                    :disabled="saving"
                    v-model.number="packageForm.caps.min"
                  />
                </label>
                <label>
                  <span>{{ t('campaignProducts.package.caps.max') }}</span>
                  <input
                    type="number"
                    step="0.01"
                    :aria-label="t('campaignProducts.package.caps.max')"
                    :disabled="saving"
                    v-model.number="packageForm.caps.max"
                  />
                </label>
                <label class="caps-grid__checkbox">
                  <input
                    type="checkbox"
                    :disabled="saving"
                    v-model="packageForm.caps.allow_override"
                    :aria-label="t('campaignProducts.package.caps.allowOverride')"
                  />
                  <span>{{ t('campaignProducts.package.caps.allowOverride') }}</span>
                </label>
                <label class="caps-grid__checkbox">
                  <input
                    type="checkbox"
                    :disabled="saving"
                    v-model="packageForm.caps.approval_required"
                    :aria-label="t('campaignProducts.package.caps.approvalRequired')"
                  />
                  <span>{{ t('campaignProducts.package.caps.approvalRequired') }}</span>
                </label>
              </div>
            </section>

            <section class="package-form__section">
              <header>
                <h3>{{ t('campaignProducts.share.title') }}</h3>
                <p>{{ t('campaignProducts.share.subtitle') }}</p>
              </header>
              <div class="share-grid">
                <label v-for="role in shareRuleRoles" :key="role" class="share-grid__item">
                  <span>{{ t(`campaignProducts.share.roles.${role}`) }}</span>
                  <div class="share-grid__input">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      :disabled="saving"
                      v-model.number="packageForm.share_rules[role]"
                      :aria-label="t(`campaignProducts.share.roles.${role}`)"
                    />
                    <span>{{ t('campaignProducts.share.unit') }}</span>
                  </div>
                </label>
              </div>
            </section>

            <footer class="package-form__footer">
              <Button size="sm" variant="primary" :loading="saving" @click="savePackage">
                {{ t('campaignProducts.package.save') }}
              </Button>
            </footer>
          </div>

          <div v-else-if="selectedProduct" class="product-form">
            <header class="product-form__head">
              <div>
                <h2>{{ productForm.name }}</h2>
                <p>{{ t('campaignProducts.product.subtitle') }}</p>
              </div>
              <span class="product-form__status" :data-status="selectedProduct.status">
                {{ packageStatusLabel(selectedProduct.status as 'active' | 'archived') }}
              </span>
            </header>

            <div class="product-form__grid">
              <label>
                <span>{{ t('campaignProducts.modals.productName') }}</span>
                <input
                  type="text"
                  v-model.trim="productForm.name"
                  :disabled="saving"
                  :aria-label="t('campaignProducts.modals.productName')"
                />
              </label>
              <label>
                <span>{{ t('campaignProducts.product.externalKey') }}</span>
                <input
                  type="text"
                  v-model="productForm.external_keys"
                  :placeholder="t('campaignProducts.product.externalKeyHint')"
                  :disabled="saving"
                  :aria-label="t('campaignProducts.product.externalKey')"
                />
              </label>
              <label>
                <span>{{ t('campaignProducts.product.keywords') }}</span>
                <input
                  type="text"
                  v-model="productForm.keywords"
                  :placeholder="t('campaignProducts.product.keywordsHint')"
                  :disabled="saving"
                  :aria-label="t('campaignProducts.product.keywords')"
                />
              </label>
              <label>
                <span>{{ t('campaignProducts.product.category') }}</span>
                <input
                  type="text"
                  v-model.trim="productForm.category"
                  :disabled="saving"
                  :aria-label="t('campaignProducts.product.category')"
                />
              </label>
              <label class="product-form__textarea">
                <span>{{ t('campaignProducts.product.remark') }}</span>
                <textarea
                  rows="3"
                  v-model.trim="productForm.remark"
                  :disabled="saving"
                  :aria-label="t('campaignProducts.product.remark')"
                />
              </label>
            </div>

            <footer class="product-form__footer">
              <Button size="sm" variant="secondary" :disabled="loading" @click="openCreatePackage">
                {{ t('campaignProducts.actions.newPackage') }}
              </Button>
              <span class="product-form__spacer" />
              <Button size="sm" variant="primary" :loading="saving" @click="saveProduct">
                {{ t('campaignProducts.product.save') }}
              </Button>
            </footer>
          </div>

          <div v-else class="product-placeholder">
            <p>{{ t('campaignProducts.placeholders.selectNode') }}</p>
          </div>
        </template>
      </main>
    </div>

    <Modal v-model="modals.createProduct" @confirm="submitCreateProduct">
      <template #title>{{ t('campaignProducts.modals.newProductTitle') }}</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>{{ t('campaignProducts.modals.productName') }}</span>
          <input type="text" v-model.trim="createProductForm.name" :aria-label="t('campaignProducts.modals.productName')" />
        </label>
        <label>
          <span>{{ t('campaignProducts.product.externalKey') }}</span>
          <input type="text" v-model="createProductForm.external_keys" :aria-label="t('campaignProducts.product.externalKey')" />
        </label>
        <label>
          <span>{{ t('campaignProducts.product.keywords') }}</span>
          <input type="text" v-model="createProductForm.keywords" :aria-label="t('campaignProducts.product.keywords')" />
        </label>
        <label>
          <span>{{ t('campaignProducts.product.category') }}</span>
          <input type="text" v-model.trim="createProductForm.category" :aria-label="t('campaignProducts.product.category')" />
        </label>
        <label class="modal-form__textarea">
          <span>{{ t('campaignProducts.product.remark') }}</span>
          <textarea rows="3" v-model.trim="createProductForm.remark" :aria-label="t('campaignProducts.product.remark')" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="closeCreateProduct" :disabled="saving">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="saving" @click="submitCreateProduct">{{ t('common.confirm') }}</Button>
      </template>
    </Modal>

    <Modal v-model="modals.createPackage" @confirm="submitCreatePackage">
      <template #title>{{ t('campaignProducts.modals.newPackageTitle') }}</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>{{ t('campaignProducts.modals.packageName') }}</span>
          <input type="text" v-model.trim="createPackageForm.name" :aria-label="t('campaignProducts.modals.packageName')" />
        </label>
        <label>
          <span>{{ t('campaignProducts.package.price') }}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            v-model.number="createPackageForm.price"
            :aria-label="t('campaignProducts.package.price')"
          />
        </label>
        <CommissionField v-model="createPackageForm.commission_default" />
        <div class="modal-form__share">
          <label v-for="role in shareRuleRoles" :key="role">
            <span>{{ t(`campaignProducts.share.roles.${role}`) }}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              v-model.number="createPackageForm.share_rules[role]"
              :aria-label="t(`campaignProducts.share.roles.${role}`)"
            />
          </label>
        </div>
      </form>
      <template #footer>
        <Button variant="secondary" @click="closeCreatePackage" :disabled="saving">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="saving" @click="submitCreatePackage">{{ t('common.confirm') }}</Button>
      </template>
    </Modal>

    <Modal v-model="modals.copy" @confirm="submitCopyTemplate">
      <template #title>{{ t('campaignProducts.modals.copyTitle') }}</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>{{ t('campaignProducts.modals.copyTemplate') }}</span>
          <select v-model="copyForm.template_id" :aria-label="t('campaignProducts.modals.copyTemplate')">
            <option value="">{{ t('campaignProducts.modals.copyPlaceholder') }}</option>
            <option v-for="tpl in templateOptions" :key="tpl.template_id" :value="tpl.template_id">
              {{ tpl.name }}
            </option>
          </select>
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="copyForm.overwrite" :aria-label="t('campaignProducts.modals.copyOverwrite')" />
          <span>{{ t('campaignProducts.modals.copyOverwrite') }}</span>
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="closeCopyModal" :disabled="saving">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="saving" @click="submitCopyTemplate">{{ t('common.confirm') }}</Button>
      </template>
    </Modal>

    <Modal v-model="modals.import" @confirm="submitImport">
      <template #title>{{ t('campaignProducts.modals.importTitle') }}</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>{{ t('campaignProducts.modals.importToken') }}</span>
          <input type="text" v-model.trim="importForm.upload_token" :aria-label="t('campaignProducts.modals.importToken')" />
        </label>
        <label>
          <span>{{ t('campaignProducts.modals.importEmail') }}</span>
          <input type="email" v-model.trim="importForm.notify_email" :aria-label="t('campaignProducts.modals.importEmail')" />
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="importForm.dry_run" :aria-label="t('campaignProducts.modals.importDryRun')" />
          <span>{{ t('campaignProducts.modals.importDryRun') }}</span>
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="closeImportModal" :disabled="saving">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="saving" @click="submitImport">{{ t('common.confirm') }}</Button>
      </template>
    </Modal>

    <Modal v-model="modals.importTask" hide-footer>
      <template #title>{{ t('campaignProducts.modals.importTaskTitle') }}</template>
      <div class="import-task">
        <p><strong>ID：</strong>{{ importTask?.task_id }}</p>
        <p><strong>{{ t('campaignProducts.import.status') }}：</strong>{{ importStatusLabel(importTask?.status) }}</p>
        <p v-if="importTask?.processed != null && importTask?.total != null">
          {{ importTask.processed }} / {{ importTask.total }}
        </p>
        <ul v-if="importTask?.errors?.length" class="import-task__errors">
          <li v-for="error in importTask.errors" :key="`${error.row}-${error.message}`">
            {{ error.row }} · {{ error.message }}
          </li>
        </ul>
        <p v-if="importTask?.result_url">
          <a :href="importTask.result_url" target="_blank">{{ t('campaignProducts.import.download') }}</a>
        </p>
      </div>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import CommissionField from '@/components/CommissionField.vue';
import type { CommissionValue } from '@/sdk/commission';
import {
  CampaignProductsService,
  type CampaignProductNode,
  type CampaignProductTemplate,
  type CampaignPackageDetail,
  type CampaignProductsTreeResponse
} from '@/sdk/campaignProducts';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();

interface TreeViewNode extends CampaignProductNode {
  expanded: boolean;
  children: TreeViewNode[];
}

const shareRuleRoles = ['promoter', 'leader', 'city_head'] as const;

const campaignSummary = reactive({
  name: '',
  period: '',
  status: '',
  matchingMode: '',
  updatedAt: ''
});

const campaignId = computed(() => String(route.params.id || ''));

const loading = ref(false);
const panelLoading = ref(false);
const saving = ref(false);
const treeData = ref<TreeViewNode[]>([]);
const treeKeyword = ref('');
const expandedNodes = reactive(new Set<string>());
const activeNodeId = ref<string | null>(null);
const templateOptions = ref<CampaignProductTemplate[]>([]);
const importTask = ref<Awaited<ReturnType<typeof CampaignProductsService.getImportTask>> | null>(null);
let importPoll: ReturnType<typeof setTimeout> | null = null;

const feedback = reactive({ message: '', variant: 'info' as 'info' | 'error' });

const selectedNode = computed(() => (activeNodeId.value ? findNode(treeData.value, activeNodeId.value) : null));
const selectedPackage = computed(() =>
  selectedNode.value && selectedNode.value.type === 'package' ? selectedNode.value : null
);
const selectedProduct = computed(() =>
  selectedNode.value && selectedNode.value.type === 'product' ? selectedNode.value : null
);
const canAddPackage = computed(() => !!selectedProduct.value);

const packageForm = reactive({
  node_id: '',
  name: '',
  status: 'active' as 'active' | 'archived',
  price: 0,
  description: '',
  commission_default: null as CommissionValue | null,
  caps: {
    min: null as number | null,
    max: null as number | null,
    allow_override: false,
    approval_required: false
  },
  share_rules: {
    promoter: 0.7,
    leader: 0.2,
    city_head: 0.1
  } as Record<(typeof shareRuleRoles)[number], number>,
  metrics: {
    promoter_count: undefined as number | undefined,
    matched_orders: undefined as number | undefined
  }
});

const productForm = reactive({
  node_id: '',
  name: '',
  external_keys: '',
  keywords: '',
  category: '',
  remark: ''
});

function resetPackageForm() {
  Object.assign(packageForm, {
    node_id: '',
    name: '',
    status: 'active' as 'active' | 'archived',
    price: 0,
    description: '',
    commission_default: null as CommissionValue | null,
    caps: {
      min: null as number | null,
      max: null as number | null,
      allow_override: false,
      approval_required: false
    },
    share_rules: {
      promoter: 0.7,
      leader: 0.2,
      city_head: 0.1
    },
    metrics: {
      promoter_count: undefined,
      matched_orders: undefined
    }
  });
}

const modals = reactive({
  createProduct: false,
  createPackage: false,
  copy: false,
  import: false,
  importTask: false
});

const createProductForm = reactive({
  name: '',
  external_keys: '',
  keywords: '',
  category: '',
  remark: ''
});
const createPackageForm = reactive({
  name: '',
  price: 0,
  commission_default: { type: 'fixed', value: 0 } as CommissionValue,
  share_rules: {
    promoter: 0.7,
    leader: 0.2,
    city_head: 0.1
  } as Record<(typeof shareRuleRoles)[number], number>
});

const copyForm = reactive({ template_id: '', overwrite: false });
const importForm = reactive({ upload_token: '', notify_email: '', dry_run: false });

const visibleTree = computed(() => {
  if (!treeKeyword.value.trim()) return treeData.value;
  const keyword = treeKeyword.value.trim().toLowerCase();
  return filterTree(treeData.value, keyword);
});

const flattenedTree = computed(() => flattenTree(visibleTree.value));

watch(
  () => campaignId.value,
  () => {
    void loadTree();
  },
  { immediate: true }
);

watch(
  () => selectedPackage.value,
  (pkg) => {
    if (!pkg?.package_detail) {
      panelLoading.value = false;
      resetPackageForm();
      return;
    }
    panelLoading.value = true;
    Object.assign(packageForm, mapPackageDetail(pkg, pkg.package_detail));
    panelLoading.value = false;
  },
  { immediate: true }
);

watch(
  () => selectedProduct.value,
  (product) => {
    if (!product) {
      productForm.node_id = '';
      productForm.name = '';
      productForm.external_keys = '';
      productForm.keywords = '';
      productForm.category = '';
      productForm.remark = '';
      return;
    }
    mapProductDetail(product);
  },
  { immediate: true }
);

function filterTree(nodes: TreeViewNode[], keyword: string): TreeViewNode[] {
  const result: TreeViewNode[] = [];
  nodes.forEach((node) => {
    const children = filterTree(node.children, keyword);
    const matched = node.name.toLowerCase().includes(keyword);
    if (matched || children.length) {
      result.push({
        ...node,
        children,
        expanded: matched || children.length ? true : node.expanded
      });
      expandedNodes.add(node.node_id);
    }
  });
  return result;
}

function flattenTree(nodes: TreeViewNode[], depth = 0, acc: Array<{ node: TreeViewNode; depth: number }> = []) {
  nodes.forEach((node) => {
    acc.push({ node, depth });
    const shouldExpand = node.children.length && (expandedNodes.has(node.node_id) || node.expanded);
    if (shouldExpand) {
      flattenTree(node.children, depth + 1, acc);
    }
  });
  return acc;
}

function findNode(nodes: TreeViewNode[], id: string): TreeViewNode | null {
  for (const node of nodes) {
    if (node.node_id === id) return node;
    const child = findNode(node.children, id);
    if (child) return child;
  }
  return null;
}

function findFirstPackage(nodes: TreeViewNode[]): TreeViewNode | null {
  for (const node of nodes) {
    if (node.type === 'package') return node;
    const child = findFirstPackage(node.children);
    if (child) return child;
  }
  return null;
}

function findPath(nodes: TreeViewNode[], targetId: string, trail: TreeViewNode[] = []): TreeViewNode[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.node_id === targetId) return nextTrail;
    const childPath = findPath(node.children, targetId, nextTrail);
    if (childPath) return childPath;
  }
  return null;
}

function expandToNode(nodeId: string) {
  const path = findPath(treeData.value, nodeId);
  if (!path) return;
  path.slice(0, -1).forEach((node) => {
    expandedNodes.add(node.node_id);
    node.expanded = true;
  });
}

async function loadTree() {
  if (!campaignId.value) return;
  loading.value = true;
  feedback.message = '';
  try {
    const data = await CampaignProductsService.getTree(campaignId.value);
    hydrateCampaignSummary(data);
    const rawNodes = Array.isArray(data?.nodes) ? data.nodes : [];
    treeData.value = normaliseTree(rawNodes);
    if (!treeData.value.length) {
      activeNodeId.value = null;
      resetPackageForm();
      panelLoading.value = false;
    } else {
      const current = activeNodeId.value ? findNode(treeData.value, activeNodeId.value) : null;
      if (!current) {
        const fallback = findFirstPackage(treeData.value) ?? treeData.value[0] ?? null;
        activeNodeId.value = fallback?.node_id ?? null;
      }
      if (activeNodeId.value) {
        expandToNode(activeNodeId.value);
        treeData.value = normaliseTree(rawNodes);
      }
    }
    const templates = await CampaignProductsService.listTemplates(campaignId.value);
    templateOptions.value = Array.isArray(templates) ? templates : [];
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.load'), 'error');
  } finally {
    loading.value = false;
  }
}

function normaliseTree(nodes: CampaignProductNode[]): TreeViewNode[] {
  return nodes.map((node) => ({
    ...node,
    expanded: expandedNodes.has(node.node_id),
    children: normaliseTree(node.children || [])
  }));
}

function toggleNode(nodeId: string) {
  const node = findNode(treeData.value, nodeId);
  if (!node) return;
  node.expanded = !node.expanded;
  if (node.expanded) expandedNodes.add(nodeId);
  else expandedNodes.delete(nodeId);
}

function selectNode(nodeId: string) {
  activeNodeId.value = nodeId;
  expandToNode(nodeId);
}

function mapProductDetail(node: TreeViewNode) {
  productForm.node_id = node.node_id;
  productForm.name = node.name;
  const detail = node.product_detail;
  productForm.external_keys = (detail?.external_keys || []).join(', ');
  productForm.keywords = (detail?.keywords || []).join(', ');
  productForm.category = detail?.category || '';
  productForm.remark = detail?.remark || '';
}

function mapPackageDetail(node: TreeViewNode, detail: CampaignPackageDetail) {
  const shareRules = normaliseShareRules(detail.share_rules);
  return {
    node_id: detail.package_id,
    name: node.name,
    status: node.status as 'active' | 'archived',
    price: detail.price,
    description: detail.description || '',
    commission_default: detail.commission_default ?? { type: 'fixed', value: 0 },
    caps: {
      min: detail.caps?.min ?? null,
      max: detail.caps?.max ?? null,
      allow_override: detail.caps?.allow_override ?? false,
      approval_required: detail.caps?.approval_required ?? false
    },
    share_rules: shareRules,
    metrics: {
      promoter_count: detail.metrics?.promoter_count,
      matched_orders: detail.metrics?.matched_orders
    }
  };
}

function hydrateCampaignSummary(data: CampaignProductsTreeResponse) {
  campaignSummary.name = data.campaign_name || `#${data.campaign_id}`;
  campaignSummary.period = formatPeriod(data.start_time, data.end_time);
  campaignSummary.status = translateStatus(data.status);
  campaignSummary.matchingMode = translateMatchingMode(data.matching_mode);
  campaignSummary.updatedAt = formatDateTime(data.updated_at);
}

async function savePackage() {
  if (!selectedPackage.value) return;
  saving.value = true;
  try {
    const payload = {
      name: packageForm.name.trim(),
      price: Number(packageForm.price) || 0,
      description: packageForm.description?.trim() || null,
      commission_default: packageForm.commission_default,
      caps: {
        min: packageForm.caps.min,
        max: packageForm.caps.max,
        allow_override: packageForm.caps.allow_override,
        approval_required: packageForm.caps.approval_required
      },
      share_rules: formatShareRules(packageForm.share_rules),
      status: packageForm.status
    };
    const updated = await CampaignProductsService.updateNode(campaignId.value, selectedPackage.value.node_id, payload);
    applyNodeUpdate(updated);
    setFeedback(t('campaignProducts.success.save'), 'info');
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.save'), 'error');
  } finally {
    saving.value = false;
  }
}

async function saveProduct() {
  if (!selectedProduct.value) return;
  if (!productForm.name.trim()) {
    setFeedback(t('campaignProducts.errors.nameRequired'), 'error');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: productForm.name.trim(),
      product_detail: {
        external_keys: splitInput(productForm.external_keys),
        keywords: splitInput(productForm.keywords),
        category: productForm.category.trim() || undefined,
        remark: productForm.remark.trim() || undefined
      }
    };
    const updated = await CampaignProductsService.updateNode(campaignId.value, selectedProduct.value.node_id, payload);
    applyNodeUpdate(updated);
    const refreshed = findNode(treeData.value, updated.node_id);
    if (refreshed) mapProductDetail(refreshed);
    setFeedback(t('campaignProducts.success.saveProduct'), 'info');
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.save'), 'error');
  } finally {
    saving.value = false;
  }
}

function applyNodeUpdate(updated: CampaignProductNode) {
  const node = findNode(treeData.value, updated.node_id);
  if (!node) return;
  node.name = updated.name;
  node.status = updated.status;
  node.product_detail = updated.product_detail ?? node.product_detail;
  node.package_detail = updated.package_detail;
}

function openCreateProduct() {
  createProductForm.name = '';
  createProductForm.external_keys = '';
  createProductForm.keywords = '';
  createProductForm.category = '';
  createProductForm.remark = '';
  modals.createProduct = true;
}

function closeCreateProduct() {
  modals.createProduct = false;
}

async function submitCreateProduct() {
  if (!campaignId.value || !createProductForm.name.trim()) {
    setFeedback(t('campaignProducts.errors.nameRequired'), 'error');
    return;
  }
  saving.value = true;
  try {
    const productDetail = {
      external_keys: splitInput(createProductForm.external_keys),
      keywords: splitInput(createProductForm.keywords),
      category: createProductForm.category.trim() || undefined,
      remark: createProductForm.remark.trim() || undefined
    };
    await CampaignProductsService.createNode(campaignId.value, {
      type: 'product',
      name: createProductForm.name.trim(),
      parent_id: null,
      product_detail: productDetail
    });
    modals.createProduct = false;
    setFeedback(t('campaignProducts.success.createProduct'), 'info');
    await loadTree();
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.save'), 'error');
  } finally {
    saving.value = false;
  }
}

function openCreatePackage() {
  if (!selectedProduct.value) {
    setFeedback(t('campaignProducts.errors.selectProductFirst'), 'error');
    return;
  }
  createPackageForm.name = '';
  createPackageForm.price = 0;
  createPackageForm.commission_default = { type: 'fixed', value: 0 };
  createPackageForm.share_rules = {
    promoter: 0.7,
    leader: 0.2,
    city_head: 0.1
  };
  modals.createPackage = true;
}

function closeCreatePackage() {
  modals.createPackage = false;
}

async function submitCreatePackage() {
  if (!campaignId.value || !selectedProduct.value) return;
  if (!createPackageForm.name.trim()) {
    setFeedback(t('campaignProducts.errors.nameRequired'), 'error');
    return;
  }
  saving.value = true;
  try {
    await CampaignProductsService.createNode(campaignId.value, {
      type: 'package',
      name: createPackageForm.name.trim(),
      parent_id: selectedProduct.value.node_id,
      price: Number(createPackageForm.price) || 0,
      commission_default: createPackageForm.commission_default,
      share_rules: formatShareRules(createPackageForm.share_rules)
    });
    modals.createPackage = false;
    setFeedback(t('campaignProducts.success.createPackage'), 'info');
    await loadTree();
    activeNodeId.value = selectedProduct.value.node_id;
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.save'), 'error');
  } finally {
    saving.value = false;
  }
}

function openCopyModal() {
  copyForm.template_id = templateOptions.value[0]?.template_id ?? '';
  copyForm.overwrite = false;
  modals.copy = true;
}

function closeCopyModal() {
  modals.copy = false;
}

async function submitCopyTemplate() {
  if (!campaignId.value || !copyForm.template_id) {
    setFeedback(t('campaignProducts.errors.selectTemplate'), 'error');
    return;
  }
  saving.value = true;
  try {
    await CampaignProductsService.copyFromTemplate(campaignId.value, {
      template_id: copyForm.template_id,
      overwrite: copyForm.overwrite
    });
    modals.copy = false;
    setFeedback(t('campaignProducts.success.copy'), 'info');
    await loadTree();
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.copy'), 'error');
  } finally {
    saving.value = false;
  }
}

function openImportModal() {
  importForm.upload_token = '';
  importForm.notify_email = '';
  importForm.dry_run = false;
  modals.import = true;
}

function closeImportModal() {
  modals.import = false;
}

async function submitImport() {
  if (!campaignId.value || !importForm.upload_token.trim()) {
    setFeedback(t('campaignProducts.errors.tokenRequired'), 'error');
    return;
  }
  saving.value = true;
  try {
    const task = await CampaignProductsService.importPackages(campaignId.value, {
      upload_token: importForm.upload_token.trim(),
      notify_email: importForm.notify_email.trim() || undefined,
      dry_run: importForm.dry_run
    });
    importTask.value = task;
    modals.import = false;
    modals.importTask = true;
    pollImportTask();
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.import'), 'error');
  } finally {
    saving.value = false;
  }
}

async function pollImportTask() {
  if (!campaignId.value || !importTask.value) return;
  if (importPoll) clearTimeout(importPoll);
  try {
    const next = await CampaignProductsService.getImportTask(campaignId.value, importTask.value.task_id);
    importTask.value = next;
    if (next.status === 'processing' || next.status === 'queued') {
      importPoll = setTimeout(pollImportTask, 1500);
    } else if (next.status === 'succeeded') {
      await loadTree();
    }
  } catch (error) {
    setFeedback((error as Error).message || t('campaignProducts.errors.import'), 'error');
  }
}

function exportPackages() {
  setFeedback(t('campaignProducts.stub.export'), 'info');
}

function splitInput(value: string) {
  const list = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

function normaliseShareRules(rules?: Record<string, number> | null) {
  const base: Record<(typeof shareRuleRoles)[number], number> = {
    promoter: 0,
    leader: 0,
    city_head: 0
  };
  shareRuleRoles.forEach((role) => {
    if (rules && typeof rules[role] === 'number') {
      base[role] = Number(rules[role]);
    }
  });
  return base;
}

function formatShareRules(rules: Record<(typeof shareRuleRoles)[number], number>) {
  const payload: Record<string, number> = {};
  shareRuleRoles.forEach((role) => {
    const value = Number(rules[role] ?? 0);
    if (Number.isFinite(value) && value >= 0) {
      payload[role] = parseFloat(value.toFixed(4));
    }
  });
  return payload;
}

function translateStatus(status?: string | null) {
  if (!status) return '';
  const map: Record<string, string> = {
    draft: t('campaignProducts.info.statusDraft'),
    active: t('campaignProducts.info.statusActive'),
    running: t('campaignProducts.info.statusRunning'),
    archived: t('campaignProducts.info.statusArchived')
  };
  return map[status] || status;
}

function translateMatchingMode(mode?: string | null) {
  if (!mode) return '';
  const map: Record<string, string> = {
    template: t('campaignProducts.info.matchingTemplate'),
    auto_id: t('campaignProducts.info.matchingAutoId'),
    manual_form: t('campaignProducts.info.matchingManual')
  };
  return map[mode] || mode;
}

function formatPeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return '';
  const startText = start ? formatDateTime(start, { dateOnly: true }) : '—';
  const endText = end ? formatDateTime(end, { dateOnly: true }) : '—';
  return `${startText} ~ ${endText}`;
}

function formatDateTime(value?: string | null, options: { dateOnly?: boolean } = {}) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (options.dateOnly) {
    return date.toLocaleDateString();
  }
  return date.toLocaleString();
}

function importStatusLabel(status?: string) {
  if (!status) return t('campaignProducts.import.statusUnknown');
  const map: Record<string, string> = {
    queued: t('campaignProducts.import.queued'),
    processing: t('campaignProducts.import.processing'),
    succeeded: t('campaignProducts.import.succeeded'),
    failed: t('campaignProducts.import.failed')
  };
  return map[status] || status;
}

function packageStatusLabel(status: 'active' | 'archived') {
  return status === 'archived' ? t('campaignProducts.package.statusArchived') : t('campaignProducts.package.statusActive');
}

function setFeedback(message: string, variant: 'info' | 'error') {
  feedback.message = message;
  feedback.variant = variant;
  if (message) {
    setTimeout(() => {
      if (feedback.message === message) feedback.message = '';
    }, variant === 'info' ? 3000 : 5000);
  }
}

watch(
  () => modals.importTask,
  (visible) => {
    if (!visible && importPoll) {
      clearTimeout(importPoll);
      importPoll = null;
    }
  }
);

onBeforeUnmount(() => {
  if (importPoll) {
    clearTimeout(importPoll);
    importPoll = null;
  }
});
</script>
<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use 'sass:math';

.campaign-products {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
}

.campaign-products__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.campaign-products__title {
  margin: 0;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
}

.campaign-products__subtitle {
  margin: math.div($spacing-8, 2) 0 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.campaign-products__actions {
  display: flex;
  gap: $spacing-12;
}

.campaign-products__info {
  background: $color-surface-0;
  border-radius: $radius-16;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-16 $spacing-20;

  dl {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: $spacing-12;
  }

  dt {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  dd {
    margin: $spacing-4 0 0;
    font-size: $text-14-regular-fs;
    color: $text-strong;
  }
}

.campaign-products__feedback {
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-12;
  background: rgba($color-primary-100, 0.7);
  color: $color-primary-800;
  font-size: $text-12-regular-fs;
}

.campaign-products__feedback[data-variant='error'] {
  background: rgba($color-danger-300, 0.2);
  color: $color-danger-700;
}

.campaign-products__layout {
  display: grid;
  grid-template-columns: minmax(18rem, 22rem) 1fr;
  gap: $spacing-24;
}

.products-tree {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  background: $color-surface-0;
  border-radius: $radius-16;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-20;
}

.products-tree__search input {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
}

.products-tree__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  max-height: 36rem;
  overflow: auto;
}

.tree-node {
  --depth: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.tree-node__row {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  padding-left: calc(var(--depth) * $spacing-12);
}

.tree-node__toggle {
  width: $spacing-16;
  height: $spacing-16;
  border: none;
  background: transparent;
  color: $text-muted;
  cursor: pointer;
}

.tree-node__toggle:disabled {
  cursor: default;
  opacity: 0.3;
}

.tree-node__label {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  background: transparent;
  text-align: left;
  padding: $spacing-8;
  border-radius: $radius-8;
  cursor: pointer;
}

.tree-node__label:hover {
  background: $color-surface-100;
}

.tree-node[data-active='true'] .tree-node__label {
  background: $color-primary-100;
  color: $color-primary-700;
}

.tree-node__name {
  font-weight: $font-weight-medium;
}

.tree-node__meta {
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.products-panel {
  background: $color-surface-0;
  border-radius: $radius-16;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-24;
  min-height: 28rem;
  display: flex;
  flex-direction: column;
}

.products-panel__loading {
  margin: auto;
  color: $text-muted;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
}

.product-form__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;

  p {
    margin: $spacing-4 0 0;
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.product-form__status {
  padding: calc(#{$spacing-8} / 2) $spacing-12;
  border-radius: $radius-12;
  font-size: $text-12-regular-fs;
  background: $color-surface-100;
  color: $text-muted;
}

.product-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: $spacing-16;

  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  input,
  textarea {
    border: $border-width-1 solid $color-surface-200;
    border-radius: $radius-8;
    padding: $spacing-8 $spacing-12;
    font: inherit;
  }
}

.product-form__textarea {
  grid-column: 1 / -1;
}

.product-form__footer {
  display: flex;
  align-items: center;
  gap: $spacing-12;
}

.product-form__spacer {
  flex: 1;
}

.package-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
}

.package-form__head {
  display: flex;
  justify-content: space-between;
  gap: $spacing-12;
}

.package-form__head h2 {
  margin: 0;
  font-size: $text-16-semibold-fs;
}

.package-form__head p {
  margin: math.div($spacing-8, 2) 0 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.package-form__status {
  align-self: flex-start;
  padding: math.div($spacing-8, 2) $spacing-12;
  border-radius: $radius-8;
  font-size: $text-12-regular-fs;
  background: $color-primary-50;
  color: $color-primary-700;
}

.package-form__status[data-status='archived'] {
  background: rgba($color-surface-200, 0.4);
  color: $text-muted;
}

.package-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: $spacing-16;
}

.package-form__grid label,
.package-form__textarea {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.package-form__grid input,
.package-form__grid select,
.package-form__grid textarea {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
}

.package-form__input {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
}

.package-form__section {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  border-top: $border-width-1 solid $color-surface-200;
  padding-top: $spacing-16;
}

.package-form__section header h3 {
  margin: 0;
  font-size: $text-16-semibold-fs;
}

.package-form__section header p {
  margin: math.div($spacing-8, 2) 0 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.package-form__stats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: $spacing-16;

  li {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 4);
    font-size: $text-12-regular-fs;
    color: $text-muted;

    strong {
      font-size: $text-16-semibold-fs;
      line-height: $text-16-semibold-lh;
      font-weight: $text-16-semibold-wt;
      color: $text-strong;
    }
  }
}

.caps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
}

.caps-grid label {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.caps-grid__checkbox {
  flex-direction: row;
  align-items: center;
}

.caps-grid input {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
}

.share-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
}

.share-grid__item {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.share-grid__input {
  display: flex;
  align-items: center;
  gap: $spacing-8;

  input {
    flex: 1;
    border: $border-width-1 solid $color-surface-200;
    border-radius: $radius-8;
    padding: $spacing-8 $spacing-12;
    font: inherit;
  }

  span {
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.package-form__footer {
  display: flex;
  justify-content: flex-end;
}

.product-empty,
.product-placeholder {
  margin: auto;
  text-align: center;
  color: $text-muted;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.product-empty h2 {
  margin: 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.modal-form input,
.modal-form select,
.modal-form textarea {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
}

.modal-form__textarea {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.modal-form__share {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: $spacing-12;

  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.import-task {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.import-task__errors {
  margin: 0;
  padding-left: $spacing-20;
}

@media (max-width: 80rem) {
  .campaign-products__layout {
    grid-template-columns: 1fr;
  }
}
</style>
