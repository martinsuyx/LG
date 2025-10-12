<template>
  <section class="org-teams">
    <header class="org-teams__header">
      <div>
        <h1 class="org-teams__title">团队与人员</h1>
        <p class="org-teams__subtitle">
          按组织树维护团队结构，支持批量邀请、导入与跨团队转移，保障权限边界。
        </p>
      </div>
      <div class="org-teams__header-actions">
        <Button variant="ghost" size="sm" @click="exportTeams" :disabled="actionLoading || treeLoading">导出团队</Button>
      </div>
    </header>

    <div class="org-teams__content">
      <aside class="org-teams__sidebar">
        <form class="tree-search" @submit.prevent="reloadTree">
          <input
            class="tree-search__input"
            type="search"
            v-model.trim="treeKeyword"
            :disabled="treeLoading"
            placeholder="搜索团队 / 负责人"
          />
          <Button variant="secondary" size="sm" type="submit" :loading="treeLoading">搜索</Button>
        </form>
        <div class="tree-container" :aria-busy="treeLoading ? 'true' : 'false'">
          <p v-if="treeLoading" class="tree-placeholder">加载中…</p>
          <p v-else-if="!visibleTreeNodes.length" class="tree-placeholder">暂无团队</p>
          <ul v-else class="tree-list">
            <li
              v-for="item in visibleTreeNodes"
              :key="item.node.team_id"
              class="tree-row"
              :data-active="item.node.team_id === activeTeamId"
              :data-drop="dropTargetId === item.node.team_id"
              :style="{ '--depth': item.depth }"
              draggable="false"
            >
              <div
                class="tree-row__inner"
                draggable="true"
                @dragstart="onDragStart(item.node)"
                @dragend="onDragEnd"
                @dragover.prevent="onDragOver(item.node)"
                @drop.prevent="onDrop(item.node)"
              >
                <button
                  v-if="item.node.has_children"
                  class="tree-row__toggle"
                  type="button"
                  :aria-label="item.node.expanded ? '收起' : '展开'"
                  @click="toggleNode(item.node)"
                >
                  <span v-if="item.node.loading">…</span>
                  <span v-else>{{ item.node.expanded ? '▾' : '▸' }}</span>
                </button>
                <span v-else class="tree-row__spacer" />
                <button
                  type="button"
                  class="tree-row__label"
                  @click="selectNode(item.node)"
                >
                  <span class="tree-row__name">{{ item.node.name }}</span>
                  <span class="tree-row__meta">{{ item.node.members_count }} 人</span>
                </button>
              </div>
            </li>
          </ul>
        </div>
        <p v-if="treeError" class="tree-error">{{ treeError }}</p>
      </aside>

      <section class="org-teams__main">
        <article v-if="activeTeamDetail" class="team-summary">
          <header class="team-summary__head">
            <div>
              <h2>{{ activeTeamDetail.name }}</h2>
              <p class="team-summary__meta">
                <span>负责人：{{ activeTeamDetail.lead_user_name || '—' }}</span>
                <span>成员：{{ activeTeamDetail.members_count }}</span>
                <span>门店：{{ activeTeamDetail.stores_count }}</span>
              </p>
            </div>
            <span class="team-summary__status" :data-status="activeTeamDetail.status">{{ teamStatusLabel(activeTeamDetail.status) }}</span>
          </header>
          <dl class="team-summary__grid">
            <div>
              <dt>绑定公司</dt>
              <dd>{{ (activeTeamDetail.company_bindings || []).join(' / ') || '—' }}</dd>
            </div>
            <div>
              <dt>标签</dt>
              <dd>
                <template v-if="activeTeamDetail.tags?.length">
                  <span v-for="tag in activeTeamDetail.tags" :key="tag" class="tag-chip">{{ tag }}</span>
                </template>
                <span v-else>—</span>
              </dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ formatDate(activeTeamDetail.created_at) }}</dd>
            </div>
            <div class="team-summary__desc">
              <dt>描述</dt>
              <dd>{{ activeTeamDetail.desc || '暂无描述' }}</dd>
            </div>
          </dl>
        </article>

        <div v-if="importTask" class="import-task">
          <div class="import-task__info">
            <strong>导入任务 {{ importTask.task_id }}</strong>
            <span :data-status="importTask.status">{{ importStatusLabel(importTask.status) }}</span>
          </div>
          <div class="import-task__progress">
            <progress
              :value="Math.min(importTask.processed, importTask.total)"
              :max="importTask.total || 1"
            />
            <span>{{ importTask.processed }} / {{ importTask.total }}</span>
          </div>
          <ul v-if="importTask.error_rows?.length" class="import-task__errors">
            <li v-for="row in importTask.error_rows" :key="`${row.row}-${row.message}`">
              第 {{ row.row }} 行：{{ row.message }}
            </li>
          </ul>
        </div>

        <section class="members">
          <header class="members__head">
            <div class="members__actions">
              <Button size="sm" variant="secondary" :disabled="!activeTeamId || actionLoading" @click="openInviteModal">批量邀请</Button>
              <Button size="sm" variant="secondary" :disabled="!activeTeamId || actionLoading" @click="openImportModal">批量导入</Button>
              <Button size="sm" variant="secondary" :disabled="!canBatchOperate" @click="openMoveModal">批量转移</Button>
              <Button size="sm" variant="secondary" :disabled="!activeTeamId || actionLoading" @click="openGrantModal">授予权限</Button>
              <Button size="sm" variant="ghost" :disabled="membersLoading || !activeTeamId" @click="exportMembers">导出成员</Button>
            </div>
            <form class="members__filters" @submit.prevent="applyMemberFilters">
              <label>
                <span>角色</span>
                <select v-model="memberFilters.role" :disabled="membersLoading">
                  <option value="">全部</option>
                  <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label>
                <span>状态</span>
                <select v-model="memberFilters.status" :disabled="membersLoading">
                  <option value="">全部</option>
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label class="members__keyword">
                <span>关键词</span>
                <input
                  type="search"
                  v-model.trim="memberFilters.keyword"
                  :disabled="membersLoading"
                  placeholder="姓名 / 电话"
                />
              </label>
              <Button size="sm" type="submit" :loading="membersLoading">应用筛选</Button>
              <Button size="sm" variant="ghost" type="button" @click="resetMemberFilters" :disabled="membersLoading">重置</Button>
            </form>
          </header>

          <div class="members__table">
            <table>
              <thead>
                <tr>
                  <th class="col-select">
                    <input ref="pageSelectRef" type="checkbox" :checked="isPageFullySelected" @change="toggleSelectAll" />
                  </th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>联系方式</th>
                  <th>加入时间</th>
                  <th>所在路径</th>
                  <th>标签</th>
                </tr>
              </thead>
              <tbody v-if="membersLoading">
                <tr v-for="index in 5" :key="`loading-${index}`">
                  <td colspan="8" class="table-skeleton"></td>
                </tr>
              </tbody>
              <tbody v-else-if="members.length">
                <tr v-for="member in members" :key="member.user_id">
                  <td>
                    <input
                      type="checkbox"
                      :value="member.user_id"
                      :checked="isSelected(member.user_id)"
                      @change="toggleMember(member.user_id)"
                    />
                  </td>
                  <td>
                    <div class="member-name">
                      <strong>{{ member.name }}</strong>
                      <span v-if="member.email" class="member-email">{{ member.email }}</span>
                    </div>
                  </td>
                  <td><span class="chip" :data-role="member.role">{{ roleLabel(member.role) }}</span></td>
                  <td><span class="status-tag" :data-status="member.status">{{ statusLabel(member.status) }}</span></td>
                  <td>
                    <div class="member-contact">
                      <span>{{ member.phone || '—' }}</span>
                      <span v-if="member.frozen_reason" class="member-hint">原因：{{ member.frozen_reason }}</span>
                    </div>
                  </td>
                  <td>{{ formatDate(member.joined_at) }}</td>
                  <td>{{ (member.team_path || []).join(' / ') || '—' }}</td>
                  <td>
                    <template v-if="member.tags?.length">
                      <span class="tag-chip" v-for="tag in member.tags" :key="`${member.user_id}-${tag}`">{{ tag }}</span>
                    </template>
                    <span v-else>—</span>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="8" class="table-empty">暂无成员</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Pagination
            v-if="membersPageCount > 1"
            :page="memberFilters.page"
            :pages="membersPageCount"
            :page-size="memberFilters.page_size"
            @update:page="changePage"
            @update:pageSize="changePageSize"
          />
        </section>

        <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
      </section>
    </div>

    <Modal v-model="inviteModalVisible" @confirm="submitInvite">
      <template #title>批量邀请成员</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>目标团队</span>
          <select v-model="inviteForm.target_team_id">
            <option v-for="option in teamOptions" :key="option.team_id" :value="option.team_id">
              {{ option.name }}
            </option>
          </select>
        </label>
        <label>
          <span>邀请配额</span>
          <input type="number" min="1" v-model.number="inviteForm.quota" />
        </label>
        <label>
          <span>有效期</span>
          <input type="datetime-local" v-model="inviteForm.expires_at" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="inviteModalVisible = false">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitInvite">生成邀请</Button>
      </template>
    </Modal>

    <Modal v-model="importModalVisible" @confirm="submitImport">
      <template #title>批量导入成员</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>目标团队</span>
          <select v-model="importForm.target_team_id">
            <option v-for="option in teamOptions" :key="option.team_id" :value="option.team_id">
              {{ option.name }}
            </option>
          </select>
        </label>
        <label>
          <span>上传凭证</span>
          <input type="text" v-model.trim="importForm.upload_token" placeholder="粘贴上传后的 token" />
        </label>
        <label>
          <span>通知邮箱（可选）</span>
          <input type="email" v-model.trim="importForm.notify_email" placeholder="ops@example.com" />
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="importForm.dry_run" />
          <span>仅校验，不落库</span>
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="importModalVisible = false">取消</Button>
        <Button variant="primary" :loading="actionLoading || importPolling" @click="submitImport">提交导入</Button>
      </template>
    </Modal>

    <Modal v-model="moveModalVisible" @confirm="submitBatchMove">
      <template #title>批量转移成员</template>
      <p class="modal-tip">已选择 {{ selectedMemberIds.length }} 人，转移后将继承目标团队权限。</p>
      <label class="modal-form">
        <span>目标团队</span>
        <select v-model="moveForm.target_team_id">
          <option value="">选择团队</option>
          <option v-for="option in teamOptions" :key="option.team_id" :value="option.team_id" :disabled="option.team_id === activeTeamId">
            {{ option.name }}
          </option>
        </select>
      </label>
      <template #footer>
        <Button variant="secondary" @click="moveModalVisible = false">取消</Button>
        <Button variant="primary" :disabled="!moveForm.target_team_id" :loading="actionLoading" @click="submitBatchMove">确认转移</Button>
      </template>
    </Modal>

    <Modal v-model="grantModalVisible" @confirm="submitGrant">
      <template #title>授予团队权限</template>
      <form class="modal-form" @submit.prevent>
        <fieldset class="checkbox-group">
          <legend>可见角色</legend>
          <label v-for="option in grantRoleOptions" :key="option.value" class="checkbox">
            <input
              type="checkbox"
              :value="option.value"
              :checked="grantForm.roles.includes(option.value)"
              @change="toggleGrantRole(option.value, $event)"
            />
            <span>{{ option.label }}</span>
          </label>
        </fieldset>
        <label>
          <span>截止时间（可选）</span>
          <input type="datetime-local" v-model="grantForm.expires_at" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="grantModalVisible = false">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitGrant">保存</Button>
      </template>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import Pagination from '@/components/Pagination.vue';
