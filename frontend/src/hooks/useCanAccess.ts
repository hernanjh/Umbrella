import { useAuthStore } from '../store/authStore'

/**
 * Returns access flags for the given module based on the current user's role permissions.
 * Admin always gets full access. Write implies read; delete implies delete (and write/read).
 */
export function useCanAccess(module: string) {
  const canAccess = useAuthStore(s => s.canAccess)
  return canAccess(module)
}
