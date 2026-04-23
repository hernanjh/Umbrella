import { useQuery } from '@tanstack/react-query'
import { salesService, purchasesService, stockService, clientsService, productsService } from '../services'
import StatCard from '../components/ui/StatCard'
import { FileText, ShoppingCart, Package, Users, TrendingUp, AlertTriangle, DollarSign, Warehouse } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const today = new Date()
  const from = format(subDays(today, 30), 'yyyy-MM-dd')
  const to = format(today, 'yyyy-MM-dd')

  const { data: salesReport } = useQuery({ queryKey: ['report-sales', from, to], queryFn: () => import('../services').then(m => m.reportsService.salesByPeriod({ dateFrom: from, dateTo: to })) })
  const { data: stockReport } = useQuery({ queryKey: ['report-stock'], queryFn: () => import('../services').then(m => m.reportsService.stock({ dateFrom: from, dateTo: to })) })
  const { data: salesList } = useQuery({ queryKey: ['sales-list'], queryFn: () => salesService.getAll({ page: 1, pageSize: 5 }) })
  const { data: clients } = useQuery({ queryKey: ['clients-count'], queryFn: () => clientsService.getAll({ page: 1, pageSize: 1 }) })
  const { data: products } = useQuery({ queryKey: ['products-count'], queryFn: () => productsService.getAll({ page: 1, pageSize: 1 }) })

  const belowMin = stockReport?.items?.filter((i: any) => i.belowMinimum) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Resumen de los últimos 30 días</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Ventas del período" value={`$ ${(salesReport?.totalAmount ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="w-6 h-6" />} color="green" />
        <StatCard title="Facturas emitidas" value={salesReport?.totalInvoices ?? 0} icon={<FileText className="w-6 h-6" />} color="blue" />
        <StatCard title="Clientes" value={clients?.totalCount ?? 0} icon={<Users className="w-6 h-6" />} color="purple" />
        <StatCard title="Productos" value={products?.totalCount ?? 0} icon={<Package className="w-6 h-6" />} color="yellow" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ventas diarias</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesReport?.items ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'dd/MM', { locale: es })} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`$ ${Number(v).toLocaleString()}`, 'Total']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Stock crítico</h3>
          {belowMin.length === 0
            ? <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No hay productos bajo mínimo</div>
            : <div className="space-y-2 max-h-52 overflow-y-auto">
                {belowMin.slice(0, 10).map((item: any) => (
                  <div key={item.productId} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                      <p className="text-xs text-gray-500">Mínimo: {item.minimumStock}</p>
                    </div>
                    <span className="badge-red">{item.totalStock}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Recent sales */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Facturas recientes</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {(salesList?.items ?? []).map((inv: any) => (
                <tr key={inv.id}>
                  <td className="font-mono">{inv.fullNumber}</td>
                  <td>{inv.clientName}</td>
                  <td>{format(new Date(inv.invoiceDate), 'dd/MM/yyyy')}</td>
                  <td>$ {inv.total.toLocaleString()}</td>
                  <td><span className="badge-blue">{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