import {
  TeamsService,
  type InviteCreateResponse,
  type MemberImportTask,
  type MemberRole,
  type MemberStatus,
  type TeamDetail,
  type TeamMember,
  type TeamMoveResponse,
  type TeamNode
} from '@/sdk/teams';

const treeData = ref<TeamTreeNode[]>([]);
const treeKeyword = ref('');
const treeLoading = ref(false);
const treeError = ref('');

const activeTeamId = ref<string | null>(null);
const teamDetails = reactive<Record<string, TeamDetail>>({});

const members = ref<TeamMemberView[]>([]);
const membersTotal = ref(0);
const membersLoading = ref(false);

const memberFilters = reactive({
  status: '' as MemberStatus | '',
  role: '' as MemberRole | '',
  keyword: '',
  sort_key: 'joined_at' as 'joined_at' | 'name' | 'role' | 'status',
  sort_order: 'desc' as 'asc' | 'desc',
  page: 1,
  page_size: 20
});

const selectedMemberIds = ref<string[]>([]);

const inviteModalVisible = ref(false);
const importModalVisible = ref(false);
const moveModalVisible = ref(false);
const grantModalVisible = ref(false);

const inviteForm = reactive({
  target_team_id: '',
  quota: 20,
  expires_at: defaultExpireAt()
});

