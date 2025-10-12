<template>
  <section class="users-roles">
    <header class="users-roles__header">
      <div>
        <h1 class="users-roles__title">用户与角色</h1>
        <p class="users-roles__subtitle">
          管理系统账号、角色与权限，保障分级管控与合规。
        </p>
      </div>
      <div class="users-roles__actions">
        <Button size="sm" variant="ghost" :disabled="usersLoading || rolesLoading" @click="exportRoles">导出角色</Button>
        <Button size="sm" variant="ghost" :disabled="usersLoading" @click="exportUsers">导出用户</Button>
      </div>
    </header>

    <div class="users-roles__layout">
      <aside class="panel users-panel">
        <header class="panel__head">
          <div>
            <h2>用户列表</h2>
            <p>共 {{ usersTotal }} 人</p>
          </div>
          <Button size="sm" variant="primary" @click="openCreateModal">新建用户</Button>
        </header>
        <form class="filter-form" @submit.prevent="applyUserFilters">
          <label>
            <span>关键词</span>
            <input
              v-model.trim="userFilters.keyword"
              type="search"
              placeholder="姓名 / 手机 / 邮箱"
              :disabled="usersLoading"
            />
          </label>
          <label>
            <span>状态</span>
            <select v-model="userFilters.status" :disabled="usersLoading">
              <option value="">全部</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label>
            <span>角色</span>
            <select v-model="userFilters.role_id" :disabled="usersLoading">
              <option value="">全部</option>
              <option v-for="role in roleSelectOptions" :key="role.role_id" :value="role.role_id">
                {{ role.name }}
              </option>
            </select>
          </label>
          <div class="filter-form__actions">
            <Button size="sm" type="submit" :loading="usersLoading">应用</Button>
            <Button size="sm" variant="ghost" type="button" @click="resetUserFilters" :disabled="usersLoading">重置</Button>
          </div>
        </form>

        <Table
          :columns="userColumns"
          :rows="userTableRows"
          :loading="usersLoading"
          :row-key="(row) => row.user_id"
          default-sort-key="last_login_at"
          default-sort-order="desc"
          @rowClick="selectUser"
          @sortChange="handleUserSort"
        >
          <template #cell:name="{ row }">
            <div class="user-cell">
              <strong>{{ row.name }}</strong>
              <span class="user-id">{{ row.user_id }}</span>
            </div>
          </template>
          <template #cell:status="{ row }">
            <span class="status-chip" :data-status="row.status">{{ statusLabel(row.status) }}</span>
          </template>
          <template #cell:roles="{ row }">
            <span v-if="row.role_names.length" class="role-badge" v-for="roleName in row.role_names" :key="`${row.user_id}-${roleName}`">
              {{ roleName }}
            </span>
            <span v-else>—</span>
          </template>
          <template #cell:last_login_at="{ row }">
            {{ formatDate(row.last_login_at) }}
          </template>
          <template #empty>
            {{ usersLoading ? '加载中…' : '暂无用户' }}
          </template>
          <template #pagination>
            <Pagination
              v-if="userPageCount > 1"
              :page="userFilters.page"
              :pages="userPageCount"
              :page-size="userFilters.page_size"
              @update:page="changeUserPage"
              @update:pageSize="changeUserPageSize"
            />
          </template>
        </Table>
      </aside>

      <aside class="panel roles-panel">
        <header class="panel__head">
          <div>
            <h2>角色列表</h2>
            <p>共 {{ roles.length }} 个</p>
          </div>
        </header>
        <label class="role-search">
          <span>搜索角色</span>
          <input
            v-model.trim="roleKeyword"
            type="search"
            placeholder="角色名"
            :disabled="rolesLoading"
          />
        </label>
        <Table
          :columns="roleColumns"
          :rows="filteredRoleRows"
          :loading="rolesLoading"
          :row-key="(row) => row.role_id"
          @rowClick="selectRole"
        >
          <template #cell:name="{ row }">
            <div class="role-cell">
              <strong>{{ row.name }}</strong>
              <span class="role-meta">{{ row.desc || '—' }}</span>
            </div>
          </template>
          <template #cell:status="{ row }">
            <span class="status-chip" :data-status="row.status === 'active' ? 'active' : 'archived'">
              {{ row.status === 'active' ? '启用' : '已归档' }}
            </span>
          </template>
          <template #empty>
            {{ rolesLoading ? '加载中…' : '暂无角色' }}
          </template>
        </Table>
      </aside>

      <section class="panel detail-panel">
        <article class="detail-card" v-if="activeUser">
          <header class="detail-card__head">
            <div>
              <h3>{{ activeUser.name }}</h3>
              <p>{{ activeUser.email || '—' }}</p>
            </div>
            <span class="status-chip" :data-status="activeUser.status">{{ statusLabel(activeUser.status) }}</span>
          </header>
          <dl class="detail-grid">
            <div>
              <dt>手机号</dt>
              <dd>{{ activeUser.phone || '—' }}</dd>
            </div>
            <div>
              <dt>最近登录</dt>
              <dd>{{ formatDate(activeUser.last_login_at) }}</dd>
            </div>
            <div>
              <dt>所属团队</dt>
              <dd>
                <template v-if="activeUser.teams?.length">
                  <span v-for="team in activeUser.teams" :key="team" class="tag-chip">{{ team }}</span>
                </template>
                <span v-else>—</span>
              </dd>
            </div>
            <div>
              <dt>分配角色</dt>
              <dd>
                <template v-if="activeUserRoleNames.length">
                  <span v-for="roleName in activeUserRoleNames" :key="roleName" class="tag-chip tag-chip--primary">{{ roleName }}</span>
                </template>
                <span v-else>—</span>
              </dd>
            </div>
          </dl>
          <div class="detail-card__actions">
            <Button size="sm" variant="secondary" @click="openAssignModal" :disabled="actionLoading">分配角色</Button>
            <Button size="sm" variant="secondary" @click="resetPassword" :disabled="actionLoading">重置密码</Button>
            <Button
              size="sm"
              variant="danger"
              :disabled="activeUser.status === 'deleted' || actionLoading"
              @click="toggleFreeze"
            >
              {{ activeUser.status === 'frozen' ? '解除冻结' : '冻结用户' }}
            </Button>
          </div>
          <section v-if="activeUser.recent_actions?.length" class="detail-card__section">
            <h4>最近操作</h4>
            <ul class="timeline">
              <li v-for="item in activeUser.recent_actions" :key="item.ts">
                <span class="timeline__time">{{ formatDate(item.ts) }}</span>
                <span class="timeline__text">{{ item.action }}</span>
              </li>
            </ul>
          </section>
        </article>
        <article v-else class="detail-empty">
          请选择左侧用户查看详情
        </article>

        <article class="detail-card" v-if="activeRoleDetail">
          <header class="detail-card__head">
            <div>
              <h3>{{ activeRoleDetail.name }}</h3>
              <p>{{ activeRoleDetail.desc || '—' }}</p>
            </div>
            <span class="status-chip" :data-status="activeRoleDetail.status === 'active' ? 'active' : 'archived'">
              {{ activeRoleDetail.status === 'active' ? '启用' : '已归档' }}
            </span>
          </header>
          <dl class="detail-grid">
            <div>
              <dt>绑定用户</dt>
              <dd>{{ activeRoleDetail.bound_users ?? 0 }} 人</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ formatDate(activeRoleDetail.created_at) }}</dd>
            </div>
            <div>
              <dt>最近更新</dt>
              <dd>{{ formatDate(activeRoleDetail.updated_at) }}</dd>
            </div>
          </dl>
          <section class="detail-card__section">
            <h4>权限树</h4>
            <div class="permission-tree" :aria-busy="permissionLoading ? 'true' : 'false'">
              <p v-if="permissionLoading" class="permission-placeholder">加载权限树…</p>
              <PermissionTree v-else :nodes="permissionView" />
            </div>
          </section>
        </article>
        <article v-else class="detail-empty">
          请选择角色查看权限
        </article>
        <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
      </section>
    </div>

    <Modal v-model="createModalVisible" @confirm="submitCreateUser">
      <template #title>新建用户</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>姓名</span>
          <input v-model.trim="createForm.name" type="text" placeholder="请输入姓名" required />
        </label>
        <label>
          <span>手机号</span>
          <input v-model.trim="createForm.phone" type="tel" placeholder="13800000000" />
        </label>
        <label>
          <span>邮箱</span>
          <input v-model.trim="createForm.email" type="email" placeholder="name@example.com" />
        </label>
        <fieldset class="checkbox-group">
          <legend>分配角色</legend>
          <label v-for="role in roleSelectOptions" :key="`create-${role.role_id}`" class="checkbox">
            <input type="checkbox" :value="role.role_id" :checked="createForm.role_ids.includes(role.role_id)" @change="toggleCreateRole(role.role_id, $event)" />
            <span>{{ role.name }}</span>
          </label>
        </fieldset>
      </form>
      <template #footer>
        <Button variant="secondary" @click="createModalVisible = false" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitCreateUser">创建</Button>
      </template>
    </Modal>

    <Modal v-model="assignModalVisible" @confirm="submitAssignRoles">
      <template #title>分配角色</template>
      <form class="modal-form" @submit.prevent>
        <fieldset class="checkbox-group">
          <legend>可用角色</legend>
          <label v-for="role in roleSelectOptions" :key="`assign-${role.role_id}`" class="checkbox">
            <input type="checkbox" :value="role.role_id" :checked="assignForm.role_ids.includes(role.role_id)" @change="toggleAssignRole(role.role_id, $event)" />
            <span>{{ role.name }}</span>
          </label>
        </fieldset>
      </form>
      <template #footer>
        <Button variant="secondary" @click="assignModalVisible = false" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitAssignRoles">保存</Button>
      </template>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';
