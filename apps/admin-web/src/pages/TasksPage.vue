<template>
  <section class="tasks">
    <header class="tasks__head">
      <div>
        <h1 class="tasks__title">任务管理</h1>
        <p class="tasks__subtitle">组合表单 DSL、审核规则与风控策略，驱动前线采集与后台审核。</p>
      </div>
      <div class="tasks__actions">
        <button type="button" class="btn btn--ghost" @click="handleExport" :disabled="loading || exporting">
          {{ exporting ? '导出中…' : '导出到导出中心' }}
        </button>
        <button type="button" class="btn" @click="openCreateDrawer" :disabled="loading">新建任务</button>
      </div>
    </header>

    <form class="tasks__filters" @submit.prevent="applyFilters">
      <div class="filters__row">
        <label class="filters__field">
          <span>状态</span>
          <select class="input" v-model="filters.status">
            <option value="">全部</option>
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="filters__field">
          <span>表单 DSL</span>
          <select class="input" v-model="filters.form_dsl_id">
            <option value="">全部</option>
            <option v-for="option in formDslOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__field">
          <span>风控模板</span>
          <select class="input" v-model="filters.risk_policy_id">
            <option value="">全部</option>
            <option v-for="option in riskPolicyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__field">
          <span>可见角色</span>
          <select class="input" v-model="filters.role">
            <option value="">全部</option>
            <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__field filters__field--keyword">
          <span>关键词</span>
          <input class="input" type="text" v-model.trim="filters.keyword" placeholder="名称 / 任务码" />
        </label>
        <label class="filters__field">
          <span>排序字段</span>
          <select class="input" v-model="filters.sort_key">
            <option value="start_time">开始时间</option>
            <option value="end_time">结束时间</option>
            <option value="name">名称</option>
            <option value="version">版本</option>
          </select>
        </label>
        <label class="filters__field">
          <span>排序方向</span>
          <select class="input" v-model="filters.sort_order">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </label>
      </div>
      <div class="filters__actions">
        <button type="submit" class="btn" :disabled="loading">应用筛选</button>
        <button type="button" class="btn btn--ghost" @click="resetFilters" :disabled="loading">重置</button>
      </div>
    </form>

    <div class="tasks__table">
      <table>
        <thead>
          <tr>
            <th>任务名称</th>
            <th>任务码</th>
            <th>状态</th>
            <th>版本</th>
            <th>表单 DSL</th>
            <th>风控模板</th>
            <th>有效期</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="index in 4" :key="`loading-${index}`">
            <td :colspan="8" class="table-skeleton"></td>
          </tr>
        </tbody>
        <tbody v-else-if="tasks.length">
          <tr v-for="item in tasks" :key="item.task_id">
            <td>
              <button type="button" class="link-btn" @click="openViewDrawer(item)">{{ item.name }}</button>
            </td>
            <td>{{ item.code }}</td>
            <td><span class="status-tag" :data-status="item.status">{{ statusLabel(item.status) }}</span></td>
            <td>{{ item.version }}</td>
            <td>{{ item.form_dsl_id }}</td>
            <td>{{ item.risk_policy_id || '-' }}</td>
            <td>{{ formatDateRange(item.start_time, item.end_time) }}</td>
            <td class="col-actions">
              <div class="row-actions">
                <button type="button" class="link-btn" @click="openEditDrawer(item)" :disabled="!canEditStatus(item.status)">编辑</button>
                <button type="button" class="link-btn" @click="publishTask(item)" :disabled="!canPublishStatus(item.status) || actionLoading">发布</button>
                <button type="button" class="link-btn" @click="prepareOffline(item)" :disabled="item.status !== 'published' || actionLoading">下架</button>
                <button type="button" class="link-btn" @click="cloneTask(item)" :disabled="actionLoading">复制</button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="8" class="empty">暂无符合条件的任务</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="tasks__pager" v-if="pageCount > 1">
      <button type="button" class="btn btn--ghost" :disabled="filters.page <= 1 || loading" @click="changePage(filters.page - 1)">上一页</button>
      <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
      <button type="button" class="btn btn--ghost" :disabled="filters.page >= pageCount || loading" @click="changePage(filters.page + 1)">下一页</button>
      <label class="pager__size">
        <span>每页</span>
        <select class="input" :value="filters.page_size" @change="changePageSize($event)">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <span>共 {{ total }} 条</span>
    </footer>

    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>

    <div v-if="drawerVisible" class="tasks-drawer">
      <div class="tasks-drawer__backdrop" @click="closeDrawer" />
      <aside class="tasks-drawer__panel" role="dialog" aria-modal="true">
        <header class="tasks-drawer__header">
          <div class="drawer-title">
            <h2>{{ drawerTitle }}</h2>
            <span class="status-tag" :data-status="currentStatus">{{ statusLabel(currentStatus) }}</span>
          </div>
          <div class="drawer-actions">
            <button v-if="drawerMode !== 'view'" type="button" class="btn btn--ghost" @click="validateCurrent" :disabled="drawerSaving || actionLoading">
              {{ validating ? '校验中…' : '校验配置' }}
            </button>
            <button v-if="drawerMode === 'view' && canEditStatus(currentStatus)" type="button" class="btn btn--ghost" @click="switchToEdit">编辑草稿</button>
            <button v-if="drawerMode !== 'create' && canPublishStatus(currentStatus)" type="button" class="btn" @click="publishFromDrawer" :disabled="actionLoading">
              {{ actionLoading ? '发布中…' : '发布' }}
            </button>
            <button v-if="drawerMode !== 'create' && currentStatus === 'published'" type="button" class="btn btn--ghost" @click="prepareOfflineFromDrawer" :disabled="actionLoading">下架</button>
            <button v-if="drawerMode !== 'create'" type="button" class="btn btn--ghost" @click="cloneFromDrawer" :disabled="actionLoading">复制</button>
            <button type="button" class="btn btn--ghost" @click="closeDrawer">关闭</button>
          </div>
        </header>

        <nav class="tasks-drawer__steps">
          <button
            v-for="(step, index) in steps"
            :key="step.key"
            type="button"
            class="drawer-step"
            :data-active="index === activeStep"
            :disabled="!canJumpTo(index)"
            @click="jumpTo(index)"
          >
            <span class="drawer-step__index">{{ index + 1 }}</span>
            <span>{{ step.label }}</span>
          </button>
        </nav>

        <section class="tasks-drawer__body">
          <div v-if="currentStep.key === 'basic'" class="step-block">
            <div class="form-grid">
              <label class="form-field" :data-error="basicErrors.name">
                <span>任务名称<em>*</em></span>
                <input class="input" type="text" v-model.trim="taskForm.name" :disabled="isReadOnly" placeholder="2-40 字" />
                <span v-if="basicErrors.name" class="form-error">{{ basicErrors.name }}</span>
              </label>
              <label class="form-field" :data-error="basicErrors.code">
                <span>任务码<em>*</em></span>
                <input class="input" type="text" v-model="taskForm.code" :disabled="isReadOnly" placeholder="大写字母数字" />
                <span v-if="basicErrors.code" class="form-error">{{ basicErrors.code }}</span>
              </label>
              <label class="form-field form-field--full" :data-error="basicErrors.desc">
                <span>任务描述</span>
                <textarea class="textarea" rows="3" v-model.trim="taskForm.desc" :disabled="isReadOnly" placeholder="不超过 200 字" />
              </label>
              <label class="form-field" :data-error="basicErrors.start_time">
                <span>开始时间<em>*</em></span>
                <input class="input" type="datetime-local" v-model="taskForm.start_time" :disabled="isReadOnly" />
                <span v-if="basicErrors.start_time" class="form-error">{{ basicErrors.start_time }}</span>
              </label>
              <label class="form-field" :data-error="basicErrors.end_time">
                <span>结束时间<em>*</em></span>
                <input class="input" type="datetime-local" v-model="taskForm.end_time" :disabled="isReadOnly" />
                <span v-if="basicErrors.end_time" class="form-error">{{ basicErrors.end_time }}</span>
              </label>
              <fieldset class="form-field form-field--full">
                <legend>可见角色</legend>
                <div class="checkbox-group">
                  <label v-for="option in roleOptions" :key="option.value">
                    <input type="checkbox" :value="option.value" v-model="taskForm.visible_to_roles" :disabled="isReadOnly" />
                    {{ option.label }}
                  </label>
                </div>
              </fieldset>
              <fieldset class="form-field form-field--full" :data-error="scopeError">
                <legend>适用范围</legend>
                <div class="scope-group">
                  <div>
                    <strong>公司</strong>
                    <div class="checkbox-group">
                      <label v-for="company in companyOptions" :key="company">
                        <input type="checkbox" :value="company" v-model="taskForm.scope.companies" :disabled="isReadOnly" />
                        {{ company }}
                      </label>
                    </div>
                  </div>
                  <div>
                    <strong>城市</strong>
                    <div class="checkbox-group">
                      <label v-for="option in cityOptions" :key="option.value">
                        <input type="checkbox" :value="option.value" v-model="taskForm.scope.cities" :disabled="isReadOnly" />
                        {{ option.label }}
                      </label>
                    </div>
                  </div>
                  <div>
                    <strong>门店</strong>
                    <div class="checkbox-group checkbox-group--columns">
                      <label v-for="option in storeOptions" :key="option.value">
                        <input type="checkbox" :value="option.value" v-model="taskForm.scope.stores" :disabled="isReadOnly" />
                        {{ option.label }}
                      </label>
                    </div>
                  </div>
                </div>
                <span v-if="scopeError" class="form-error">{{ scopeError }}</span>
              </fieldset>
            </div>
          </div>

          <div v-else-if="currentStep.key === 'dsl'" class="step-block">
            <div class="form-grid">
              <label class="form-field" :data-error="dslErrors.form_dsl_id">
                <span>绑定表单 DSL<em>*</em></span>
                <select class="input" v-model="taskForm.form_dsl_id" :disabled="isReadOnly">
                  <option value="">请选择</option>
                  <option v-for="option in formDslOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <span v-if="dslErrors.form_dsl_id" class="form-error">{{ dslErrors.form_dsl_id }}</span>
              </label>
              <label class="form-field">
                <span>DSL 版本</span>
                <input class="input" type="text" v-model.trim="taskForm.form_dsl.schema_version" :disabled="isReadOnly" placeholder="例如 1.4.2" />
              </label>
            </div>
            <div class="dsl-map-head">
              <h3>字段映射</h3>
              <button type="button" class="btn btn--ghost" @click="addFieldMapping" :disabled="isReadOnly">新增映射</button>
            </div>
            <p v-if="dslErrors.fields_map" class="form-error">{{ dslErrors.fields_map }}</p>
            <div v-if="!taskForm.form_dsl.fields_map.length" class="empty">尚未配置字段映射。</div>
            <div v-for="(map, index) in taskForm.form_dsl.fields_map" :key="index" class="mapping-row">
              <label class="form-field">
                <span>DSL 字段</span>
                <input class="input" type="text" v-model.trim="map.dsl_key" :disabled="isReadOnly" placeholder="dsl_key" />
              </label>
              <label class="form-field">
                <span>业务字段</span>
                <input class="input" type="text" v-model.trim="map.biz_key" :disabled="isReadOnly" placeholder="biz_key" />
              </label>
              <label class="form-field mapping-checkbox">
                <input type="checkbox" v-model="map.required" :disabled="isReadOnly" />
                <span>必填</span>
              </label>
              <label class="form-field">
                <span>校验规则</span>
                <select class="input" :value="map.validation?.type || ''" :disabled="isReadOnly" @change="onValidationTypeChange(index, $event)">
                  <option value="">无</option>
                  <option value="regex">正则</option>
                  <option value="enum">枚举</option>
                  <option value="range">范围</option>
                </select>
              </label>
              <label v-if="map.validation?.type === 'regex' || map.validation?.type === 'enum'" class="form-field">
                <span>{{ map.validation?.type === 'regex' ? '正则表达式' : '枚举列表' }}</span>
                <input class="input" type="text" v-model.trim="map.validation!.value" :disabled="isReadOnly" placeholder="如 ^\\d+$ 或 A,B,C" />
              </label>
              <div v-else-if="map.validation?.type === 'range'" class="range-grid">
                <label class="form-field">
                  <span>最小值</span>
                  <input class="input" type="number" v-model.number="map.validation!.min" :disabled="isReadOnly" />
                </label>
                <label class="form-field">
                  <span>最大值</span>
                  <input class="input" type="number" v-model.number="map.validation!.max" :disabled="isReadOnly" />
                </label>
              </div>
              <button type="button" class="link-btn" @click="removeFieldMapping(index)" :disabled="isReadOnly">移除</button>
            </div>
          </div>

          <div v-else-if="currentStep.key === 'rules'" class="step-block">
            <div class="plans-head">
              <h3>自动校验</h3>
              <button type="button" class="btn btn--ghost" @click="addAutoCheck" :disabled="isReadOnly">新增校验</button>
            </div>
            <div v-if="!taskForm.review_rules.auto_checks?.length" class="empty">暂无自动校验规则。</div>
            <section v-for="(rule, index) in taskForm.review_rules.auto_checks" :key="index" class="rule-block">
              <label class="form-field">
                <span>字段</span>
                <input class="input" type="text" v-model.trim="rule.key" :disabled="isReadOnly" placeholder="如 id_number" />
              </label>
              <label class="form-field">
                <span>规则</span>
                <input class="input" type="text" v-model.trim="rule.rule" :disabled="isReadOnly" placeholder="如 regex_cn_id" />
              </label>
              <label class="form-field">
                <span>级别</span>
                <select class="input" v-model="rule.level" :disabled="isReadOnly">
                  <option value="error">错误</option>
                  <option value="warn">提醒</option>
                </select>
              </label>
              <label class="form-field form-field--full">
                <span>提示</span>
                <input class="input" type="text" v-model.trim="rule.message" :disabled="isReadOnly" placeholder="提示信息" />
              </label>
              <button type="button" class="link-btn" @click="removeAutoCheck(index)" :disabled="isReadOnly">移除</button>
            </section>

            <div class="plans-head">
              <h3>阈值策略</h3>
              <button type="button" class="btn btn--ghost" @click="addThreshold" :disabled="isReadOnly">新增阈值</button>
            </div>
            <div v-if="!taskForm.review_rules.thresholds?.length" class="empty">暂无阈值策略。</div>
            <section v-for="(item, index) in taskForm.review_rules.thresholds" :key="index" class="rule-block">
              <label class="form-field">
                <span>字段</span>
                <input class="input" type="text" v-model.trim="item.key" :disabled="isReadOnly" placeholder="如 amount" />
              </label>
              <label class="form-field">
                <span>比较符</span>
                <input class="input" type="text" v-model.trim="item.op" :disabled="isReadOnly" placeholder=">=" />
              </label>
              <label class="form-field">
                <span>阈值</span>
                <input class="input" type="number" v-model.number="item.value" :disabled="isReadOnly" />
              </label>
              <label class="form-field">
                <span>动作</span>
                <input class="input" type="text" v-model.trim="item.action" :disabled="isReadOnly" placeholder="如 manual_review" />
              </label>
              <button type="button" class="link-btn" @click="removeThreshold(index)" :disabled="isReadOnly">移除</button>
            </section>

            <div class="flow-grid">
              <label class="form-field">
                <span>抽审比例 %</span>
                <input class="input" type="number" min="0" max="100" v-model.number="taskForm.review_rules.sampling.percent" :disabled="isReadOnly" />
              </label>
              <label class="form-field">
                <span>抽审种子</span>
                <input class="input" type="text" v-model.trim="taskForm.review_rules.sampling.seed" :disabled="isReadOnly" placeholder="可选" />
              </label>
              <label class="form-field form-field--switch">
                <input type="checkbox" v-model="taskForm.review_rules.double_review" :disabled="isReadOnly" />
                <span>启用双人复核</span>
              </label>
              <label class="form-field">
                <span>审核 SLA (分钟)</span>
                <input class="input" type="number" min="0" v-model.number="taskForm.review_rules.sla" :disabled="isReadOnly" />
              </label>
            </div>
          </div>

          <div v-else-if="currentStep.key === 'risk'" class="step-block">
            <div class="form-grid">
              <label class="form-field">
                <span>风控模板</span>
                <select class="input" v-model="taskForm.risk_policy_id" :disabled="isReadOnly">
                  <option value="">未绑定</option>
                  <option v-for="option in riskPolicyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label class="form-field">
                <span>命中动作</span>
                <select class="input" v-model="taskForm.risk_action" :disabled="isReadOnly">
                  <option value="queue">进入工单</option>
                  <option value="block">拦截提交</option>
                  <option value="flag">仅标记</option>
                </select>
              </label>
            </div>
          </div>

          <div v-else-if="currentStep.key === 'flow'" class="step-block flow-grid">
            <label class="form-field">
              <span>流程模式</span>
              <select class="input" v-model="taskForm.release.mode" :disabled="isReadOnly">
                <option value="immediate">立即发布</option>
                <option value="scheduled">定时发布</option>
                <option value="gray">灰度发布</option>
              </select>
            </label>
            <label v-if="taskForm.release.mode === 'scheduled'" class="form-field">
              <span>定时发布时间</span>
              <input class="input" type="datetime-local" v-model="releaseSchedule" :disabled="isReadOnly" />
            </label>
            <label v-if="taskForm.release.mode === 'gray'" class="form-field">
              <span>灰度比例 %</span>
              <input class="input" type="number" min="0" max="100" v-model.number="taskForm.release.gray_percent" :disabled="isReadOnly" />
            </label>
            <label class="form-field">
              <span>回滚版本</span>
              <input class="input" type="number" min="0" v-model.number="taskForm.release.rollback_to_version" :disabled="isReadOnly" placeholder="可选" />
            </label>
            <p v-if="releaseError" class="form-error">{{ releaseError }}</p>
          </div>

          <div v-else class="step-block">
            <div class="versions-head">
              <h3>版本日志</h3>
              <button type="button" class="btn btn--ghost" @click="refreshVersions" :disabled="!currentTaskId || versionsLoading">刷新</button>
            </div>
            <div v-if="versionsLoading" class="empty">版本数据加载中…</div>
            <ul v-else class="version-list">
              <li v-for="item in versionList.items" :key="item.version" class="version-item">
                <header>
                  <strong>V{{ item.version }}</strong>
                  <span>{{ formatDateTime(item.time) }}</span>
                  <span>{{ item.operator }}</span>
                </header>
                <p>{{ item.changelog }}</p>
                <pre v-if="item.diff" class="version-diff">{{ formatDiff(item.diff) }}</pre>
              </li>
            </ul>
          </div>
        </section>

        <footer class="tasks-drawer__footer">
          <button type="button" class="btn btn--ghost" @click="closeDrawer">取消</button>
          <button type="button" class="btn btn--ghost" @click="prevStep" :disabled="activeStep === 0">上一步</button>
          <button
            v-if="activeStep < steps.length - 1"
            type="button"
            class="btn"
            @click="nextStep"
            :disabled="isReadOnly"
          >
            下一步
          </button>
          <button
            v-else
            type="button"
            class="btn"
            @click="saveDraft"
            :disabled="drawerSaving || isReadOnly"
          >
            {{ drawerSaving ? '保存中…' : '保存草稿' }}
          </button>
        </footer>
      </aside>
    </div>

    <div v-if="offlineModalVisible" class="offline-modal">
      <div class="offline-modal__backdrop" @click="closeOfflineModal" />
      <div class="offline-modal__panel" role="dialog" aria-modal="true">
        <header>
          <h3>下架原因</h3>
        </header>
        <section>
          <p>请说明下架原因，以便留存记录。</p>
          <textarea class="textarea" rows="4" v-model.trim="offlineReason" placeholder="不少于 5 个字" />
          <p v-if="offlineError" class="form-error">{{ offlineError }}</p>
        </section>
        <footer>
          <button type="button" class="btn btn--ghost" @click="closeOfflineModal">取消</button>
          <button type="button" class="btn" @click="confirmOffline" :disabled="actionLoading">
            {{ actionLoading ? '提交中…' : '确认下架' }}
          </button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  TasksService,
  type TaskDetail,
  type TaskFilters,
  type TaskListItem,
  type TaskPayload,
  type TaskStatus,
  type TaskVersionList
} from '@/sdk/tasks';

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'offline', label: '已下架' },
  { value: 'deprecated', label: '已废弃' }
];