const importForm = reactive({
  target_team_id: '',
  upload_token: '',
  notify_email: '',
  dry_run: false
});

const moveForm = reactive({
  target_team_id: ''
});

const grantForm = reactive({
  roles: [] as string[],
  expires_at: ''
});

const importTask = ref<MemberImportTask | null>(null);
const importPolling = ref(false);
let importTimer: ReturnType<typeof setTimeout> | null = null;

const actionLoading = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');

const draggingNodeId = ref<string | null>(null);
const dropTargetId = ref<string | null>(null);

let teamOptionsLoader: Promise<void> | null = null;

onMounted(() => {
  loadRootTeams();
});

onBeforeUnmount(() => {
  if (importTimer) clearTimeout(importTimer);
});

type TeamTreeNode = TeamNode & {
  children?: TeamTreeNode[];
  expanded?: boolean;
  loaded?: boolean;
  loading?: boolean;
  loadingPromise?: Promise<void> | null;
};

function createTreeNode(item: TeamNode): TeamTreeNode {
  return {
    ...item,
    expanded: false,
    loaded: !item.has_children,
    loading: false,
    loadingPromise: null,
    children: item.has_children ? [] : undefined
  };
}

interface TeamMemberView {
  user_id: string;
  name: string;
  phone?: string;
  email?: string | null;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  left_at?: string | null;
  team_path?: string[];
  tags?: string[];
  metrics?: Record<string, unknown>;
  frozen_reason?: string | null;
}

const roleOptions: Array<{ value: MemberRole; label: string }> = [
  { value: 'lead', label: '负责人' },
  { value: 'staff', label: '运营人员' },
  { value: 'promoter', label: '推广员' },
  { value: 'store_owner', label: '门店负责人' },
  { value: 'viewer', label: '访客' }
];

const statusOptions: Array<{ value: MemberStatus; label: string }> = [
  { value: 'active', label: '在岗' },
  { value: 'frozen', label: '冻结' },
  { value: 'left', label: '已离职' }
];

