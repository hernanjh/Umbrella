import { Bell, Sun, Moon, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { authService } from '../../services'
import clsx from 'clsx'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await authService.logout().catch(() => {})
    logout()
    navigate('/login')
  }

  return (
    <header className="h-[60px] flex items-center justify-between px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="text-sm text-gray-500 dark:text-gray-400">Sistema de Gestión Comercial</div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button onClick={toggle} className="btn-ghost p-2 rounded-lg">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="btn-ghost p-2 rounded-lg relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {user?.profilePhotoUrl
              ? <img src={user.profilePhotoUrl} className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            }
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{user?.roles?.[0]}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 card py-1 z-50 shadow-lg">
              <button onClick={() => { navigate('/profile'); setMenuOpen(false) }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                <User className="w-4 h-4" /> Mi Perfil
              </button>
              <button onClick={() => { navigate('/params/system-config'); setMenuOpen(false) }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                <Settings className="w-4 h-4" /> Configuración
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
