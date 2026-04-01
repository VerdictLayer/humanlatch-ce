import { clearToken, getToken } from './auth'
import type { ActionProposal, ApiKey, ApiKeyCreated, AuditEvent, PolicyRule, ProposeActionResult, User, Workspace } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new ApiError(401, 'Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(res.status, body.detail || 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; full_name: string; turnstile_token?: string | null; company?: string }) =>
      request<{ access_token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (email: string, password: string) =>
      request<{ access_token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>('/api/auth/me'),
  },

  workspaces: {
    list: () => request<Workspace[]>('/api/workspaces/'),
    create: (data: { name: string; slug: string }) =>
      request<Workspace>('/api/workspaces/', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request<Workspace>(`/api/workspaces/${id}`),
  },

  apiKeys: {
    list: (workspaceId: string) =>
      request<ApiKey[]>(`/api/api-keys/?workspace_id=${workspaceId}`),
    create: (workspaceId: string, name: string) =>
      request<ApiKeyCreated>('/api/api-keys/', {
        method: 'POST',
        body: JSON.stringify({ workspace_id: workspaceId, name }),
      }),
    delete: (id: string, workspaceId: string) =>
      request<void>(`/api/api-keys/${id}?workspace_id=${workspaceId}`, { method: 'DELETE' }),
  },

  actions: {
    list: (workspaceId: string, params?: { status?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams({ workspace_id: workspaceId })
      if (params?.status) qs.set('status', params.status)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return request<ActionProposal[]>(`/api/v1/actions/?${qs}`)
    },
    get: (id: string, workspaceId: string) =>
      request<ActionProposal>(`/api/v1/actions/${id}?workspace_id=${workspaceId}`),
    propose: (workspaceId: string, data: object) =>
      request<ProposeActionResult>(`/api/v1/actions/propose?workspace_id=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: string, workspaceId: string, note?: string) =>
      request<ActionProposal>(`/api/v1/actions/${id}/approve?workspace_id=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    reject: (id: string, workspaceId: string, note: string) =>
      request<ActionProposal>(`/api/v1/actions/${id}/reject?workspace_id=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    cancel: (id: string, workspaceId: string) =>
      request<ActionProposal>(`/api/v1/actions/${id}/cancel?workspace_id=${workspaceId}`, {
        method: 'POST',
      }),
  },

  policies: {
    list: (workspaceId: string) =>
      request<PolicyRule[]>(`/api/v1/policies/?workspace_id=${workspaceId}`),
    create: (workspaceId: string, data: object) =>
      request<PolicyRule>('/api/v1/policies/', {
        method: 'POST',
        body: JSON.stringify({ ...data, workspace_id: workspaceId }),
      }),
    update: (id: string, workspaceId: string, data: object) =>
      request<PolicyRule>(`/api/v1/policies/${id}?workspace_id=${workspaceId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string, workspaceId: string) =>
      request<void>(`/api/v1/policies/${id}?workspace_id=${workspaceId}`, { method: 'DELETE' }),
  },

  audit: {
    list: (workspaceId: string, params?: { event_type?: string; limit?: number }) => {
      const qs = new URLSearchParams({ workspace_id: workspaceId })
      if (params?.event_type) qs.set('event_type', params.event_type)
      if (params?.limit) qs.set('limit', String(params.limit))
      return request<AuditEvent[]>(`/api/v1/audit-events/?${qs}`)
    },
  },
}

export { ApiError }