const grantRoleOptions = [
  { value: 'team_lead', label: '团队负责人' },
  { value: 'org_admin', label: '组织管理员' },
  { value: 'auditor', label: '审核员' }
];

const visibleTreeNodes = computed(() => flattenTree(treeData.value));

const activeTeamDetail = computed<TeamDetail | null>(() => {
  if (!activeTeamId.value) return null;
  return teamDetails[activeTeamId.value] || buildDetailFromTree(findNode(activeTeamId.value)?.node);
});

const teamOptions = computed(() => {
  const seen = new Set<string>();
  const options: TeamTreeNode[] = [];
  collectTree(treeData.value).forEach((node) => {
    if (seen.has(node.team_id)) return;
    seen.add(node.team_id);
    options.push(node);
  });
  return options;
});

const membersPageCount = computed(() => Math.max(1, Math.ceil(membersTotal.value / memberFilters.page_size)));

const pageMemberIds = computed(() => members.value.map((member) => member.user_id));
const isPageFullySelected = computed(() => pageMemberIds.value.length > 0 && pageMemberIds.value.every((id) => selectedMemberIds.value.includes(id)));
const hasPartialSelection = computed(() => {
  if (!pageMemberIds.value.length) return false;
  const matched = pageMemberIds.value.filter((id) => selectedMemberIds.value.includes(id)).length;
  return matched > 0 && matched < pageMemberIds.value.length;
});

const canBatchOperate = computed(() => selectedMemberIds.value.length > 0 && !actionLoading.value);

const pageSelectRef = ref<HTMLInputElement | null>(null);

watch(
  [isPageFullySelected, hasPartialSelection],
  () => {
    if (pageSelectRef.value) {
      pageSelectRef.value.indeterminate = hasPartialSelection.value && !isPageFullySelected.value;
    }
  },
  { immediate: true }
);

async function loadRootTeams() {
  treeLoading.value = true;
  treeError.value = '';
  try {
    const data = await TeamsService.listTeams(treeKeyword.value ? { keyword: treeKeyword.value } : undefined);
    treeData.value = data.teams.map((node) => createTreeNode(node));
    if (!activeTeamId.value && treeData.value.length) {
      selectNode(treeData.value[0]);
    } else if (activeTeamId.value) {
      // If previously selected team no longer exists, reset.
      const exists = findNode(activeTeamId.value);
      if (!exists) {
        activeTeamId.value = treeData.value[0]?.team_id ?? null;
      }
    }
    void ensureTeamOptionsLoaded(true);
  } catch (err) {
    treeError.value = (err as Error).message || '加载团队失败';
  } finally {
    treeLoading.value = false;
  }
}

function reloadTree() {
  loadRootTeams();
}

function toggleNode(node: TeamTreeNode) {
  if (!node.has_children) return;
  if (!node.loaded) {
    void loadChildren(node, true);
    return;
  }
  node.expanded = !node.expanded;
}

async function loadChildren(node: TeamTreeNode, expand = true, silent = false): Promise<void> {
  if (node.loaded) {
    if (expand) node.expanded = true;
    return;
  }
  if (node.loadingPromise) {
    await node.loadingPromise;
    if (expand && node.loaded) node.expanded = true;
    return;
  }
  const runner = (async () => {
    node.loading = true;
    try {
      const data = await TeamsService.getTeamChildren(node.team_id);
      node.children = data.teams.map((item) => createTreeNode(item));
      node.has_children = node.children.length > 0;
      node.loaded = true;
    } catch (err) {
      if (!silent) showError((err as Error).message || '加载子团队失败');
    } finally {
      node.loading = false;
      node.loadingPromise = null;
    }
  })();
  node.loadingPromise = runner;
  await runner;
  if (node.loaded) {
    if (node.has_children) {
      if (expand) node.expanded = true;
    } else {
      node.expanded = false;
    }
  }
}

function ensureTeamOptionsLoaded(force = false): Promise<void> {
  if (!treeData.value.length) return Promise.resolve();
  if (!force && teamOptionsLoader) return teamOptionsLoader;
  const queue = [...treeData.value];
  const loadAll = (async () => {
    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      if (!current.has_children) continue;
      await loadChildren(current, false, true);
      if (current.children?.length) {
        queue.push(...current.children);
      }
    }
  })();
  teamOptionsLoader = loadAll;
  loadAll
    .catch(() => {
      // errors already surfaced inside loadChildren when silent=false
    })
    .finally(() => {
      if (teamOptionsLoader === loadAll) {
        teamOptionsLoader = null;
      }
    });
  return loadAll;
}

function selectNode(node: TeamTreeNode | null) {
  if (!node) return;
  activeTeamId.value = node.team_id;
  selectedMemberIds.value = [];
  if (node.has_children) {
    void loadChildren(node, true);
  }
  loadTeamDetail(node.team_id);
  resetMemberFilters();
  loadMembers();
}

