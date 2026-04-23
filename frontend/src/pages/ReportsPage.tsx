import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import { Download, BarChart2, Users, Package, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'

type ReportType = 'sales-by-period' | 'sales-by-seller' | 'sales-by-client' | 'stock'

export default function ReportsPage() {
  const [active, setActive] = useState<ReportType>('sales-by-period')
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report', active, dateFrom, dateTo],
    queryFn: () => {
      const params = { dateFrom, dateTo }
      if (active === 'sales-by-period') return reportsService.salesByPeriod(params)
      if (active === 'sales-by-seller') return reportsService.salesBySeller(params)
      if (active === 'sales-by-client') return reportsService.salesByClient(params)
      return reportsService.stock(params)
    }
  })

  const handleExcelExport = async () => {
    try {
      const res = await reportsService.exportExcel(active, { dateFrom, dateTo })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `${active}-${format(new Date(), 'yyyyMMdd')}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al exportar') }
  }

  const TABS = [
    { key: 'sales-by-period' as const, label: 'Ventas por Período', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'sales-by-seller' as const, label: 'Ventas por Vendedor', icon: <Users className="w-4 h-4" /> },
    { key: 'sales-by-client' as const, label: 'Ventas por Cliente', icon: <FileText className="w-4 h-4" /> },
    { key: 'stock' as const, label: 'Estado de Stock', icon: <Package className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Reportes"
        actions={
          <button className="btn-secondary" onClick={handleExcelExport}><Download className="w-4 h-4" /> Exportar Excel</button>
        } />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${ active === t.key ? 'bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white' }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="label mb-0">Desde</label>
          <input type="date" className="input w-40" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="label mb-0">Hasta</label>
          <input type="date" className="input w-40" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn-primary btn-sm" onClick={() => refetch()}>Aplicar</button>
      </div>

      {/* Content */}
      <div className="card p-5">
        {isLoading && <div className="text-center py-12 text-gray-400">Cargando reporte...</div>}

        {!isLoading && active === 'sales-by-period' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-700">{data.totalInvoices}</p>
                <p className="text-sm text-gray-500 mt-1">Facturas</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-2xl font-bold text-green-700">$ {data.totalAmount?.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
                <p className="text-sm text-gray-500 mt-1">Total facturado</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-2xl font-bold text-purple-700">$ {data.vatAmount?.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
                <p className="text-sm text-gray-500 mt-1">IVA</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.items ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'dd/MM')} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`$ ${Number(v).toLocaleString()}`, 'Total']} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!isLoading && active === 'sales-by-seller' && data && (
          <table className="table"><thead><tr><th>Vendedor</th><th>Facturas</th><th>Clientes</th><th>Total</th></tr></thead>
            <tbody>{(data.sellers ?? []).map((s: any) => <tr key={s.sellerId}><td>{s.sellerName}</td><td>{s.invoiceCount}</td><td>{s.clientCount}</td><td>$ {s.totalAmount?.toLocaleString()}</td></tr>)}</tbody>
          </table>
        )}

        {!isLoading && active === 'sales-by-client' && data && (
          <table className="table"><thead><tr><th>Cliente</th><th>CUIT</th><th>Facturas</th><th>Total</th><th>Saldo</th></tr></thead>
            <tbody>{(data.clients ?? []).map((c: any) => <tr key={c.clientId}><td>{c.clientName}</td><td>{c.cuit}</td><td>{c.invoiceCount}</td><td>$ {c.totalAmount?.toLocaleString()}</td><td className={c.balanceDue > 0 ? 'text-red-600 font-semibold' : ''}>$ {c.balanceDue?.toLocaleString()}</td></tr>)}</tbody>
          </table>
        )}

        {!isLoading && active === 'stock' && data && (
          <table className="table"><thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo Promedio</th><th>Valor Total</th><th>Alerta</th></tr></thead>
            <tbody>{(data.items ?? []).map((i: any) => <tr key={i.productId}><td className="font-mono">{i.productCode}</td><td>{i.productName}</td><td>{i.categoryName}</td><td>{i.totalStock}</td><td>$ {i.averagePurchasePrice?.toLocaleString()}</td><td>$ {i.totalValue?.toLocaleString()}</td><td>{i.belowMinimum ? <span className="badge-red">Bajo mínimo</span> : <span className="badge-green">OK</span>}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
