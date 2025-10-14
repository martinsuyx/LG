import { OpenAPI } from '../../../../sdk/ts';

function inferMockBase(): string {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:4010';
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:4010`;
}

const apiBase = import.meta.env.VITE_API_BASE || inferMockBase();
OpenAPI.BASE = apiBase;

const authToken = import.meta.env.VITE_API_TOKEN || 'mocktoken';
OpenAPI.HEADERS = {
  Authorization: `Bearer ${authToken}`
};

export * from '../../../../sdk/ts';
export * from './campaigns';
export * from './tasks';
export * from './teams';
export * from './users';
export * from './risk';
export * from './reports';
export { ExportJobsService } from './exports';
export { AuditService } from './audit';
export { SystemSettingsService } from './settings';
export { CommissionService } from './commission';
export { ReportTemplatesService } from './reportTemplates';
export { CampaignProductsService } from './campaignProducts';
