export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
}