const formDslOptions = [
  { value: 'F123', label: 'F123 · 实名开户' },
  { value: 'F208', label: 'F208 · 回访表单' },
  { value: 'F305', label: 'F305 · 材料补充' }
];

const riskPolicyOptions = [
  { value: 'R001', label: 'R001 · 身份核验' },
  { value: 'R006', label: 'R006 · 黑名单拦截' },
  { value: 'R008', label: 'R008 · 资料抽查' }
];

const roleOptions = [
  { value: 'operator', label: '运营人员' },
  { value: 'promoter', label: '推广人员' },
  { value: 'store_owner', label: '门店负责人' },
  { value: 'reviewer', label: '审核员' }
];

const companyOptions = ['华南事业部', '华中事业部', '华北事业部'];

const cityOptions = [
  { value: 'GZ', label: '广州' },
  { value: 'SZ', label: '深圳' },
  { value: 'FS', label: '佛山' },
  { value: 'DG', label: '东莞' }
];

const storeOptions = [
  { value: 'S001', label: 'S001 天河旗舰店' },
  { value: 'S002', label: 'S002 海珠江畔店' },
  { value: 'SZ101', label: 'SZ101 福田中心店' },
  { value: 'FS002', label: 'FS002 顺德乐从店' }
];

const steps = [
  { key: 'basic', label: '基本信息' },
  { key: 'dsl', label: '表单绑定' },
  { key: 'rules', label: '审核规则' },
  { key: 'risk', label: '风控策略' },
  { key: 'flow', label: '发布策略' },
  { key: 'versions', label: '版本日志' }
] as const;