import type { PropType } from 'vue';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import Table from '@/components/Table.vue';
import Pagination from '@/components/Pagination.vue';
import {
  PermissionsService,
  RolesService,
  UsersService,
  type PermissionNode,
  type PermissionTreeResponse,
  type RoleDetail,
  type RoleListItem,
  type RoleListResponse,
  type UserDetail,
  type UserListItem,
  type UserListResponse,
  type UserStatus
} from '@/sdk/users';

interface PermissionViewNode extends PermissionNode {
  checked: boolean;
  indeterminate: boolean;
  children?: PermissionViewNode[];
}

type TableColumn = {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  hidden?: boolean;
};

const users = ref<UserListItem[]>([]);
const usersTotal = ref(0);
const usersLoading = ref(false);
const fallbackUsers: UserListItem[] = [
  {
    user_id: 'U1001',
    name: '张三',
    phone: '13800000001',
    email: 'zhangsan@example.com',
    role_ids: ['R01', 'R02'],
    status: 'active',
    last_login_at: '2025-09-28T12:00:00+08:00',
    teams: ['华南大区', '广州一区']
  },
  {
    user_id: 'U1002',
    name: '李四',
    phone: '13800000002',
    email: 'lisi@example.com',
    role_ids: ['R03'],
    status: 'frozen',
    last_login_at: '2025-09-25T09:15:00+08:00',
    teams: ['华东大区']
  }
];