async function loadTeamDetail(teamId: string) {
  try {
    const detail = await TeamsService.getTeamDetail(teamId);
    teamDetails[teamId] = detail;
  } catch (err) {
    // fallback to tree data
    const fallback = buildDetailFromTree(findNode(teamId)?.node);
    if (fallback) {
      teamDetails[teamId] = fallback;
    } else {
      showError((err as Error).message || '获取团队详情失败');
    }
  }
}

async function loadMembers() {
  if (!activeTeamId.value) return;
  membersLoading.value = true;
  try {
    const data = await TeamsService.getTeamMembers(activeTeamId.value, { ...memberFilters });
    members.value = data.items.map(mapMember);
    membersTotal.value = data.total;
    selectedMemberIds.value = selectedMemberIds.value.filter((id) => members.value.some((member) => member.user_id === id));
    clearFeedback();
  } catch (err) {
    showError((err as Error).message || '加载成员失败');
  } finally {
    membersLoading.value = false;
  }
}

function applyMemberFilters() {
  memberFilters.page = 1;
  loadMembers();
}

function resetMemberFilters() {
  memberFilters.status = '';
  memberFilters.role = '';
  memberFilters.keyword = '';
  memberFilters.page = 1;
  memberFilters.page_size = 20;
  memberFilters.sort_key = 'joined_at';
  memberFilters.sort_order = 'desc';
}

function changePage(page: number) {
  memberFilters.page = page;
  loadMembers();
}

function changePageSize(size: number) {
  memberFilters.page_size = size;
  memberFilters.page = 1;
  loadMembers();
}

function toggleMember(id: string) {
  if (selectedMemberIds.value.includes(id)) {
    selectedMemberIds.value = selectedMemberIds.value.filter((memberId) => memberId !== id);
  } else {
    selectedMemberIds.value = [...selectedMemberIds.value, id];
  }
}

function toggleSelectAll(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
    selectedMemberIds.value = Array.from(new Set([...selectedMemberIds.value, ...pageMemberIds.value]));
  } else {
    selectedMemberIds.value = selectedMemberIds.value.filter((id) => !pageMemberIds.value.includes(id));
  }
}

function isSelected(id: string) {
  return selectedMemberIds.value.includes(id);
}

function openInviteModal() {
  if (!activeTeamId.value) return;
  inviteForm.target_team_id = activeTeamId.value;
  inviteForm.quota = 20;
  inviteForm.expires_at = defaultExpireAt();
  void ensureTeamOptionsLoaded();
  inviteModalVisible.value = true;
}

async function submitInvite() {
  if (!inviteForm.target_team_id) return;
  actionLoading.value = true;
  try {
    const payload = {
      target_team_id: inviteForm.target_team_id,
      quota: inviteForm.quota,
      expires_at: inviteForm.expires_at
    };
    const result: InviteCreateResponse = await TeamsService.createInvite(payload);
    showFeedback(`邀请链接已生成：${result.invite_code}`);
    inviteModalVisible.value = false;
  } catch (err) {
    showError((err as Error).message || '创建邀请失败');
  } finally {
    actionLoading.value = false;
  }
}

function openImportModal() {
  if (!activeTeamId.value) return;
  importForm.target_team_id = activeTeamId.value;
  importForm.upload_token = '';
  importForm.notify_email = '';
  importForm.dry_run = false;
  void ensureTeamOptionsLoaded();
  importModalVisible.value = true;
}

async function submitImport() {
  if (!importForm.target_team_id || !importForm.upload_token) {
    showError('请填写上传凭证');
    return;
  }
  actionLoading.value = true;
  try {
    const result = await TeamsService.importMembers({ ...importForm });
    importTask.value = result;
    showFeedback('导入任务已提交，开始校验…');
    importModalVisible.value = false;
    startImportPolling(result.task_id);
  } catch (err) {
    showError((err as Error).message || '提交导入失败');
  } finally {
    actionLoading.value = false;
  }
}

function startImportPolling(taskId: string) {
  if (importTimer) clearTimeout(importTimer);
  importPolling.value = true;
  const poll = async () => {
    try {
      const result = await TeamsService.getImportTask(taskId);
      importTask.value = result;
      if (result.status === 'succeeded' || result.status === 'failed') {
        importPolling.value = false;
        importTimer = null;
        if (result.status === 'succeeded') {
          showFeedback('导入完成');
          loadMembers();
        } else {
          showError('导入失败，请查看错误列表');
        }
        return;
      }
    } catch (err) {
      showError((err as Error).message || '查询导入状态失败');
      importPolling.value = false;
      importTimer = null;
      return;
    }
    importTimer = setTimeout(poll, 2000);
  };
  importTimer = setTimeout(poll, 1800);
}

function openMoveModal() {
  if (!selectedMemberIds.value.length) {
    showError('请选择需要转移的成员');
    return;
  }
  moveForm.target_team_id = '';
  void ensureTeamOptionsLoaded();
  moveModalVisible.value = true;
}