const filters = reactive<TaskFilters & { page: number; page_size: number }>(
  {
    status: '',
    form_dsl_id: '',
    risk_policy_id: '',
    role: '',
    keyword: '',
    page: 1,
    page_size: 10,
    sort_key: 'start_time',
    sort_order: 'desc'
  }
);

const tasks = ref<TaskListItem[]>([]);
const total = ref(0);
const loading = ref(false);
const exporting = ref(false);
const actionLoading = ref(false);
const validating = ref(false);
const drawerSaving = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');

const pageSizeOptions = [10, 20, 50];

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit' | 'view'>('create');
const activeStep = ref(0);
const timeNow = () => new Date().toISOString().slice(0, 16);

const taskForm = reactive<TaskPayload>({
  name: '',
  code: '',
  desc: '',
  start_time: '',
  end_time: '',
  visible_to_roles: [],
  scope: { companies: [], cities: [], stores: [] },
  form_dsl_id: '',
  form_dsl: { schema_version: '', fields: [], fields_map: [] },
  review_rules: { auto_checks: [], thresholds: [], sampling: { percent: 0, seed: '' }, double_review: false, sla: 60 },
  risk_policy_id: '',
  risk_action: 'queue',
  release: { mode: 'immediate', schedule_time: '', gray_percent: 0, rollback_to_version: null }
});