const userFilters = reactive({
  keyword: '',
  status: '' as UserStatus | '',
  role_id: '',
  page: 1,
  page_size: 10,
  sort_key: 'last_login_at' as 'last_login_at' | 'name',
  sort_order: 'desc' as 'asc' | 'desc'
});

const roles = ref<RoleListItem[]>([]);
const rolesLoading = ref(false);
const roleKeyword = ref('');
const fallbackRoles: RoleListItem[] = [
  {
    role_id: 'R01',
    name: '组织管理员',
    desc: '可管理组织架构与用户权限',
    status: 'active',
    bound_users: 18,
    updated_at: '2025-09-20T09:30:00+08:00'
  },
  {
    role_id: 'R02',
    name: '审核员',
    desc: '负责订单与提现审核',
    status: 'active',
    bound_users: 32,
    updated_at: '2025-09-18T14:10:00+08:00'
  }
];

const permissionTree = ref<PermissionNode[]>([]);
const permissionLoading = ref(false);
const fallbackPermissionTree: PermissionNode[] = [
  {
    perm_id: 'menu:org',
    name: '组织与用户',
    type: 'menu',
    children: [
      { perm_id: 'menu:org:teams', name: '团队与人员', type: 'menu', children: [] },
      { perm_id: 'menu:org:users', name: '用户与角色', type: 'menu', children: [] },
      { perm_id: 'api:/api/v1/users', name: '用户管理接口', type: 'api', children: [] }
    ]
  },
  {
    perm_id: 'menu:orders',
    name: '订单与审核',
    type: 'menu',
    children: [
      { perm_id: 'menu:orders:list', name: '订单列表', type: 'menu', children: [] },
      { perm_id: 'api:/api/v1/orders/review', name: '订单审核接口', type: 'api', children: [] }
    ]
  }
];