async function submitBatchMove() {
  if (!moveForm.target_team_id) return;
  actionLoading.value = true;
  try {
    const payload = {
      user_ids: selectedMemberIds.value,
      target_team_id: moveForm.target_team_id
    };
    await TeamsService.batchMoveMembers(payload);
    showFeedback(`已转移 ${selectedMemberIds.value.length} 人`);
    selectedMemberIds.value = [];
    moveModalVisible.value = false;
    loadMembers();
  } catch (err) {
    showError((err as Error).message || '批量转移失败');
  } finally {
    actionLoading.value = false;
  }
}

function openGrantModal() {
  if (!activeTeamId.value) return;
  grantForm.roles = ['team_lead'];
  grantForm.expires_at = '';
  grantModalVisible.value = true;
}

async function submitGrant() {
  if (!activeTeamId.value) return;
  actionLoading.value = true;
  try {
    await TeamsService.grantTeamRoles(activeTeamId.value, {
      roles: grantForm.roles,
      expires_at: grantForm.expires_at || undefined
    });
    showFeedback('权限已更新');
    grantModalVisible.value = false;
  } catch (err) {
    showError((err as Error).message || '更新权限失败');
  } finally {
    actionLoading.value = false;
  }
}

async function exportMembers() {
  if (!activeTeamId.value) return;
  actionLoading.value = true;
  try {
    const payload = {
      team_id: activeTeamId.value,
      status: memberFilters.status || undefined,
      role: memberFilters.role || undefined,
      keyword: memberFilters.keyword || undefined
    };
    const result = await TeamsService.exportMembers(payload);
    showFeedback(`导出任务已创建：${result.export_id}`);
  } catch (err) {
    showError((err as Error).message || '导出失败');
  } finally {
    actionLoading.value = false;
  }
}

async function exportTeams() {
  actionLoading.value = true;
  try {
    const result = await TeamsService.exportTeams(treeKeyword.value ? { keyword: treeKeyword.value } : undefined);
    showFeedback(`团队导出任务：${result.export_id}`);
  } catch (err) {
    showError((err as Error).message || '导出团队失败');
  } finally {
    actionLoading.value = false;
  }
}

function toggleGrantRole(role: string, event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.checked) {
    if (!grantForm.roles.includes(role)) grantForm.roles.push(role);
  } else {
    grantForm.roles = grantForm.roles.filter((value) => value !== role);
  }
}

function onDragStart(node: TeamTreeNode) {
  draggingNodeId.value = node.team_id;
  dropTargetId.value = null;
}

function onDragEnd() {
  draggingNodeId.value = null;
  dropTargetId.value = null;
}

function onDragOver(node: TeamTreeNode) {
  if (!draggingNodeId.value || draggingNodeId.value === node.team_id) return;
  dropTargetId.value = node.team_id;
}

async function onDrop(target: TeamTreeNode) {
  if (!draggingNodeId.value) return;
  const moving = findNode(draggingNodeId.value);
  if (!moving || moving.node.team_id === target.team_id) {
    onDragEnd();
    return;
  }
  const revert = applyMoveOptimistic(moving, target);
  actionLoading.value = true;
  try {
    const response: TeamMoveResponse = await TeamsService.moveTeam(moving.node.team_id, {
      target_team_id: target.team_id
    });
    showFeedback(`已移动至 ${target.name}`);
    moving.node.parent_id = response.new_parent_id;
  } catch (err) {
    revert();
    showError((err as Error).message || '团队移动失败');
  } finally {
    actionLoading.value = false;
    onDragEnd();
  }
}

function applyMoveOptimistic(source: { node: TeamTreeNode; parent: TeamTreeNode | null; list: TeamTreeNode[]; index: number }, target: TeamTreeNode) {
  const { node, parent, list, index } = source;
  const previousParentId = node.parent_id;
  const parentSnapshot = parent
    ? {
        hasChildren: parent.has_children,
        expanded: parent.expanded,
        children: parent.children ? [...parent.children] : undefined
      }
    : null;
  const targetSnapshot = {
    hasChildren: target.has_children,
    expanded: target.expanded,
    loaded: target.loaded ?? false,
    children: target.children ? [...target.children] : undefined
  };

  list.splice(index, 1);
  if (parent) {
    parent.has_children = list.length > 0;
    if (!parent.has_children) {
      parent.expanded = false;
    }
    parent.children = list.length ? list : undefined;
  }

  const nextChildren = targetSnapshot.children ? [...targetSnapshot.children, node] : [node];
  target.children = nextChildren;
  target.has_children = true;
  target.expanded = true;
  target.loaded = true;
  node.parent_id = target.team_id;
  return () => {
    node.parent_id = previousParentId;
    list.splice(index, 0, node);
    if (parent) {
      if (parentSnapshot) {
        parent.has_children = parentSnapshot.hasChildren;
        parent.expanded = parentSnapshot.expanded;
        parent.children = parentSnapshot.children ? [...parentSnapshot.children] : undefined;
      }
    }
    target.has_children = targetSnapshot.hasChildren;
    target.expanded = targetSnapshot.expanded;
    target.loaded = targetSnapshot.loaded;
    target.children = targetSnapshot.children ? [...targetSnapshot.children] : undefined;
  };
}

