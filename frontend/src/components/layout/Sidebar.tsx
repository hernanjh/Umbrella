import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Truck, Package, FileText, ShoppingCart,
  BarChart2, Settings, ChevronDown, ChevronRight, Warehouse,
  Building2, Shield, Wallet
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'

interface SidebarProps { collapsed: boolean; onToggle: () => void }

type NavChild = { label: string; to: string; module?: string }
type NavItem = { label: string; icon: any; to?: string; module?: string; children?: NavChild[] }

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    label: 'Ventas', icon: FileText, children: [
      { label: 'Facturas de Venta', to: '/sales', module: 'sales' },
      { label: 'Listas de Precios', to: '/price-lists', module: 'pricelists' },
    ]
  },
  {
    label: 'Compras', icon: ShoppingCart, children: [
      { label: 'Facturas de Compra', to: '/purchases', module: 'purchases' },
    ]
  },
  {
    label: 'Stock', icon: Warehouse, children: [
      { label: 'Estado de Stock', to: '/stock', module: 'stock' },
      { label: 'Ajustes', to: '/stock/adjustments', module: 'stock' },
      { label: 'Movimientos', to: '/stock/movements', module: 'stock' },
    ]
  },
  {
    label: 'Finanzas', icon: Wallet, children: [
      { label: 'Caja', to: '/cash', module: 'cash' },
      { label: 'Histórico de Caja', to: '/cash/sessions', module: 'cash' },
      { label: 'Cuentas por Cobrar', to: '/receivables', module: 'receivables' },
      { label: 'Cuentas por Pagar', to: '/payables', module: 'payables' },
      { label: 'Planes de Pago', to: '/installment-plans', module: 'receivables' },
      { label: 'Cobros del día', to: '/daily-collections', module: 'receivables' },
    ]
  },
  { label: 'Clientes', icon: Users, to: '/clients', module: 'clients' },
  { label: 'Proveedores', icon: Truck, to: '/suppliers', module: 'suppliers' },
  { label: 'Productos', icon: Package, to: '/products', module: 'products' },
  { label: 'Reportes', icon: BarChart2, to: '/reports', module: 'reports' },
  {
    label: 'Seguridad', icon: Shield, children: [
      { label: 'Usuarios', to: '/security/users', module: 'security' },
      { label: 'Roles', to: '/security/roles', module: 'security' },
    ]
  },
  {
    label: 'Parametrización', icon: Settings, children: [
      { label: 'Config. General', to: '/params/system-config', module: 'params' },
      { label: 'Tipos de Cliente', to: '/params/client-types', module: 'params' },
      { label: 'Zonas', to: '/params/zones', module: 'params' },
      { label: 'Cond. de IVA', to: '/params/vat-conditions', module: 'params' },
      { label: 'Cond. de Pago', to: '/params/payment-conditions', module: 'params' },
      { label: 'Formas de Pago', to: '/params/payment-methods', module: 'params' },
      { label: 'Tipos de Comprobante', to: '/params/invoice-types', module: 'params' },
      { label: 'Categorías', to: '/params/categories', module: 'params' },
      { label: 'Locaciones de Stock', to: '/params/stock-locations', module: 'params' },
    ]
  },
]

export default function Sidebar({ collapsed }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(['Ventas', 'Finanzas'])
  const hasPermission = useAuthStore(s => s.hasPermission)
  const isAdmin = useAuthStore(s => s.isAdmin)

  const toggleGroup = (label: string) =>
    setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label])

  const visibleItems = NAV.map(item => {
    if (isAdmin()) return item
    if (item.to) {
      if (!item.module || hasPermission(item.module, 'read')) return item
      return null
    }
    const allowedChildren = (item.children ?? []).filter(c => !c.module || hasPermission(c.module, 'read'))
    if (allowedChildren.length === 0) return null
    return { ...item, children: allowedChildren }
  }).filter((x): x is NavItem => x !== null)

  return (
    <aside className={clsx(
      'flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-20',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700 h-[60px]">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-gray-900 dark:text-white text-lg">Umbrella ERP</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(item => (
          item.to ? (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ) : (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className="sidebar-item w-full justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && (
                  openGroups.includes(item.label)
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRight className="w-3 h-3" />
                )}
              </button>
              {!collapsed && openGroups.includes(item.label) && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.children!.map(child => (
                    <NavLink key={child.to} to={child.to}
                      className={({ isActive }) => clsx('sidebar-item text-xs', isActive && 'active')}>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </nav>
    </aside>
  )
}
