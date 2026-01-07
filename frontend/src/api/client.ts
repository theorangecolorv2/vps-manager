/**
 * API client with authentication
 */

// API is proxied through Caddy on same origin
// Only use localhost:8000 when actually running on localhost
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const API_BASE = import.meta.env.DEV && isLocalhost ? 'http://localhost:8000/api' : '/api'

// Token storage
const TOKEN_KEY = 'vps_manager_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

// API request helper
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  skipAuth?: boolean
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!skipAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Handle 401 - redirect to login
  if (response.status === 401) {
    removeToken()
    window.location.href = '/login'
    throw new ApiError(401, 'Unauthorized')
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  // Handle errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(response.status, error.detail || 'Request failed')
  }

  return response.json()
}