function findNode(id: string, nodes: TeamTreeNode[] = treeData.value, parent: TeamTreeNode | null = null): { node: TeamTreeNode; parent: TeamTreeNode | null; list: TeamTreeNode[]; index: number } | null {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.team_id === id) {
      return { node, parent, list: nodes, index: i };
    }
    if (node.children?.length) {
      const hit = findNode(id, node.children, node);
      if (hit) return hit;
    }
  }
  return null;
}

function flattenTree(nodes: TeamTreeNode[], depth = 0, acc: Array<{ node: TeamTreeNode; depth: number }> = []) {
  nodes.forEach((node) => {
    acc.push({ node, depth });
    if (node.expanded && node.children?.length) {
      flattenTree(node.children, depth + 1, acc);
    }
  });
  return acc;
}

function collectTree(nodes: TeamTreeNode[], acc: TeamTreeNode[] = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) {
      collectTree(node.children, acc);
    }
  });
  return acc;
}

function mapMember(member: TeamMember): TeamMemberView {
  return {
    user_id: member.user_id,
    name: member.name,
    phone: member.phone,
    email: member.email ?? null,
    role: member.role,
    status: member.status,
    joined_at: member.joined_at,
    left_at: member.left_at ?? null,
    team_path: member.team_path,
    tags: member.tags,
    metrics: member.metrics,
    frozen_reason: member.frozen_reason ?? null
  };
}

