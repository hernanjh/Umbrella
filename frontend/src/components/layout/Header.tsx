import { Sun, Moon, ChevronDown, User, LogOut, Settings, Menu, PanelLeft, Building2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authService, paramsService } from '../../services'
import NotificationsDropdown from './NotificationsDropdown'

interface HeaderProps {
  onOpenSidebar: () => void
  onToggleCollapse: () => void
}

export default function Header({ onOpenSidebar, onToggleCollapse }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: paramsService.getBranding,
    staleTime: 60_000,
  })

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
    <header className="h-[60px] flex items-center justify-between px-3 sm:px-4 md:px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Hamburger — mobile only */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden btn-ghost p-2 rounded-lg flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex btn-ghost p-2 rounded-lg flex-shrink-0"
          aria-label="Colapsar menú"
          title="Colapsar menú"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded flex-shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {branding?.companyName || 'Umbrella ERP'}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate hidden sm:block leading-tight">
              Sistema de Gestión Comercial
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Dark mode toggle */}
        <button onClick={toggle} className="btn-ghost p-2 rounded-lg" aria-label="Cambiar tema">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2 sm:pl-2 sm:pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {user?.profilePhotoUrl
              ? <img src={user.profilePhotoUrl} className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            }
            <div className="text-left hidden lg:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{user?.roles?.[0]}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 card py-1 z-50 shadow-lg">
              <div className="lg:hidden px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.roles?.[0]}</div>
              </div>
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
