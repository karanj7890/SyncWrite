import axios from 'axios'
import { useAppStore } from '../store/useAppStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAppStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
