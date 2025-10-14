import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue')
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/pages/OrdersPage.vue')
  },
  {
    path: '/orders/matching',
    name: 'orders-matching',
    component: () => import('@/pages/orders/MatchingPage.vue')
  },
  {
    path: '/orders/:orderId',
    name: 'order-detail',
    component: () => import('@/pages/OrderDetailPage.vue')
  },
  {
    path: '/campaigns',
    name: 'campaigns',
    component: () => import('@/pages/CampaignsPage.vue')
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/pages/TasksPage.vue')
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('@/pages/ReviewPage.vue')
  },
  {
    path: '/wallet/summary',
    name: 'wallet-summary',
    component: () => import('@/pages/WalletSummaryPage.vue')
  },
  {
    path: '/wallet/ledger',
    name: 'wallet-ledger',
    component: () => import('@/pages/WalletLedgerPage.vue')
  },
  {
    path: '/withdraws',
    name: 'withdraws',
    component: () => import('@/pages/WithdrawsPage.vue')
  },
  {
    path: '/intake/ai',
    name: 'intake-ai',
    component: () => import('@/pages/AiIntakePage.vue')
  },
  {
    path: '/intake/manual',
    name: 'intake-manual',
    component: () => import('@/pages/ManualIntakePage.vue')
  },
  {
    path: '/org/teams',
    name: 'org-teams',
    component: () => import('@/pages/OrgTeamsPage.vue')
  },
  {
    path: '/org/users-roles',
    name: 'org-users-roles',
    component: () => import('@/pages/UsersRolesPage.vue')
  },
  {
    path: '/reports/overview',
    name: 'reports-overview',
    component: () => import('@/pages/ReportsOverviewPage.vue')
  },
  {
    path: '/system/settings',
    name: 'system-settings',
    component: () => import('@/pages/SystemSettingsPage.vue')
  },
  {
    path: '/audit/logs',
    name: 'audit-logs',
    component: () => import('@/pages/AuditLogsPage.vue')
  },
  {
    path: '/exports',
    name: 'exports-center',
    component: () => import('@/pages/ExportsCenterPage.vue')
  },
  {
    path: '/risk/hits',
    name: 'risk-hits',
    component: () => import('@/pages/RiskHitsPage.vue')
  },
  {
    path: '/risk/tickets',
    name: 'risk-tickets',
    component: () => import('@/pages/RiskTicketsPage.vue')
  },
  {
    path: '/risk/kyc',
    name: 'risk-kyc',
    component: () => import('@/pages/RiskKycPage.vue')
  },
  {
    path: '/risk/lists-rules',
    name: 'risk-lists-rules',
    component: () => import('@/pages/RiskListsRulesPage.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