const selectedUserId = ref<string | null>(null);
const userDetailCache = reactive<Record<string, UserDetail>>({});
const fallbackUserDetails: Record<string, UserDetail> = {
  U1001: {
    user_id: 'U1001',
    name: '张三',
    phone: '13800000001',
    email: 'zhangsan@example.com',
    role_ids: ['R01', 'R02'],
    status: 'active',
    last_login_at: '2025-09-28T12:00:00+08:00',
    teams: ['华南大区', '广州一区'],
    created_at: '2024-01-06T08:00:00+08:00',
    updated_at: '2025-09-25T11:10:00+08:00',
    recent_actions: [
      { ts: '2025-09-25T11:00:00+08:00', action: '登录后台' },
      { ts: '2025-09-24T16:22:00+08:00', action: '审批订单 ORD-223344' }
    ]
  },
  U1002: {
    user_id: 'U1002',
    name: '李四',
    phone: '13800000002',
    email: 'lisi@example.com',
    role_ids: ['R03'],
    status: 'frozen',
    last_login_at: '2025-09-25T09:15:00+08:00',
    teams: ['华东大区'],
    created_at: '2024-03-18T10:00:00+08:00',
    updated_at: '2025-08-19T10:30:00+08:00',
    recent_actions: [{ ts: '2025-08-01T18:22:00+08:00', action: '导出活动报表' }]
  }
};
const selectedRoleId = ref<string | null>(null);
const roleDetailCache = reactive<Record<string, RoleDetail>>({});
const fallbackRoleDetails: Record<string, RoleDetail> = {
  R01: {
    role_id: 'R01',
    name: '组织管理员',
    desc: '可管理组织架构与用户权限',
    status: 'active',
    bound_users: 18,
    created_at: '2024-01-01T09:00:00+08:00',
    updated_at: '2025-09-20T09:30:00+08:00',
    permissions: ['menu:org', 'menu:org:teams', 'menu:org:users', 'api:/api/v1/users']
  },
  R02: {
    role_id: 'R02',
    name: '审核员',
    desc: '负责订单与提现审核',
    status: 'active',
    bound_users: 32,
    created_at: '2024-02-10T09:00:00+08:00',
    updated_at: '2025-09-18T14:10:00+08:00',
    permissions: ['menu:orders', 'menu:orders:list', 'api:/api/v1/orders/review']
  }
};

const createModalVisible = ref(false);
const assignModalVisible = ref(false);
const actionLoading = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');

const createForm = reactive({
  name: '',
  phone: '',
  email: '',
  role_ids: [] as string[]
});

const assignForm = reactive({
  role_ids: [] as string[]
});

const statusOptions = [
  { value: 'active', label: '启用' },
  { value: 'frozen', label: '冻结' },
  { value: 'deleted', label: '已删除' }
];

const userColumns: TableColumn[] = [
  { key: 'name', title: '姓名' },
  { key: 'phone', title: '手机号' },
  { key: 'email', title: '邮箱' },
  { key: 'status', title: '状态' },
  { key: 'roles', title: '角色' },
  { key: 'last_login_at', title: '最近登录', sortable: true }
];

const roleColumns: TableColumn[] = [
  { key: 'name', title: '角色' },
  { key: 'status', title: '状态', width: '6rem' },
  { key: 'bound_users', title: '绑定用户', width: '7rem' }
];

const roleSelectOptions = computed(() => roles.value.filter((role) => role.status === 'active'));

const userPageCount = computed(() => Math.max(1, Math.ceil(usersTotal.value / userFilters.page_size)));

