export type NavItem = {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  children?: NavItem[];
  hidden?: boolean;
  roles?: string[]; // 用于 RBAC 裁剪
};

export const NAV: NavItem[] = [
  {
    key: 'overview',
    label: 'nav.overview._',
    icon: 'dashboard',
    children: [
      {
        key: 'overview.dashboard',
        label: 'nav.overview.dashboard',
        path: '/dashboard',
        icon: 'dashboard'
      }
    ]
  },
  {
    key: 'orders',
    label: 'nav.orders._',
    icon: 'orders',
    children: [
      { key: 'orders.list', label: 'nav.orders.list', path: '/orders', icon: 'table' },
      { key: 'orders.review', label: 'nav.orders.review', path: '/review', icon: 'review' },
      { key: 'orders.intake.ai', label: 'nav.orders.intake.ai', path: '/intake/ai', icon: 'sparkles' },
      { key: 'orders.intake.manual', label: 'nav.orders.intake.manual', path: '/intake/manual', icon: 'edit' },
      { key: 'orders.detail', label: 'nav.orders.detail', path: '/orders/:id', hidden: true }
    ]
  },
  {
    key: 'wallet',
    label: 'nav.wallet._',
    icon: 'wallet',
    children: [
      { key: 'wallet.summary', label: 'nav.wallet.summary', path: '/wallet/summary', icon: 'chart' },
      { key: 'wallet.ledger', label: 'nav.wallet.ledger', path: '/wallet/ledger', icon: 'list' },
      { key: 'wallet.withdraws', label: 'nav.wallet.withdraws', path: '/withdraws', icon: 'cash' }
    ]
  },
  {
    key: 'campaignsTasks',
    label: 'nav.campaignsTasks._',
    icon: 'flag',
    children: [
      { key: 'campaigns', label: 'nav.campaigns', path: '/campaigns', icon: 'campaign' },
      {
        key: 'campaigns.basics',
        label: 'nav.campaignBasics',
        path: '/campaigns/:id/basics',
        icon: 'campaign',
        hidden: true
      },
      {
        key: 'campaigns.products',
        label: 'nav.campaignProducts',
        path: '/campaigns/:id/products',
        icon: 'campaign',
        hidden: true
      },
      { key: 'tasks', label: 'nav.tasks', path: '/tasks', icon: 'tasks' }
    ]
  },
  {
    key: 'org',
    label: 'nav.org._',
    icon: 'org',
    children: [
      { key: 'org.teams', label: 'nav.org.teams', path: '/org/teams', icon: 'tree' },
      { key: 'org.usersRoles', label: 'nav.org.usersRoles', path: '/org/users-roles', icon: 'users' },
      {
        key: 'org.teamCommission',
        label: 'nav.org.teamCommission',
        path: '/org/teams/:teamId/commission',
        icon: 'equalizer',
        hidden: true,
        roles: ['admin', 'org_admin', 'team_lead']
      }
    ]
  },
  {
    key: 'risk',
    label: 'nav.risk._',
    icon: 'shield',
    children: [
      { key: 'risk.hits', label: 'nav.risk.hits', path: '/risk/hits', icon: 'alert' },
      { key: 'risk.tickets', label: 'nav.risk.tickets', path: '/risk/tickets', icon: 'ticket' },
      { key: 'risk.listsRules', label: 'nav.risk.listsRules', path: '/risk/lists-rules', icon: 'rule' },
      { key: 'risk.kyc', label: 'nav.risk.kyc', path: '/risk/kyc', icon: 'id' }
    ]
  },
  {
    key: 'reports',
    label: 'nav.reports._',
    icon: 'report',
    children: [
      { key: 'reports.overview', label: 'nav.reports.overview', path: '/reports/overview', icon: 'chart' },
      { key: 'reports.exports', label: 'nav.reports.exports', path: '/exports', icon: 'download' },
      { key: 'reports.auditLogs', label: 'nav.reports.auditLogs', path: '/audit/logs', icon: 'history' }
    ]
  },
  {
    key: 'system',
    label: 'nav.system._',
    icon: 'settings',
    children: [
      { key: 'system.settings', label: 'nav.system.settings', path: '/system/settings', icon: 'settings' }
    ]
  }
];

// 顶部通用：用于 i18n
export const TOPBAR = {
  project: 'Joincom · LG Admin',
  search: 'top.search',
  notifications: 'top.notifications',
  help: 'top.help',
  profile: 'top.profile',
  logout: 'top.logout'
};

export const FOOTER = {
  text: '© 2025 Joincom · Linggong Admin',
  versionKey: 'footer.version'
};
