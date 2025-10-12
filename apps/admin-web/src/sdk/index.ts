import { OpenAPI } from '../../../../sdk/ts';

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4010';
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
