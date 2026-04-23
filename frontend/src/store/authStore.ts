import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserProfile {
  id: number
  code: string
  firstName: string
  lastName: string
  email: string
  profilePhotoUrl?: string
  theme: string
  phone?: string
  roles: string[]
  permissions: string[]
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: UserProfile | null
  setAuth: (token: string, refreshToken: string, user: UserProfile) => void
  setUser: (user: UserProfile) => void
  logout: () => void
  hasPermission: (module: string, action: string) => boolean
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    token: null,
    refreshToken: null,
    user: null,
    setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
    setUser: (user) => set({ user }),
    logout: () => set({ token: null, refreshToken: null, user: null }),
    hasPermission: (module, action) => {
      const { user } = get()
      if (!user) return false
      if (user.roles.includes('Administrador')) return true
      return user.permissions.includes(`${module}:${action}`)
    }
  }),
  { name: 'erp-auth' }
))
