import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useEffect, useState } from 'react'

export default function Layout() {
  // Desktop: collapsed (icons only) vs expanded
  const [collapsed, setCollapsed] = useState(false)
  // Mobile: whether the off-canvas sidebar is currently open
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Auto-close the mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Close on Escape while the mobile sidebar is open
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggle={() => setCollapsed(c => !c)}
      />

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          onOpenSidebar={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