function buildDetailFromTree(node?: TeamTreeNode): TeamDetail | null {
  if (!node) return null;
  return {
    ...node,
    status: 'active',
    stores_count: 0,
    created_at: null
  };
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function defaultExpireAt() {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  const iso = expires.toISOString();
  return iso.slice(0, 16);
}

function roleLabel(role: MemberRole) {
  const map: Record<MemberRole, string> = {
    lead: '负责人',
    staff: '运营人员',
    promoter: '推广员',
    store_owner: '门店负责人',
    viewer: '访客'
  };
  return map[role] ?? role;
}

function statusLabel(status: MemberStatus) {
  const map: Record<MemberStatus, string> = {
    active: '在岗',
    frozen: '冻结',
    left: '已离职'
  };
  return map[status] ?? status;
}

function teamStatusLabel(status: 'active' | 'archived') {
  return status === 'archived' ? '已归档' : '活跃';
}

function importStatusLabel(status: MemberImportTask['status']) {
  switch (status) {
    case 'queued':
      return '排队中';
    case 'processing':
      return '处理中';
    case 'succeeded':
      return '已完成';
    case 'failed':
      return '失败';
    default:
      return status;
  }
}

function showFeedback(message: string) {
  feedbackMessage.value = message;
  errorMessage.value = '';
  window.setTimeout(() => {
    if (feedbackMessage.value === message) feedbackMessage.value = '';
  }, 4000);
}

function showError(message: string) {
  errorMessage.value = message;
  window.setTimeout(() => {
    if (errorMessage.value === message) errorMessage.value = '';
  }, 5000);
}

function clearFeedback() {
  feedbackMessage.value = '';
  errorMessage.value = '';
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$radius-lg: calc(#{$radius-8} * 1.5);
$radius-xl: calc(#{$radius-8} * 2);
$spacing-20: calc(#{$spacing-16} + #{$spacing-8});
$control-height: calc(#{$spacing-16} * 2.5);
$heading-size: calc(#{$font-size-16} * 1.5);

.org-teams {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  color: $color-text-strong;
}

.org-teams__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.org-teams__title {
  margin: 0 0 $spacing-8;
  font-size: $heading-size;
  font-weight: $font-weight-semibold;
}

.org-teams__subtitle {
  margin: 0;
  color: $color-surface-500;
  font-size: $font-size-12;
  line-height: $font-line-height-16;
}

.org-teams__content {
  display: grid;
  grid-template-columns: minmax(14rem, 18rem) 1fr;
  gap: $spacing-24;
}

.org-teams__sidebar {
  background: $color-surface-0;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-xl;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  box-shadow: 0 8px 24px rgba($color-surface-700, 0.05);
}

.tree-search {
  display: flex;
  gap: $spacing-8;
}

.tree-search__input {
  flex: 1;
  height: $control-height;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-lg;
  padding: 0 $spacing-12;
  font: inherit;
  color: $color-text-strong;
}

.tree-container {
  flex: 1;
  min-height: 12rem;
  overflow-y: auto;
  border-radius: $radius-lg;
  background: $color-surface-50;
}

.tree-placeholder {
  padding: $spacing-16;
  text-align: center;
  color: $color-surface-500;
  font-size: $font-size-12;
}

.tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tree-row {
  padding-left: calc(#{$spacing-12} + var(--depth) * #{$spacing-16});
  transition: background-color 0.2s ease;
}

.tree-row[data-active='true'] {
  background: rgba($color-primary-700, 0.12);
}

.tree-row[data-drop='true'] {
  background: rgba($color-primary-700, 0.18);
}

.tree-row__inner {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  padding: $spacing-8 $spacing-12;
  cursor: grab;
}

.tree-row__toggle,
.tree-row__label {
  background: transparent;
  border: none;
  cursor: pointer;
  color: $color-text-strong;
  font: inherit;
}

.tree-row__toggle {
  width: $spacing-16;
  color: $color-surface-500;
}

.tree-row__spacer {
  display: inline-block;
  width: $spacing-16;
}

.tree-row__label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-12;
  text-align: left;
}

.tree-row__name {
  font-weight: $font-weight-medium;
}

.tree-row__meta {
  color: $color-surface-500;
  font-size: $font-size-12;
}

.tree-error {
  color: rgba($color-surface-700, 0.8);
  font-size: $font-size-12;
}

.org-teams__main {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.team-summary {
  background: $color-surface-0;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  box-shadow: 0 10px 30px rgba($color-surface-700, 0.05);
}

.team-summary__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.team-summary__meta {
  display: flex;
  gap: $spacing-16;
  color: $color-surface-500;
  font-size: $font-size-12;
}

.team-summary__status {
  padding: calc(#{$spacing-8} / 2) $spacing-8;
  border-radius: $radius-lg;
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
}

.team-summary__grid {
  display: grid;
  gap: $spacing-12;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.team-summary__grid dt {
  color: $color-surface-500;
  font-size: $font-size-12;
}

.team-summary__grid dd {
  margin: 0;
  font-size: $font-size-16;
}

.team-summary__desc {
  grid-column: 1 / -1;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
  font-size: $font-size-12;
  margin-right: $spacing-8;
}

.import-task {
  border: $border-width-1 dashed rgba($color-primary-700, 0.35);
  border-radius: $radius-lg;
  padding: $spacing-16;
  background: $color-surface-0;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.import-task__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-task__info span {
  padding: calc(#{$spacing-8} / 2) $spacing-8;
  border-radius: $radius-lg;
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
  font-size: $font-size-12;
}

.import-task__progress {
  display: flex;
  align-items: center;
  gap: $spacing-12;
}

.import-task__progress progress {
  flex: 1;
  height: $spacing-8;
}

.import-task__errors {
  margin: 0;
  padding-left: $spacing-16;
  color: rgba($color-surface-700, 0.85);
  font-size: $font-size-12;
}

.members {
  background: $color-surface-0;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  box-shadow: 0 12px 40px rgba($color-surface-700, 0.04);
}

.members__head {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.members__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-8;
}

.members__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, max-content));
  gap: $spacing-12;
  align-items: flex-end;
}

.members__filters label {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $font-size-12;
  color: $color-surface-500;
}

.members__filters select,
.members__filters input {
  height: $control-height;
  border-radius: $radius-lg;
  border: $border-width-1 solid $color-surface-200;
  padding: 0 $spacing-12;
  color: $color-text-strong;
  font: inherit;
}

.members__keyword {
  min-width: 16rem;
}

.members__table table {
  width: 100%;
  border-collapse: collapse;
}

.members__table th,
.members__table td {
  padding: $spacing-12;
  border-bottom: $border-width-1 solid rgba($color-surface-200, 0.6);
  text-align: left;
  vertical-align: top;
}

.members__table thead {
  background: $color-surface-50;
}

.members__table .col-select {
  width: 2.5rem;
}

.table-skeleton {
  height: $spacing-16;
  border-radius: $radius-lg;
  background: linear-gradient(
    90deg,
    $color-surface-100 0%,
    $color-surface-200 50%,
    $color-surface-100 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}

.table-empty {
  text-align: center;
  color: $color-surface-500;
}

.member-name {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-weight: $font-weight-medium;
}

.member-email {
  font-size: $font-size-12;
  color: $color-surface-500;
}

.member-contact {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $font-size-12;
}

.member-hint {
  color: rgba($color-surface-700, 0.75);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $color-surface-100;
  color: $color-text-strong;
  font-size: $font-size-12;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
}

.status-tag[data-status='active'] {
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
}

.status-tag[data-status='frozen'] {
  background: rgba($color-surface-500, 0.18);
  color: $color-surface-500;
}

.status-tag[data-status='left'] {
  background: rgba($color-surface-200, 0.6);
  color: $color-surface-700;
}

.feedback {
  font-size: $font-size-12;
  color: $color-primary-700;
}

.feedback--error {
  color: rgba($color-surface-700, 0.85);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.modal-form label {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $font-size-12;
  color: $color-surface-500;
}

.modal-form input,
.modal-form select {
  height: $control-height;
  border-radius: $radius-lg;
  border: $border-width-1 solid $color-surface-200;
  padding: 0 $spacing-12;
  font: inherit;
  color: $color-text-strong;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  font-size: $font-size-12;
  color: $color-text-strong;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  border: $border-width-1 dashed $color-surface-200;
  border-radius: $radius-lg;
  padding: $spacing-12;
}

.modal-tip {
  color: $color-surface-500;
  font-size: $font-size-12;
  margin-bottom: $spacing-12;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 64rem) {
  .org-teams__content {
    grid-template-columns: 1fr;
  }
}
</style>