const userTableRows = computed(() =>
  users.value.map((item) => ({
    ...item,
    roles: item.role_ids,
    role_names: item.role_ids.map((id) => roles.value.find((role) => role.role_id === id)?.name || id)
  }))
);

const filteredRoleRows = computed(() => {
  if (!roleKeyword.value.trim()) return roles.value;
  const keyword = roleKeyword.value.trim().toLowerCase();
  return roles.value.filter((role) => role.name.toLowerCase().includes(keyword));
});

const activeUser = computed<UserDetail | null>(() => {
  if (!selectedUserId.value) return null;
  return userDetailCache[selectedUserId.value] || null;
});

const activeRoleDetail = computed<RoleDetail | null>(() => {
  if (!selectedRoleId.value) return null;
  return roleDetailCache[selectedRoleId.value] || null;
});

const activeUserRoleNames = computed(() => {
  if (!activeUser.value) return [];
  return activeUser.value.role_ids.map((id) => roles.value.find((role) => role.role_id === id)?.name || id);
});

const permissionView = computed<PermissionViewNode[]>(() => {
  const roleDetail = activeRoleDetail.value;
  if (!roleDetail) return [];
  const selected = new Set(roleDetail.permissions || []);
  return decoratePermissionTree(permissionTree.value, selected);
});

onMounted(() => {
  loadUsers();
  loadRoles();
  loadPermissionTree();
});

async function loadUsers() {
  usersLoading.value = true;
  try {
    const data = await UsersService.listUsers({ ...userFilters });
    const response = (data ?? {}) as Partial<UserListResponse>;
    const items = Array.isArray(response.items) ? (response.items as UserListItem[]) : [];
    if (items.length) {
      users.value = items;
      usersTotal.value = typeof response.total === 'number' ? response.total : items.length;
    } else {
      users.value = fallbackUsers;
      usersTotal.value = fallbackUsers.length;
    }
    if (!selectedUserId.value && users.value.length) {
      selectUser(users.value[0]);
    } else if (selectedUserId.value && !users.value.some((item) => item.user_id === selectedUserId.value)) {
      selectedUserId.value = users.value[0]?.user_id ?? null;
      if (selectedUserId.value) {
        await ensureUserDetail(selectedUserId.value);
      }
    }
  } catch (err) {
    showError((err as Error).message || '加载用户失败');
  } finally {
    usersLoading.value = false;
  }
}

async function loadRoles() {
  rolesLoading.value = true;
  try {
    const data = await RolesService.listRoles();
    const response = (data ?? {}) as Partial<RoleListResponse>;
    roles.value = Array.isArray(response?.items) && response.items && response.items.length
      ? (response.items as RoleListItem[])
      : fallbackRoles;
    if (!selectedRoleId.value && roles.value.length) {
      selectRole(roles.value[0]);
    }
  } catch (err) {
    showError((err as Error).message || '加载角色失败');
  } finally {
    rolesLoading.value = false;
  }
}

async function loadPermissionTree() {
  permissionLoading.value = true;
  try {
    const data = await PermissionsService.getPermissionTree();
    const response = (data ?? {}) as Partial<PermissionTreeResponse>;
    permissionTree.value = Array.isArray(response?.items) && response.items && response.items.length
      ? response.items
      : fallbackPermissionTree;
  } catch (err) {
    showError((err as Error).message || '加载权限树失败');
  } finally {
    permissionLoading.value = false;
  }
}

async function ensureUserDetail(userId: string) {
  if (userDetailCache[userId]) return;
  try {
    const detail = await UsersService.getUserDetail(userId);
    if (detail) {
      userDetailCache[userId] = detail;
    } else if (fallbackUserDetails[userId]) {
      userDetailCache[userId] = fallbackUserDetails[userId];
    }
  } catch (err) {
    if (fallbackUserDetails[userId]) {
      userDetailCache[userId] = fallbackUserDetails[userId];
    } else {
      showError((err as Error).message || '获取用户详情失败');
    }
  }
}

