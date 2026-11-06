import { create } from 'zustand'
import { clearAuth, getUser, saveToken, saveUser, type AuthUser } from '@/lib/auth'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getUser(),
  isAuthenticated: !!getUser(),
  login: (token, user) => {
    saveToken(token)
    saveUser(user)
    set({ user, isAuthenticated: true })
  },
  logout: () => {
    clearAuth()
    set({ user: null, isAuthenticated: false })
  },
}))