const tasksListMap = ref<Record<string, TaskDetail | null>>({});
const currentTaskId = ref<string | null>(null);
const currentStatus = ref<TaskStatus>('draft');
const versionList = reactive<TaskVersionList>({ total: 0, items: [] });
const versionsLoading = ref(false);

const basicErrors = reactive({ name: '', code: '', desc: '', start_time: '', end_time: '' });
const dslErrors = reactive<{ form_dsl_id: string; fields_map: string }>({ form_dsl_id: '', fields_map: '' });
const scopeError = ref('');
const releaseError = ref('');

const drawerTitle = computed(() => {
  if (drawerMode.value === 'create') return '新建任务';
  if (drawerMode.value === 'edit') return '编辑任务';
  return '任务详情';
});

const pageCount = computed(() => {
  if (!filters.page_size) return 1;
  return Math.max(1, Math.ceil(total.value / filters.page_size));
});

const currentStep = computed(() => steps[activeStep.value]);
const isReadOnly = computed(() => drawerMode.value === 'view');
const releaseSchedule = computed({
  get: () => taskForm.release?.schedule_time || '',
  set: (value: string) => {
    if (!taskForm.release) taskForm.release = {};
    taskForm.release.schedule_time = value;
  }
});

function statusLabel(status: TaskStatus) {
  switch (status) {
    case 'draft':
      return '草稿';
    case 'published':
      return '已发布';
    case 'offline':
      return '已下架';
    case 'deprecated':
      return '已废弃';
    default:
      return status;
  }
}