async function ensureRoleDetail(roleId: string) {
  if (roleDetailCache[roleId]) return;
  try {
    const detail = await RolesService.getRoleDetail(roleId);
    if (detail) {
      roleDetailCache[roleId] = detail;
    } else if (fallbackRoleDetails[roleId]) {
      roleDetailCache[roleId] = fallbackRoleDetails[roleId];
    }
  } catch (err) {
    if (fallbackRoleDetails[roleId]) {
      roleDetailCache[roleId] = fallbackRoleDetails[roleId];
    } else {
      showError((err as Error).message || '获取角色详情失败');
    }
  }
}

function applyUserFilters() {
  userFilters.page = 1;
  loadUsers();
}

function resetUserFilters() {
  userFilters.keyword = '';
  userFilters.status = '';
  userFilters.role_id = '';
  userFilters.page = 1;
  userFilters.page_size = 10;
  userFilters.sort_key = 'last_login_at';
  userFilters.sort_order = 'desc';
  loadUsers();
}

function handleUserSort(key: string, order: 'asc' | 'desc') {
  if (key === 'last_login_at' || key === 'name') {
    userFilters.sort_key = key;
    userFilters.sort_order = order;
    loadUsers();
  }
}

function changeUserPage(page: number) {
  userFilters.page = page;
  loadUsers();
}

function changeUserPageSize(size: number) {
  userFilters.page_size = size;
  userFilters.page = 1;
  loadUsers();
}

async function selectUser(row: UserListItem) {
  selectedUserId.value = row.user_id;
  await ensureUserDetail(row.user_id);
}

async function selectRole(row: RoleListItem) {
  selectedRoleId.value = row.role_id;
  await ensureRoleDetail(row.role_id);
}

function openCreateModal() {
  createForm.name = '';
  createForm.phone = '';
  createForm.email = '';
  createForm.role_ids = [];
  createModalVisible.value = true;
}

function toggleCreateRole(roleId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    if (!createForm.role_ids.includes(roleId)) createForm.role_ids.push(roleId);
  } else {
    createForm.role_ids = createForm.role_ids.filter((id) => id !== roleId);
  }
}

function openAssignModal() {
  if (!activeUser.value) return;
  assignForm.role_ids = [...activeUser.value.role_ids];
  assignModalVisible.value = true;
}

function toggleAssignRole(roleId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    if (!assignForm.role_ids.includes(roleId)) assignForm.role_ids.push(roleId);
  } else {
    assignForm.role_ids = assignForm.role_ids.filter((id) => id !== roleId);
  }
}

async function submitCreateUser() {
  if (!createForm.name.trim()) {
    showError('请填写姓名');
    return;
  }
  actionLoading.value = true;
  try {
    const payload = {
      name: createForm.name.trim(),
      phone: createForm.phone?.trim() || undefined,
      email: createForm.email?.trim() || undefined,
      role_ids: [...createForm.role_ids]
    };
    const result = await UsersService.createUser(payload);
    userDetailCache[result.user.user_id] = result.user;
    showFeedback(`已创建用户 ${result.user.name}${result.temporary_password ? `，临时密码：${result.temporary_password}` : ''}`);
    createModalVisible.value = false;
    selectedUserId.value = result.user.user_id;
    await loadUsers();
  } catch (err) {
    showError((err as Error).message || '创建用户失败');
  } finally {
    actionLoading.value = false;
  }
}

async function submitAssignRoles() {
  if (!activeUser.value) return;
  actionLoading.value = true;
  try {
    const nextRoleIds = [...assignForm.role_ids];
    await UsersService.assignRoles(activeUser.value.user_id, nextRoleIds);
    const detail = await UsersService.getUserDetail(activeUser.value.user_id);
    userDetailCache[activeUser.value.user_id] = detail;
    showFeedback('角色已更新');
    assignModalVisible.value = false;
    await loadUsers();
  } catch (err) {
    showError((err as Error).message || '分配角色失败');
  } finally {
    actionLoading.value = false;
  }
}

async function resetPassword() {
  if (!activeUser.value) return;
  actionLoading.value = true;
  try {
    const result = await UsersService.resetPassword(activeUser.value.user_id);
    showFeedback(`已重置密码：${result.temp_password}`);
  } catch (err) {
    showError((err as Error).message || '重置密码失败');
  } finally {
    actionLoading.value = false;
  }
}

