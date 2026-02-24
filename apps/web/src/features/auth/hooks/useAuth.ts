import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login, register, googleAuth } from '../api/auth.api'
import { useAppStore } from '../../../store/useAppStore'
import type { LoginRequest, RegisterRequest } from '@syncwrite/types'

export function useLogin() {
  const setAuth = useAppStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: ({ token, user }) => {
      setAuth(user, token)
      navigate('/documents')
    },
  })
}

export function useRegister() {
  const setAuth = useAppStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: RegisterRequest) => register(body),
    onSuccess: ({ token, user }) => {
      setAuth(user, token)
      navigate('/documents')
    },
  })
}

export function useGoogleAuth() {
  const setAuth = useAppStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (idToken: string) => googleAuth(idToken),
    onSuccess: ({ token, user }) => {
      setAuth(user, token)
      navigate('/documents')
    },
  })
}

export function useLogout() {
  const clearAuth = useAppStore((s) => s.clearAuth)
  const navigate = useNavigate()
  return () => {
    clearAuth()
    navigate('/login')
  }
}
