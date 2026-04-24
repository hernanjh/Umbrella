import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AccessLevel = 'none' | 'read' | 'write' | 'delete'

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
  zoneId?: number | null
  zoneName?: string | null
  isSeller?: boolean
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: UserProfile | null
  setAuth: (token: string, refreshToken: string, user: UserProfile) => void
  setUser: (user: UserProfile) => void
  logout: () => void
  isAdmin: () => boolean
  hasPermission: (module: string, level: 'read' | 'write' | 'delete') => boolean
  canAccess: (module: string) => { read: boolean; write: boolean; delete: boolean }
}

const levelIncludes = (granted: string[], module: string, level: string) =>
  granted.includes(`${module}:${level}`) || granted.includes(`*:${level}`)

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    token: null,
    refreshToken: null,
    user: null,
    setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
    setUser: (user) => set({ user }),
    logout: () => set({ token: null, refreshToken: null, user: null }),
    isAdmin: () => {
      const { user } = get()
      return !!user && user.roles.includes('Administrador')
    },
    hasPermission: (module, level) => {
      const { user } = get()
      if (!user) return false
      if (user.roles.includes('Administrador')) return true
      const perms = user.permissions ?? []
      if (level === 'read') {
        // write/delete implies read
        return levelIncludes(perms, module, 'read') || levelIncludes(perms, module, 'write') || levelIncludes(perms, module, 'delete')
      }
      if (level === 'write') {
        return levelIncludes(perms, module, 'write') || levelIncludes(perms, module, 'delete')
      }
      return levelIncludes(perms, module, 'delete')
    },
    canAccess: (module) => {
      const has = get().hasPermission
      return { read: has(module, 'read'), write: has(module, 'write'), delete: has(module, 'delete') }
    },
  }),
  { name: 'erp-auth' }
))
