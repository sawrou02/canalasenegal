import axios from 'axios'
import type { User, LoginResponse } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('sendistri-auth')
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { token?: string } }
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch {
    // ignore
  }
  return config
})

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return res.data
}

export const getMe = async (): Promise<User> => {
  const res = await apiClient.get<User>('/auth/me')
  return res.data
}

export const getDashboardStats = async () => {
  const res = await apiClient.get('/dashboard/stats')
  return res.data
}

// Generic CRUD helpers for referential resources
export const listResource = async <T>(path: string): Promise<T[]> => {
  const res = await apiClient.get<T[]>(path)
  return res.data
}

export const createResource = async <T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const res = await apiClient.post<T>(path, body)
  return res.data
}

export const updateResource = async <T>(
  path: string,
  id: string | number,
  body: Record<string, unknown>,
): Promise<T> => {
  const res = await apiClient.patch<T>(`${path}/${id}`, body)
  return res.data
}

export const deleteResource = async (
  path: string,
  id: string | number,
): Promise<void> => {
  await apiClient.delete(`${path}/${id}`)
}
