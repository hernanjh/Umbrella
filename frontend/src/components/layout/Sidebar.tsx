import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Truck, Package, FileText, ShoppingCart,
  BarChart2, Settings, ChevronDown, ChevronRight, Warehouse,
  List, Tag, MapPin, Receipt, ClipboardList, Building2
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface SidebarProps { collapsed: boolean; onToggle: () => void }

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    label: 'Ventas', icon: FileText, children: [
      { label: 'Facturas de Venta', to: '/sales' },
      { label: 'Listas de Precios', to: '/price-lists' },
    ]
  },
  {
    label: 'Compras', icon: ShoppingCart, children: [
      { label: 'Facturas de Compra', to: '/purchases' },
    ]
  },
  {
    label: 'Stock', icon: Warehouse, children: [
      { label: 'Estado de Stock', to: '/stock' },
      { label: 'Ajustes', to: '/stock/adjustments' },
      { label: 'Movimientos', to: '/stock/movements' },
    ]
  },
  { label: 'Clientes', icon: Users, to: '/clients' },
  { label: 'Proveedores', icon: Truck, to: '/suppliers' },
  { label: 'Productos', icon: Package, to: '/products' },
  { label: 'Reportes', icon: BarChart2, to: '/reports' },
  {
    label: 'Parametrización', icon: Settings, children: [
      { label: 'Config. General', to: '/params/system-config' },
      { label: 'Tipos de Cliente', to: '/params/client-types' },
      { label: 'Zonas', to: '/params/zones' },
      { label: 'Cond. de IVA', to: '/params/vat-conditions' },
      { label: 'Cond. de Pago', to: '/params/payment-conditions' },
      { label: 'Categorías', to: '/params/categories' },
      { label: 'Locaciones de Stock', to: '/params/stock-locations' },
    ]
  },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(['Ventas'])

  const toggleGroup = (label: string) =>
    setOpenGroups(g => g.includes(label) ? g.filter(x => x !== label) : [...g, label])

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
        {NAV.map(item => (
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