async function toggleFreeze() {
  if (!activeUser.value) return;
  actionLoading.value = true;
  try {
    if (activeUser.value.status === 'frozen') {
      await UsersService.activateUser(activeUser.value.user_id);
      showFeedback('用户已解除冻结');
    } else {
      await UsersService.freezeUser(activeUser.value.user_id);
      showFeedback('用户已冻结');
    }
    const detail = await UsersService.getUserDetail(activeUser.value.user_id);
    userDetailCache[activeUser.value.user_id] = detail;
    await loadUsers();
  } catch (err) {
    showError((err as Error).message || '更新用户状态失败');
  } finally {
    actionLoading.value = false;
  }
}

async function exportUsers() {
  actionLoading.value = true;
  try {
    const result = await UsersService.exportUsers({ ...userFilters });
    showFeedback(`用户导出任务：${result.export_id}`);
  } catch (err) {
    showError((err as Error).message || '导出用户失败');
  } finally {
    actionLoading.value = false;
  }
}

async function exportRoles() {
  actionLoading.value = true;
  try {
    const result = await RolesService.exportRoles();
    showFeedback(`角色导出任务：${result.export_id}`);
  } catch (err) {
    showError((err as Error).message || '导出角色失败');
  } finally {
    actionLoading.value = false;
  }
}

