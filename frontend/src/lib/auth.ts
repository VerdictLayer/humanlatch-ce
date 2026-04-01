const TOKEN_KEY = 'hl_token'
const WORKSPACE_KEY = 'hl_workspace'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(WORKSPACE_KEY)
}

export function getWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(WORKSPACE_KEY)
}

export function setWorkspaceId(id: string): void {
  localStorage.setItem(WORKSPACE_KEY, id)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
