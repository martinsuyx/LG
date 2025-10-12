import { OpenAPI } from '../../../../sdk/ts';

export type TeamStatus = 'active' | 'archived';
export type MemberStatus = 'active' | 'frozen' | 'left';
export type MemberRole = 'promoter' | 'store_owner' | 'staff' | 'lead' | 'viewer';

export interface TeamNode {
  team_id: string;
  name: string;
  parent_id: string | null;
  has_children: boolean;
  members_count: number;
  lead_user_id?: string | null;
  lead_user_name?: string | null;
  company_bindings?: string[];
  tags?: string[];
}

export interface TeamDetail extends TeamNode {
  status: TeamStatus;
  created_at?: string | null;
  stores_count: number;
  desc?: string | null;
}

export interface TeamListResponse {
  teams: TeamNode[];
}

export interface TeamChildrenResponse {
  parent_id: string;
  teams: TeamNode[];
}

export interface TeamMember {
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

export interface TeamMembersResponse {
  team_id: string;
  total: number;
  page: number;
  page_size: number;
  items: TeamMember[];
}

export interface TeamFilters {
  company_id?: string;
  keyword?: string;
  status?: TeamStatus;
}

export interface MemberFilters {
  status?: MemberStatus | '';
  role?: MemberRole | '';
  keyword?: string;
  sort_key?: 'joined_at' | 'name' | 'role' | 'status';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface TeamMoveRequest {
  target_team_id: string;
}

export interface TeamMoveResponse {
  ok: boolean;
  team_id: string;
  previous_parent_id?: string | null;
  new_parent_id: string;
}

export interface TeamGrantRequest {
  roles: string[];
  expires_at?: string | null;
}

export interface TeamGrantResponse {
  ok: boolean;
  team_id: string;
  granted_roles: string[];
}

export interface MemberBatchMoveRequest {
  user_ids: string[];
  target_team_id: string;
}

export interface MemberBatchMoveResponse {
  ok: boolean;
  moved_count: number;
  target_team_id: string;
}

export interface InviteCreateRequest {
  target_team_id: string;
  quota: number;
  expires_at: string;
}

export interface InviteCreateResponse {
  invite_code: string;
  target_team_id: string;
  quota: number;
  expires_at: string;
  link?: string;
}

export interface MemberImportRequest {
  target_team_id: string;
  upload_token: string;
  dry_run?: boolean;
  notify_email?: string;
}

export type MemberImportStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export interface MemberImportTask {
  task_id: string;
  status: MemberImportStatus;
  processed: number;
  total: number;
  error_rows?: Array<{ row?: number; message?: string }>;
  created_at?: string | null;
  updated_at?: string | null;
  finished_at?: string | null;
}

export interface MemberExportRequest {
  team_id?: string;
  status?: MemberStatus;
  role?: MemberRole;
  keyword?: string;
}

export interface TeamExportRequest {
  status?: TeamStatus;
  company_id?: string;
  keyword?: string;
}

function resolveHeaders(): HeadersInit {
  const baseHeaders = (OpenAPI.HEADERS as Record<string, string>) || {};
  return {
    'Content-Type': 'application/json',
    ...baseHeaders
  };
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const base = OpenAPI.BASE?.replace(/\/$/, '') || '';
  if (!params || Object.keys(params).length === 0) return `${base}${path}`;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) search.append(key, value.join(','));
      return;
    }
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `${base}${path}?${query}` : `${base}${path}`;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    let errorBody: unknown = null;
    const contentType = response.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        errorBody = await response.json();
        if (errorBody && typeof errorBody === 'object' && 'message' in errorBody) {
          const bodyMessage = (errorBody as Record<string, unknown>).message;
          if (typeof bodyMessage === 'string' && bodyMessage.trim().length) {
            message = bodyMessage;
          }
        }
      } else {
        const text = await response.text();
        if (text.trim().length) {
          message = text;
        }
      }
    } catch (parseError) {
      // ignore parse errors and fall back to default message
      void parseError;
    }
    const error = new Error(message);
    if (errorBody && typeof errorBody === 'object') {
      Object.assign(error, { details: errorBody });
    }
    throw error;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const successType = response.headers.get('content-type') || '';
  if (successType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const TeamsService = {
  async listTeams(filters?: TeamFilters): Promise<TeamListResponse> {
    const url = buildUrl('/api/v1/teams', filters as Record<string, unknown>);
    return request<TeamListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getTeamDetail(teamId: string): Promise<TeamDetail> {
    const url = buildUrl(`/api/v1/teams/${encodeURIComponent(teamId)}`);
    return request<TeamDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getTeamChildren(teamId: string): Promise<TeamChildrenResponse> {
    const url = buildUrl(`/api/v1/teams/${encodeURIComponent(teamId)}/children`);
    return request<TeamChildrenResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getTeamMembers(teamId: string, filters: MemberFilters): Promise<TeamMembersResponse> {
    const url = buildUrl(`/api/v1/teams/${encodeURIComponent(teamId)}/members`, filters as Record<string, unknown>);
    return request<TeamMembersResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async moveTeam(teamId: string, payload: TeamMoveRequest): Promise<TeamMoveResponse> {
    const url = buildUrl(`/api/v1/teams/${encodeURIComponent(teamId)}/move`);
    return request<TeamMoveResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async grantTeamRoles(teamId: string, payload: TeamGrantRequest): Promise<TeamGrantResponse> {
    const url = buildUrl(`/api/v1/teams/${encodeURIComponent(teamId)}/grant`);
    return request<TeamGrantResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async batchMoveMembers(payload: MemberBatchMoveRequest): Promise<MemberBatchMoveResponse> {
    const url = buildUrl('/api/v1/members/batch_move');
    return request<MemberBatchMoveResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async createInvite(payload: InviteCreateRequest): Promise<InviteCreateResponse> {
    const url = buildUrl('/api/v1/invites');
    return request<InviteCreateResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async importMembers(payload: MemberImportRequest): Promise<MemberImportTask> {
    const url = buildUrl('/api/v1/members/import');
    return request<MemberImportTask>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async getImportTask(taskId: string): Promise<MemberImportTask> {
    const url = buildUrl(`/api/v1/members/import/${encodeURIComponent(taskId)}`);
    return request<MemberImportTask>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async exportMembers(payload?: MemberExportRequest): Promise<{ export_id: string; status?: string; module?: string }> {
    const url = buildUrl('/api/v1/exports/members');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload || {})
    });
  },

  async exportTeams(payload?: TeamExportRequest): Promise<{ export_id: string; status?: string; module?: string }> {
    const url = buildUrl('/api/v1/exports/teams');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload || {})
    });
  }
};