function canEditStatus(status: TaskStatus) {
  return status === 'draft' || status === 'offline';
}

function canPublishStatus(status: TaskStatus) {
  return status === 'draft' || status === 'offline';
}

async function fetchTasks() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await TasksService.listTasks(filters);
    tasks.value = response.items || [];
    total.value = response.total || 0;
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  filters.page = 1;
  fetchTasks();
}

function resetFilters() {
  filters.status = '';
  filters.form_dsl_id = '';
  filters.risk_policy_id = '';
  filters.role = '';
  filters.keyword = '';
  filters.page = 1;
  filters.page_size = 10;
  filters.sort_key = 'start_time';
  filters.sort_order = 'desc';
  fetchTasks();
}

function changePage(page: number) {
  if (page < 1 || page > pageCount.value) return;
  filters.page = page;
  fetchTasks();
}

function changePageSize(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  filters.page_size = value || 10;
  filters.page = 1;
  fetchTasks();
}

function parseError(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) return String((err as any).message);
  return '操作失败，请稍后再试';
}

function resetForm() {
  taskForm.name = '';
  taskForm.code = '';
  taskForm.desc = '';
  taskForm.start_time = '';
  taskForm.end_time = '';
  taskForm.visible_to_roles = [];
  taskForm.scope.companies = [];
  taskForm.scope.cities = [];
  taskForm.scope.stores = [];
  taskForm.form_dsl_id = '';
  taskForm.form_dsl.schema_version = '';
  taskForm.form_dsl.fields = [];
  taskForm.form_dsl.fields_map = [];
  taskForm.review_rules.auto_checks = [];
  taskForm.review_rules.thresholds = [];
  taskForm.review_rules.sampling = { percent: 0, seed: '' };
  taskForm.review_rules.double_review = false;
  taskForm.review_rules.sla = 60;
  taskForm.risk_policy_id = '';
  taskForm.risk_action = 'queue';
  taskForm.release = { mode: 'immediate', schedule_time: '', gray_percent: 0, rollback_to_version: null };
}

function fillForm(detail: TaskDetail) {
  taskForm.name = detail.name;
  taskForm.code = detail.code;
  taskForm.desc = detail.desc || '';
  taskForm.start_time = detail.start_time ? detail.start_time.slice(0, 16) : '';
  taskForm.end_time = detail.end_time ? detail.end_time.slice(0, 16) : '';
  taskForm.visible_to_roles = [...(detail.visible_to_roles || [])];
  taskForm.scope.companies = detail.scope.companies ? [...detail.scope.companies] : [];
  taskForm.scope.cities = detail.scope.cities ? [...detail.scope.cities] : [];
  taskForm.scope.stores = detail.scope.stores ? [...detail.scope.stores] : [];
  taskForm.form_dsl_id = detail.form_dsl_id;
  taskForm.form_dsl.schema_version = detail.form_dsl?.schema_version || '';
  taskForm.form_dsl.fields = detail.form_dsl?.fields ? [...detail.form_dsl.fields] : [];
  taskForm.form_dsl.fields_map = detail.form_dsl?.fields_map
    ? detail.form_dsl.fields_map.map((item) => ({ ...item, validation: item.validation ? { ...item.validation } : undefined }))
    : [];
  taskForm.review_rules.auto_checks = detail.review_rules?.auto_checks ? detail.review_rules.auto_checks.map((item) => ({ ...item })) : [];
  taskForm.review_rules.thresholds = detail.review_rules?.thresholds ? detail.review_rules.thresholds.map((item) => ({ ...item })) : [];
  taskForm.review_rules.sampling = detail.review_rules?.sampling ? { ...detail.review_rules.sampling } : { percent: 0, seed: '' };
  taskForm.review_rules.double_review = Boolean(detail.review_rules?.double_review);
  taskForm.review_rules.sla = detail.review_rules?.sla ?? 60;
  taskForm.risk_policy_id = detail.risk_policy_id || '';
  taskForm.risk_action = detail.risk_action || 'queue';
  taskForm.release = detail.release ? { ...detail.release } : { mode: 'immediate', schedule_time: '', gray_percent: 0, rollback_to_version: null };
  if (taskForm.release && taskForm.release.schedule_time) {
    taskForm.release.schedule_time = taskForm.release.schedule_time.slice(0, 16);
  }
  versionList.total = detail.versions?.total || 0;
  versionList.items = detail.versions?.items ? [...detail.versions.items] : [];
}

function openCreateDrawer() {
  resetForm();
  drawerMode.value = 'create';
  drawerVisible.value = true;
  activeStep.value = 0;
  currentTaskId.value = null;
  currentStatus.value = 'draft';
  clearErrors();
  versionList.total = 0;
  versionList.items = [];
}

async function openViewDrawer(item: TaskListItem) {
  await openDrawerWithData('view', item);
  activeStep.value = steps.length - 1;
}

async function openEditDrawer(item: TaskListItem) {
  await openDrawerWithData('edit', item);
}

async function openDrawerWithData(mode: 'view' | 'edit', item: TaskListItem) {
  drawerMode.value = mode;
  drawerVisible.value = true;
  activeStep.value = 0;
  clearErrors();
  try {
    const cached = tasksListMap.value[item.task_id];
    const detail = cached || (await TasksService.getTask(item.task_id));
    tasksListMap.value[item.task_id] = detail;
    fillForm(detail as TaskDetail);
    currentTaskId.value = detail.task_id;
    currentStatus.value = detail.status;
  } catch (err) {
    errorMessage.value = parseError(err);
    drawerVisible.value = false;
  }
}

function closeDrawer() {
  drawerVisible.value = false;
}

function switchToEdit() {
  if (!canEditStatus(currentStatus.value)) return;
  drawerMode.value = 'edit';
  activeStep.value = 0;
}

function nextStep() {
  if (activeStep.value >= steps.length - 1) return;
  if (!validateStep(activeStep.value)) return;
  activeStep.value += 1;
}

function prevStep() {
  if (activeStep.value === 0) return;
  activeStep.value -= 1;
}

function canJumpTo(index: number) {
  if (isReadOnly.value) return true;
  if (index <= activeStep.value) return true;
  for (let i = 0; i < index; i += 1) {
    if (!validateStep(i)) return false;
  }
  return true;
}