function statusLabel(status: UserStatus) {
  switch (status) {
    case 'active':
      return '启用';
    case 'frozen':
      return '冻结';
    case 'deleted':
      return '已删除';
    default:
      return status;
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function decoratePermissionTree(nodes: PermissionNode[], selected: Set<string>): PermissionViewNode[] {
  return nodes.map((node) => {
    const children = decoratePermissionTree(node.children || [], selected);
    const childCheckedCount = children.filter((child) => child.checked).length;
    const childIndeterminate = children.some((child) => child.indeterminate);
    const selfChecked = selected.has(node.perm_id);
    const checked = selfChecked || childCheckedCount === children.length;
    const indeterminate =
      (!checked && (childCheckedCount > 0 || childIndeterminate)) ||
      (checked && (childIndeterminate || (children.length > 0 && childCheckedCount !== children.length)));
    return {
      ...node,
      checked,
      indeterminate,
      children
    };
  });
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

const PermissionTree = defineComponent({
  name: 'PermissionTree',
  props: {
    nodes: {
      type: Array as PropType<PermissionViewNode[]>,
      default: () => []
    }
  },
  setup(props) {
    const renderNodes = (nodes: PermissionViewNode[]) =>
      nodes.map((node) => {
        const stateClass = node.checked ? 'is-checked' : node.indeterminate ? 'is-mixed' : 'is-unchecked';
        const children: ReturnType<typeof h>[] = [];
        children.push(
          h(
            'div',
            {
              class: 'perm-item',
              role: 'checkbox',
              'aria-checked': node.indeterminate ? 'mixed' : node.checked ? 'true' : 'false'
            },
            [
              h('span', { class: ['perm-indicator', stateClass] }),
              h('span', { class: 'perm-name' }, node.name),
              h('span', { class: 'perm-tag', 'data-type': node.type }, node.type === 'menu' ? '菜单' : '接口')
            ]
          )
        );
        if (node.children && node.children.length) {
          children.push(h('ul', { class: 'perm-list' }, renderNodes(node.children)));
        }
        return h('li', { key: node.perm_id }, children);
      });

    return () => h('ul', { class: 'perm-list' }, renderNodes(props.nodes));
  }
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$radius-card: $radius-xl;
$panel-padding: $spacing-20;

.users-roles {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  color: $text-strong;
}

.users-roles__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.users-roles__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.users-roles__subtitle {
  margin: 0;
  font-size: $text-12-regular-fs;
  line-height: $font-line-height-16;
  color: $text-muted;
}

.users-roles__actions {
  display: flex;
  gap: $spacing-12;
}

.users-roles__layout {
  display: grid;
  grid-template-columns: minmax(20rem, 24rem) minmax(16rem, 20rem) 1fr;
  gap: $spacing-24;
}

.panel {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-card;
  padding: $panel-padding;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.08);
}

.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-12;
  h2 {
    margin: 0;
    font-size: $text-16-semibold-fs;
    line-height: $text-16-semibold-lh;
    font-weight: $text-16-semibold-wt;
  }
  p {
    margin: 0;
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  align-items: flex-end;
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
  input,
  select {
    height: $control-height;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: 0 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.filter-form__actions {
  display: flex;
  gap: $spacing-12;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  .user-id {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  line-height: $text-12-medium-lh;
  font-weight: $text-12-medium-wt;
}

.status-chip[data-status='active'] {
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
}

.status-chip[data-status='frozen'] {
  background: rgba($color-surface-500, 0.16);
  color: $color-surface-500;
}

.status-chip[data-status='deleted'],
.status-chip[data-status='archived'] {
  background: rgba($color-surface-200, 0.6);
  color: $color-surface-700;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $surface-100;
  color: $text-strong;
  font-size: $text-12-regular-fs;
  margin-right: $spacing-8;
}

.roles-panel .role-search {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $text-12-regular-fs;
  color: $text-muted;
  input {
    height: $control-height;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: 0 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.role-cell {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  .role-meta {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.detail-panel {
  position: relative;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  padding: $spacing-16;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  background: $surface-50;
}

.detail-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-12;
  h3 {
    margin: 0;
    font-size: $text-16-semibold-fs;
    line-height: $text-16-semibold-lh;
    font-weight: $text-16-semibold-wt;
  }
  p {
    margin: 0;
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  dt {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
  dd {
    margin: 0;
    font-size: $text-14-regular-fs;
    color: $text-strong;
  }
}

.detail-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-12;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $surface-100;
  color: $text-strong;
  font-size: $text-12-regular-fs;
  margin-right: $spacing-8;
  margin-bottom: calc(#{$spacing-8} / 2);
}

.tag-chip--primary {
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
}

.detail-card__section h4 {
  margin: 0 0 $spacing-8;
  font-size: $text-12-medium-fs;
  line-height: $text-12-medium-lh;
  font-weight: $text-12-medium-wt;
  color: $text-muted;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
}

.timeline__time {
  font-size: $text-12-regular-fs;
  color: $text-muted;
  margin-right: $spacing-8;
}

.timeline__text {
  font-size: $text-14-regular-fs;
}

.detail-empty {
  padding: $spacing-16;
  border: $border-width-1 dashed $surface-200;
  border-radius: $radius-lg;
  background: $surface-0;
  text-align: center;
  color: $text-muted;
}

.permission-tree {
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  background: $surface-0;
  padding: $spacing-16;
  max-height: 20rem;
  overflow: auto;
}

.permission-placeholder {
  text-align: center;
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.perm-list {
  list-style: none;
  margin: 0;
  padding-left: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
}

.perm-item {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
}

.perm-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: $radius-8;
  border: $border-width-1 solid $surface-200;
  background: $surface-0;
  position: relative;
}

.perm-indicator.is-checked {
  background: $color-primary-700;
  border-color: $color-primary-700;
}

.perm-indicator.is-checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.45rem;
  height: 0.25rem;
  border-left: $border-width-1 solid $surface-0;
  border-bottom: $border-width-1 solid $surface-0;
  transform: translate(-50%, -60%) rotate(-45deg);
}

.perm-indicator.is-mixed {
  background: $surface-200;
  border-color: $surface-200;
}

.perm-indicator.is-mixed::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.4rem;
  height: 0.12rem;
  background: $color-surface-700;
  transform: translate(-50%, -50%);
}

.perm-name {
  font-size: $text-14-regular-fs;
}

.perm-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: $text-12-regular-fs;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $surface-100;
  color: $text-muted;
}

.perm-tag[data-type='api'] {
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
}

.feedback {
  font-size: $text-12-regular-fs;
  color: $color-primary-700;
}

.feedback--error {
  color: $color-error;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
  input {
    height: $control-height;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: 0 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  border: $border-width-1 dashed $surface-200;
  border-radius: $radius-lg;
  padding: $spacing-12;
  legend {
    font-size: $text-12-medium-fs;
    line-height: $text-12-medium-lh;
    color: $text-muted;
  }
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
  color: $text-strong;
}

@media (max-width: 80rem) {
  .users-roles__layout {
    grid-template-columns: 1fr;
  }
}
</style>
