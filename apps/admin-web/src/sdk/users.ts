import { OpenAPI } from '../../../../sdk/ts';

export type UserStatus = 'active' | 'frozen' | 'deleted';

export interface UserListItem {
  user_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role_ids: string[];
  status: UserStatus;
  last_login_at?: string | null;
  teams?: string[];
}

export interface UserListResponse {
  page: number;
  page_size: number;
  total: number;
  items: UserListItem[];
}

export interface UserFilters {
  keyword?: string;
  status?: UserStatus | '';
  role_id?: string;
  page?: number;
  page_size?: number;
  sort_key?: 'last_login_at' | 'name';
  sort_order?: 'asc' | 'desc';
}

export interface UserDetail extends UserListItem {
  created_at?: string | null;
  updated_at?: string | null;
  recent_actions?: Array<{ ts: string; action: string }>;
}

export interface CreateUserRequest {
  name: string;
  phone?: string;
  email?: string;
  role_ids: string[];
}

export interface CreateUserResponse {
  ok: boolean;
  user: UserDetail;
  temporary_password?: string;
}

export interface AssignRolesResponse {
  ok: boolean;
  user_id: string;
  role_ids: string[];
  updated_at?: string;
}

export interface ResetPasswordResponse {
  ok: boolean;
  user_id: string;
  temp_password: string;
  expire_at?: string;
}

export interface FreezeUserResponse {
  ok: boolean;
  user_id: string;
  status: UserStatus;
}

export interface RoleListItem {
  role_id: string;
  name: string;
  desc?: string | null;
  status: 'active' | 'archived';
  bound_users?: number;
  updated_at?: string | null;
}

export interface RoleListResponse {
  total: number;
  items: RoleListItem[];
}

export interface RoleDetail extends RoleListItem {
  created_at?: string | null;
  permissions: string[];
}

export interface PermissionNode {
  perm_id: string;
  name: string;
  type: 'menu' | 'api';
  children?: PermissionNode[];
}

export interface PermissionTreeResponse {
  items: PermissionNode[];
}

interface ExportResponse {
  export_id: string;
  status?: string;
  module?: string;
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

export const UsersService = {
  async listUsers(filters?: UserFilters): Promise<UserListResponse> {
    const url = buildUrl('/api/v1/users', filters as Record<string, unknown>);
    return request<UserListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getUserDetail(userId: string): Promise<UserDetail> {
    const url = buildUrl(`/api/v1/users/${encodeURIComponent(userId)}`);
    return request<UserDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async createUser(payload: CreateUserRequest): Promise<CreateUserResponse> {
    const url = buildUrl('/api/v1/users');
    return request<CreateUserResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async assignRoles(userId: string, roleIds: string[]): Promise<AssignRolesResponse> {
    const url = buildUrl(`/api/v1/users/${encodeURIComponent(userId)}/roles`);
    return request<AssignRolesResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify({ role_ids: roleIds })
    });
  },

  async resetPassword(userId: string): Promise<ResetPasswordResponse> {
    const url = buildUrl(`/api/v1/users/${encodeURIComponent(userId)}/reset_password`);
    return request<ResetPasswordResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async freezeUser(userId: string): Promise<FreezeUserResponse> {
    const url = buildUrl(`/api/v1/users/${encodeURIComponent(userId)}/freeze`);
    return request<FreezeUserResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async activateUser(userId: string): Promise<FreezeUserResponse> {
    const url = buildUrl(`/api/v1/users/${encodeURIComponent(userId)}/activate`);
    return request<FreezeUserResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async exportUsers(filters?: UserFilters): Promise<ExportResponse> {
    const url = buildUrl('/api/v1/exports/users');
    return request<ExportResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(filters || {})
    });
  }
};

export const RolesService = {
  async listRoles(): Promise<RoleListResponse> {
    const url = buildUrl('/api/v1/roles');
    return request<RoleListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getRoleDetail(roleId: string): Promise<RoleDetail> {
    const url = buildUrl(`/api/v1/roles/${encodeURIComponent(roleId)}`);
    return request<RoleDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async exportRoles(): Promise<ExportResponse> {
    const url = buildUrl('/api/v1/exports/roles');
    return request<ExportResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify({})
    });
  }
};

export const PermissionsService = {
  async getPermissionTree(): Promise<PermissionTreeResponse> {
    const url = buildUrl('/api/v1/permissions/tree');
    return request<PermissionTreeResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  }
};
