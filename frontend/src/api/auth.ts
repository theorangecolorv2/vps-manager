/**
 * Auth API
 */
import { apiRequest, setToken, removeToken } from './client'

interface LoginResponse {
  access_token: string
  token_type: string
}

export async function login(password: string): Promise<void> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { password },
    skipAuth: true,
  })
  setToken(response.access_token)
}

export function logout(): void {
  removeToken()
  window.location.href = '/login'
}
