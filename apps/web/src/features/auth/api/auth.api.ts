import type { AuthResponse, LoginRequest, RegisterRequest } from '@syncwrite/types'
import { api } from '../../../lib/axios'

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', body)
  return res.data
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/register', body)
  return res.data
}

export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/google', { idToken })
  return res.data
}