function jumpTo(index: number) {
  if (!canJumpTo(index)) return;
  activeStep.value = index;
}

function clearErrors() {
  basicErrors.name = '';
  basicErrors.code = '';
  basicErrors.desc = '';
  basicErrors.start_time = '';
  basicErrors.end_time = '';
  dslErrors.form_dsl_id = '';
  dslErrors.fields_map = '';
  scopeError.value = '';
  releaseError.value = '';
}

function validateStep(index: number) {
  const key = steps[index].key;
  if (key === 'basic') return validateBasic();
  if (key === 'dsl') return validateDsl();
  if (key === 'rules') return validateRules();
  if (key === 'flow') return validateRelease();
  return true;
}

function validateBasic() {
  let valid = true;
  basicErrors.name = '';
  basicErrors.code = '';
  basicErrors.start_time = '';
  basicErrors.end_time = '';
  scopeError.value = '';

  if (!taskForm.name || taskForm.name.trim().length < 2 || taskForm.name.trim().length > 40) {
    basicErrors.name = '请输入 2-40 字名称';
    valid = false;
  }
  const code = taskForm.code?.trim();
  if (!/^[A-Z0-9]{3,16}$/.test(code)) {
    basicErrors.code = '任务码需为 3-16 位大写字母或数字';
    valid = false;
  }
  if (!taskForm.start_time) {
    basicErrors.start_time = '请选择开始时间';
    valid = false;
  }
  if (!taskForm.end_time) {
    basicErrors.end_time = '请选择结束时间';
    valid = false;
  }
  if (taskForm.start_time && taskForm.end_time) {
    const start = new Date(taskForm.start_time).getTime();
    const end = new Date(taskForm.end_time).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && start >= end) {
      basicErrors.end_time = '结束时间需晚于开始时间';
      valid = false;
    }
  }
  const scopeCount = (taskForm.scope.companies?.length || 0) + (taskForm.scope.cities?.length || 0) + (taskForm.scope.stores?.length || 0);
  if (!scopeCount) {
    scopeError.value = '至少选择一个范围维度';
    valid = false;
  }
  return valid;
}

function validateDsl() {
  dslErrors.form_dsl_id = '';
  dslErrors.fields_map = '';
  let valid = true;
  if (!taskForm.form_dsl_id) {
    dslErrors.form_dsl_id = '请选择表单 DSL';
    valid = false;
  }
  if (!taskForm.form_dsl.fields_map || !taskForm.form_dsl.fields_map.length) {
    dslErrors.fields_map = '请至少配置一个字段映射';
    valid = false;
  }
  return valid;
}

function validateRules() {
  const sampling = taskForm.review_rules.sampling?.percent ?? 0;
  if (sampling < 0 || sampling > 100) {
    feedbackMessage.value = '抽审比例需在 0-100 之间';
    return false;
  }
  return true;
}

function validateRelease() {
  releaseError.value = '';
  if (taskForm.release?.mode === 'scheduled' && !taskForm.release.schedule_time) {
    releaseError.value = '请选择定时发布时间';
    return false;
  }
  if (taskForm.release?.mode === 'gray') {
    const percent = taskForm.release.gray_percent ?? 0;
    if (percent < 0 || percent > 100) {
      releaseError.value = '灰度比例需在 0-100 之间';
      return false;
    }
  }
  return true;
}

function validateAll() {
  return steps.every((_, index) => validateStep(index));
}

function buildPayload(): TaskPayload {
  return {
    name: taskForm.name.trim(),
    code: taskForm.code.trim(),
    desc: taskForm.desc?.trim(),
    start_time: taskForm.start_time ? new Date(taskForm.start_time).toISOString() : '',
    end_time: taskForm.end_time ? new Date(taskForm.end_time).toISOString() : '',
    visible_to_roles: [...taskForm.visible_to_roles],
    scope: {
      companies: taskForm.scope.companies ? [...taskForm.scope.companies] : [],
      cities: taskForm.scope.cities ? [...taskForm.scope.cities] : [],
      stores: taskForm.scope.stores ? [...taskForm.scope.stores] : []
    },
    form_dsl_id: taskForm.form_dsl_id,
    form_dsl: {
      schema_version: taskForm.form_dsl.schema_version,
      fields: taskForm.form_dsl.fields ? taskForm.form_dsl.fields.map((item) => ({ ...item })) : [],
      fields_map: taskForm.form_dsl.fields_map ? taskForm.form_dsl.fields_map.map((item) => ({ ...item })) : []
    },
    review_rules: {
      auto_checks: taskForm.review_rules.auto_checks ? taskForm.review_rules.auto_checks.map((item) => ({ ...item })) : [],
      thresholds: taskForm.review_rules.thresholds ? taskForm.review_rules.thresholds.map((item) => ({ ...item })) : [],
      sampling: taskForm.review_rules.sampling ? { ...taskForm.review_rules.sampling } : undefined,
      double_review: taskForm.review_rules.double_review,
      sla: taskForm.review_rules.sla
    },
    risk_policy_id: taskForm.risk_policy_id || null,
    risk_action: taskForm.risk_action,
    release: (() => {
      if (!taskForm.release) return undefined;
      const clone = { ...taskForm.release };
      if (clone.schedule_time) {
        clone.schedule_time = new Date(clone.schedule_time).toISOString();
      }
      return clone;
    })()
  };
}

async function saveDraft() {
  if (!validateAll()) return;
  drawerSaving.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    const payload = buildPayload();
    if (!currentTaskId.value) {
      const response = await TasksService.createTask(payload);
      currentTaskId.value = response.task_id;
      currentStatus.value = response.status || 'draft';
      feedbackMessage.value = '草稿创建成功';
    } else {
      const response = await TasksService.updateTask(currentTaskId.value, payload);
      currentStatus.value = response.status || currentStatus.value;
      feedbackMessage.value = '草稿已保存';
    }
    await fetchTasks();
    drawerMode.value = 'edit';
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    drawerSaving.value = false;
  }
}

async function validateCurrent() {
  if (!currentTaskId.value) {
    await saveDraft();
    if (!currentTaskId.value) return;
  }
  validating.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    const result = await TasksService.validateTask(currentTaskId.value);
    if (result.ok) {
      feedbackMessage.value = result.warnings?.length ? `校验通过：${result.warnings.map((w) => w.message).join('；')}` : '校验通过';
    } else {
      errorMessage.value = `校验失败：缺少字段 ${result.missing_fields.join(', ')} / 规则错误 ${result.invalid_rules
        .map((it) => `${it.key || '-'} ${it.reason || ''}`)
        .join('；')}`;
    }
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    validating.value = false;
  }
}

async function publishTask(item: TaskListItem) {
  if (!canPublishStatus(item.status)) return;
  actionLoading.value = true;
  errorMessage.value = '';
  try {
    await TasksService.publishTask(item.task_id);
    feedbackMessage.value = '任务已发布';
    await fetchTasks();
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

async function publishFromDrawer() {
  if (!currentTaskId.value) return;
  if (!validateAll()) return;
  actionLoading.value = true;
  errorMessage.value = '';
  try {
    if (drawerMode.value !== 'view') {
      const payload = buildPayload();
      await TasksService.updateTask(currentTaskId.value, payload);
    }
    await TasksService.publishTask(currentTaskId.value);
    currentStatus.value = 'published';
    feedbackMessage.value = '任务已发布';
    await fetchTasks();
    drawerMode.value = 'view';
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

function prepareOffline(item: TaskListItem) {
  currentTaskId.value = item.task_id;
  offlineReason.value = '';
  offlineError.value = '';
  offlineModalVisible.value = true;
}

function prepareOfflineFromDrawer() {
  if (!currentTaskId.value) return;
  offlineReason.value = '';
  offlineError.value = '';
  offlineModalVisible.value = true;
}

function closeOfflineModal() {
  offlineModalVisible.value = false;
}

async function confirmOffline() {
  if (!currentTaskId.value) return;
  if (!offlineReason.value || offlineReason.value.trim().length < 5) {
    offlineError.value = '请输入不少于 5 个字的原因';
    return;
  }
  actionLoading.value = true;
  offlineError.value = '';
  try {
    await TasksService.offlineTask(currentTaskId.value, offlineReason.value.trim());
    currentStatus.value = 'offline';
    feedbackMessage.value = '任务已下架';
    offlineModalVisible.value = false;
    await fetchTasks();
    if (drawerMode.value !== 'create') drawerMode.value = 'view';
  } catch (err) {
    offlineError.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

async function cloneTask(item: TaskListItem) {
  actionLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await TasksService.cloneTask(item.task_id);
    feedbackMessage.value = '复制成功，已生成草稿';
    await fetchTasks();
    const detail = await TasksService.getTask(response.task_id);
    tasksListMap.value[response.task_id] = detail;
    fillForm(detail);
    currentTaskId.value = detail.task_id;
    currentStatus.value = detail.status;
    drawerMode.value = 'edit';
    drawerVisible.value = true;
    activeStep.value = 0;
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

async function cloneFromDrawer() {
  if (!currentTaskId.value) return;
  await cloneTask({
    task_id: currentTaskId.value,
    name: taskForm.name,
    code: taskForm.code,
    status: currentStatus.value,
    version: 0,
    start_time: new Date(taskForm.start_time).toISOString(),
    end_time: new Date(taskForm.end_time).toISOString(),
    form_dsl_id: taskForm.form_dsl_id,
    risk_policy_id: taskForm.risk_policy_id || undefined,
    visible_to_roles: [...taskForm.visible_to_roles],
    scope: { ...taskForm.scope }
  });
}

async function handleExport() {
  exporting.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    await TasksService.exportTasks(filters);
    feedbackMessage.value = '导出任务已提交';
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    exporting.value = false;
  }
}

async function refreshVersions() {
  if (!currentTaskId.value) return;
  versionsLoading.value = true;
  try {
    const list = await TasksService.listVersions(currentTaskId.value);
    versionList.total = list.total;
    versionList.items = list.items || [];
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    versionsLoading.value = false;
  }
}

function addFieldMapping() {
  if (isReadOnly.value) return;
  if (!taskForm.form_dsl.fields_map) taskForm.form_dsl.fields_map = [];
  taskForm.form_dsl.fields_map.push({ dsl_key: '', biz_key: '', required: true });
}

function removeFieldMapping(index: number) {
  if (isReadOnly.value) return;
  taskForm.form_dsl.fields_map?.splice(index, 1);
}

function onValidationTypeChange(index: number, event: Event) {
  if (isReadOnly.value) return;
  const type = (event.target as HTMLSelectElement).value as 'regex' | 'enum' | 'range' | '';
  if (!taskForm.form_dsl.fields_map) return;
  if (!type) {
    taskForm.form_dsl.fields_map[index].validation = undefined;
    return;
  }
  const validation = taskForm.form_dsl.fields_map[index].validation || {};
  validation.type = type;
  if (type === 'range') {
    validation.min = 0;
    validation.max = 100;
  } else {
    validation.value = '';
  }
  taskForm.form_dsl.fields_map[index].validation = validation;
}

function addAutoCheck() {
  if (isReadOnly.value) return;
  if (!taskForm.review_rules.auto_checks) taskForm.review_rules.auto_checks = [];
  taskForm.review_rules.auto_checks.push({ key: '', rule: '', level: 'error', message: '' });
}

function removeAutoCheck(index: number) {
  if (isReadOnly.value) return;
  taskForm.review_rules.auto_checks?.splice(index, 1);
}

function addThreshold() {
  if (isReadOnly.value) return;
  if (!taskForm.review_rules.thresholds) taskForm.review_rules.thresholds = [];
  taskForm.review_rules.thresholds.push({ key: '', op: '>=', value: 0, action: 'manual_review' });
}

function removeThreshold(index: number) {
  if (isReadOnly.value) return;
  taskForm.review_rules.thresholds?.splice(index, 1);
}

function formatDateRange(start: string, end: string) {
  if (!start || !end) return '-';
  const startText = new Date(start).toLocaleString('zh-CN', { hour12: false });
  const endText = new Date(end).toLocaleString('zh-CN', { hour12: false });
  return `${startText} ~ ${endText}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function formatDiff(diff: Record<string, unknown> | undefined) {
  if (!diff) return '';
  return JSON.stringify(diff, null, 2);
}

watch(
  () => taskForm.code,
  (value) => {
    if (typeof value !== 'string') return;
    const transformed = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (transformed !== value) {
      taskForm.code = transformed;
    }
  }
);

fetchTasks();
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.tasks {
  display: grid;
  gap: $spacing-24;
  color: $color-text-strong;
}

.tasks__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.tasks__title {
  margin: 0 0 $spacing-8;
  font-size: calc(#{$font-size-16} * 1.25);
}

.tasks__subtitle {
  margin: 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.tasks__actions {
  display: flex;
  gap: $spacing-12;
}

.tasks__filters {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-16;
  background: $color-surface-0;
  display: grid;
  gap: $spacing-16;
}

.filters__row {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 10), 1fr));
}

.filters__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.filters__field--keyword {
  grid-column: span 2;
}

.filters__actions {
  display: flex;
  gap: $spacing-12;
}

.tasks__table {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  overflow-x: auto;
  background: $color-surface-0;
}

.tasks__table table {
  width: 100%;
  border-collapse: collapse;
}

.tasks__table th,
.tasks__table td {
  padding: $spacing-12 $spacing-16;
  text-align: left;
  border-bottom: $border-width-1 solid $color-surface-100;
  font-size: $font-size-16;
}

.tasks__table th {
  color: $color-surface-500;
  background: $color-surface-50;
}

.col-actions {
  width: calc(#{$spacing-16} * 12);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-8;
}

.link-btn {
  background: transparent;
  border: none;
  color: $color-primary-700;
  cursor: pointer;
  font-weight: $font-weight-medium;
  padding: 0;
}

.link-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-skeleton {
  height: calc(#{$spacing-16} * 2);
  background: $color-surface-100;
  border-radius: $radius-8;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 $spacing-10;
  height: calc(#{$spacing-16} * 1.5);
  border-radius: $radius-8;
  background: $color-surface-100;
  font-size: $font-size-16;
}

.status-tag[data-status='published'] {
  background: $color-primary-50;
  color: $color-primary-700;
}

.status-tag[data-status='offline'],
.status-tag[data-status='deprecated'] {
  background: $color-surface-200;
}

.empty {
  text-align: center;
  color: $color-surface-500;
  padding: $spacing-16;
}

.tasks__pager {
  display: flex;
  align-items: center;
  gap: $spacing-12;
  color: $color-surface-500;
}

.pager__size {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-8;
  background: $color-primary-50;
  color: $color-primary-700;
}

.feedback--error {
  background: rgba($color-surface-500, 0.15);
  color: $color-surface-700;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-8;
  padding: $spacing-8 $spacing-16;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-primary-700;
  background: $color-primary-700;
  color: $color-text-on-primary;
  font-weight: $font-weight-medium;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: $color-primary-700;
}

.tasks-drawer {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  z-index: 10;
}

.tasks-drawer__backdrop {
  background: rgba($color-surface-700, 0.45);
}

.tasks-drawer__panel {
  width: min(42rem, 95vw);
  background: $color-surface-0;
  border-left: $border-width-1 solid $color-surface-200;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}

.tasks-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-16;
  border-bottom: $border-width-1 solid $color-surface-200;
  gap: $spacing-12;
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: $spacing-12;
}

.drawer-title h2 {
  margin: 0;
  font-size: calc(#{$font-size-16} * 1.1);
}

.drawer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-8;
}

.tasks-drawer__steps {
  display: flex;
  gap: $spacing-8;
  padding: $spacing-12 $spacing-16;
  border-bottom: $border-width-1 solid $color-surface-200;
  overflow-x: auto;
}

.drawer-step {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
  padding: $spacing-8 $spacing-12;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
  cursor: pointer;
}

.drawer-step[data-active='true'] {
  border-color: $color-primary-700;
  color: $color-primary-700;
}

.drawer-step:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.drawer-step__index {
  font-weight: $font-weight-medium;
}

.tasks-drawer__body {
  padding: $spacing-16;
  overflow-y: auto;
  display: grid;
  gap: $spacing-16;
}

.step-block {
  display: grid;
  gap: $spacing-16;
}

.form-grid {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 10), 1fr));
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $font-size-16;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field--switch {
  flex-direction: row;
  align-items: center;
}

.form-field em {
  color: $color-primary-700;
  font-style: normal;
  margin-left: calc(#{$spacing-8} / 2);
}

.input,
.textarea,
select {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
  background: $color-surface-0;
  color: $color-text-strong;
}

.textarea {
  resize: vertical;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-12;
}

.checkbox-group--columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 8), 1fr));
  gap: $spacing-8;
}

.scope-group {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 9), 1fr));
}

.form-error {
  color: $color-primary-700;
  font-size: $font-size-12;
}

.dsl-map-head,
.plans-head,
.versions-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mapping-row,
.rule-block {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-16;
  display: grid;
  gap: $spacing-12;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 8), 1fr));
}

.mapping-checkbox {
  flex-direction: row;
  align-items: center;
}

.range-grid {
  display: grid;
  gap: $spacing-12;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 6), 1fr));
}

.flow-grid {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 9), 1fr));
}

.version-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: $spacing-12;
}

.version-item {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-16;
  display: grid;
  gap: $spacing-8;
}

.version-item header {
  display: flex;
  gap: $spacing-12;
  align-items: baseline;
}

.version-diff {
  margin: 0;
  padding: $spacing-12;
  background: $color-surface-100;
  border-radius: $radius-8;
  font-family: 'Fira Code', 'SFMono-Regular', ui-monospace, monospace;
  font-size: $font-size-12;
}

.tasks-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-12;
  padding: $spacing-16;
  border-top: $border-width-1 solid $color-surface-200;
}

.offline-modal {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
}

.offline-modal__backdrop {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  background: rgba($color-surface-700, 0.45);
}

.offline-modal__panel {
  grid-column: 2;
  grid-row: 1;
  align-self: center;
  background: $color-surface-0;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-16;
  display: grid;
  gap: $spacing-16;
  width: min(28rem, 90vw);
}

.offline-modal__panel footer {
  display: flex;
  gap: $spacing-12;
  justify-content: flex-end;
}

@media (max-width: 64rem) {
  .tasks__actions {
    flex-direction: column;
  }
  .tasks-drawer__panel {
    width: min(100vw, 34rem);
  }
}
</style>
