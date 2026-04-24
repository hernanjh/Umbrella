import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import { Download, FileDown, Printer, BarChart2, Users, Package, FileText, Banknote, Wallet, CreditCard, CalendarDays, ListChecks } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'

type ReportType = 'sales-by-period' | 'sales-by-seller' | 'sales-by-client' | 'detailed-sales' | 'stock' | 'payments' | 'cash' | 'receivables' | 'payables' | 'overdue-installments'

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
      if (active === 'detailed-sales') return reportsService.detailedSales(params)
      if (active === 'payments') return reportsService.payments(params)
      if (active === 'cash') return reportsService.cash(params)
      if (active === 'receivables') return reportsService.receivables()
      if (active === 'payables') return reportsService.payables()
      if (active === 'overdue-installments') return reportsService.overdueInstallments()
      return reportsService.stock(params)
    }
  })

  const fmt = (n: any) => n == null ? '—' : `$ ${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const showDateFilters = active !== 'receivables' && active !== 'payables' && active !== 'overdue-installments'

  const handleExcelExport = async () => {
    try {
      const res = await reportsService.exportExcel(active, { dateFrom, dateTo })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `${active}-${format(new Date(), 'yyyyMMdd')}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al exportar') }
  }

  const handlePdfExport = async () => {
    try {
      const res = await reportsService.exportPdf(active, { dateFrom, dateTo })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `${active}-${format(new Date(), 'yyyyMMdd')}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al exportar PDF') }
  }

  const handlePrint = () => window.print()

  const TABS = [
    { key: 'sales-by-period' as const, label: 'Ventas por Período', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'sales-by-seller' as const, label: 'Ventas por Vendedor', icon: <Users className="w-4 h-4" /> },
    { key: 'sales-by-client' as const, label: 'Ventas por Cliente', icon: <FileText className="w-4 h-4" /> },
    { key: 'detailed-sales' as const, label: 'Ventas Detalladas', icon: <ListChecks className="w-4 h-4" /> },
    { key: 'stock' as const, label: 'Estado de Stock', icon: <Package className="w-4 h-4" /> },
    { key: 'payments' as const, label: 'Pagos', icon: <Banknote className="w-4 h-4" /> },
    { key: 'cash' as const, label: 'Caja', icon: <Wallet className="w-4 h-4" /> },
    { key: 'receivables' as const, label: 'Por Cobrar', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'payables' as const, label: 'Por Pagar', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'overdue-installments' as const, label: 'Cuotas Vencidas', icon: <CalendarDays className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Reportes"
        actions={
          <div className="flex gap-2 no-print">
            <button className="btn-secondary" onClick={handleExcelExport} title="Exportar a Excel"><Download className="w-4 h-4" /> Excel</button>
            <button className="btn-secondary" onClick={handlePdfExport} title="Exportar a PDF"><FileDown className="w-4 h-4" /> PDF</button>
            <button className="btn-secondary" onClick={handlePrint} title="Imprimir con gráficos"><Printer className="w-4 h-4" /> Imprimir</button>
          </div>
        } />

      {/* Tabs - wrapping grid to avoid horizontal overflow */}
      <div className="card p-2 no-print">
        <div className="flex flex-wrap gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActive(t.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${ active === t.key ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' }`}>
              {t.icon}<span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showDateFilters && (
        <div className="card p-4 flex items-center gap-4 flex-wrap">
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
      )}

      {/* Content */}
      <div className="card p-5">
        {isLoading && <div className="text-center py-12 text-gray-400">Cargando reporte...</div>}

        {!isLoading && active === 'sales-by-period' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {!isLoading && active === 'detailed-sales' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xl font-bold text-blue-700">{data.invoiceCount}</p>
                <p className="text-xs text-gray-500 mt-1">Facturas</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <p className="text-xl font-bold text-indigo-700">{data.itemCount}</p>
                <p className="text-xs text-gray-500 mt-1">Ítems</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-xl font-bold text-green-700">{fmt(data.totalAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">Total facturado</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-xl font-bold text-amber-700">{fmt(data.totalBalanceDue)}</p>
                <p className="text-xs text-gray-500 mt-1">Saldo pendiente</p>
              </div>
            </div>
            <div className="table-container">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Fecha</th><th>Factura</th><th>Cliente</th><th>Zona</th><th>Vendedor</th>
                    <th>Producto</th><th>Marca</th><th className="text-right">Cant.</th>
                    <th className="text-right">P. unit.</th><th className="text-right">Total</th>
                    <th>Cuotas</th><th>Vencidas</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items ?? []).map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td>{format(new Date(it.invoiceDate), 'dd/MM/yy')}</td>
                      <td className="font-mono">{it.invoiceFullNumber}</td>
                      <td>{it.clientName}</td>
                      <td>{it.zoneName ?? '—'}</td>
                      <td>{it.sellerName ?? '—'}</td>
                      <td>{it.productName}</td>
                      <td className="text-gray-500">{it.brand ?? '—'}</td>
                      <td className="text-right font-mono">{it.quantity} {it.unit}</td>
                      <td className="text-right font-mono">{fmt(it.unitPrice)}</td>
                      <td className="text-right font-mono font-semibold">{fmt(it.lineTotal)}</td>
                      <td>{it.hasInstallmentPlan ? <span className="badge-blue">{it.numberOfInstallments} ({it.installmentFrequency})</span> : <span className="text-gray-400">—</span>}</td>
                      <td>{(it.overdueInstallmentCount ?? 0) > 0
                        ? <span className="text-red-600 font-semibold">{it.overdueInstallmentCount} · {fmt(it.overdueInstallmentAmount)}</span>
                        : <span className="text-gray-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && active === 'stock' && data && (
          <table className="table"><thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo Promedio</th><th>Valor Total</th><th>Alerta</th></tr></thead>
            <tbody>{(data.items ?? []).map((i: any) => <tr key={i.productId}><td className="font-mono">{i.productCode}</td><td>{i.productName}</td><td>{i.categoryName}</td><td>{i.totalStock}</td><td>$ {i.averagePurchasePrice?.toLocaleString()}</td><td>$ {i.totalValue?.toLocaleString()}</td><td>{i.belowMinimum ? <span className="badge-red">Bajo mínimo</span> : <span className="badge-green">OK</span>}</td></tr>)}</tbody>
          </table>
        )}

        {!isLoading && active === 'payments' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-2xl font-bold text-green-700">{fmt(data.totalReceived)}</p>
                <p className="text-sm text-gray-500 mt-1">Cobrado</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-2xl font-bold text-red-700">{fmt(data.totalPaid)}</p>
                <p className="text-sm text-gray-500 mt-1">Pagado</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-700">{fmt(data.netFlow)}</p>
                <p className="text-sm text-gray-500 mt-1">Flujo neto</p>
              </div>
            </div>
            <table className="table">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Contraparte</th><th>Comprobante</th><th>Forma</th><th>Ref.</th><th className="text-right">Monto</th></tr></thead>
              <tbody>{(data.items ?? []).map((i: any) => (
                <tr key={`${i.kind}-${i.paymentId}`}>
                  <td className="text-xs">{format(new Date(i.paymentDate), 'dd/MM/yyyy')}</td>
                  <td><span className={`badge-${i.kind === 'sales' ? 'green' : 'red'}`}>{i.kind === 'sales' ? 'Cobro' : 'Pago'}</span></td>
                  <td>{i.partyName}</td>
                  <td className="font-mono text-xs">{i.invoiceFullNumber}</td>
                  <td>{i.paymentMethodName}{i.affectsCash ? <span className="text-xs text-gray-500 ml-1">(caja)</span> : null}</td>
                  <td className="text-gray-500 text-xs">{i.reference ?? ''}</td>
                  <td className={`text-right font-mono ${i.kind === 'sales' ? 'text-green-700' : 'text-red-600'}`}>{i.kind === 'sales' ? '+' : '-'} {fmt(i.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {!isLoading && active === 'cash' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-2xl font-bold text-green-700">{fmt(data.totalIncome)}</p>
                <p className="text-sm text-gray-500 mt-1">Ingresos</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-2xl font-bold text-red-700">{fmt(data.totalExpense)}</p>
                <p className="text-sm text-gray-500 mt-1">Egresos</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-700">{fmt(data.netFlow)}</p>
                <p className="text-sm text-gray-500 mt-1">Flujo neto</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'dd/MM')} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div>
              <h4 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">Por forma de pago</h4>
              <table className="table"><thead><tr><th>Forma de pago</th><th className="text-right">Ingresos</th><th className="text-right">Egresos</th></tr></thead>
                <tbody>{(data.byPaymentMethod ?? []).map((p: any, idx: number) => (
                  <tr key={idx}><td>{p.paymentMethodName}</td><td className="text-right font-mono text-green-700">{fmt(p.income)}</td><td className="text-right font-mono text-red-600">{fmt(p.expense)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && active === 'receivables' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-2xl font-bold text-amber-700">{fmt(data.totalDue)}</p>
                <p className="text-sm text-gray-500 mt-1">Total por cobrar</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-2xl font-bold text-red-700">{fmt(data.totalOverdue)}</p>
                <p className="text-sm text-gray-500 mt-1">Vencido</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-700">{data.clientCount}</p>
                <p className="text-sm text-gray-500 mt-1">Clientes</p>
              </div>
            </div>
            <table className="table"><thead><tr><th>Cliente</th><th>CUIT</th><th className="text-right">Al día</th><th className="text-right">Vencido</th><th className="text-right">Total</th></tr></thead>
              <tbody>{(data.items ?? []).map((c: any) => (
                <tr key={c.clientId}><td>{c.clientName}</td><td>{c.cuit}</td><td className="text-right font-mono">{fmt(c.pendingAmount)}</td><td className={`text-right font-mono ${c.overdueAmount > 0 ? 'text-red-600 font-semibold' : ''}`}>{fmt(c.overdueAmount)}</td><td className="text-right font-mono font-bold">{fmt(c.totalDue)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {!isLoading && active === 'overdue-installments' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-2xl font-bold text-red-700">{data.count}</p>
                <p className="text-sm text-gray-500 mt-1">Cuotas vencidas</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-2xl font-bold text-amber-700">{fmt(data.totalOverdueAmount)}</p>
                <p className="text-sm text-gray-500 mt-1">Total vencido</p>
              </div>
            </div>
            <table className="table">
              <thead><tr><th>Factura</th><th>Cliente</th><th>Teléfono</th><th>Cuota</th><th>Vencimiento</th><th className="text-right">Días vencida</th><th className="text-right">Monto</th><th className="text-right">Saldo</th></tr></thead>
              <tbody>
                {(data.items ?? []).map((i: any) => (
                  <tr key={i.installmentId}>
                    <td className="font-mono text-xs">{i.invoiceFullNumber}</td>
                    <td>{i.clientName}</td>
                    <td className="text-gray-500">{i.clientPhone ?? '—'}</td>
                    <td className="font-mono">{i.sequenceNumber}/{i.numberOfInstallments}</td>
                    <td>{format(new Date(i.dueDate), 'dd/MM/yyyy')}</td>
                    <td className="text-right font-mono text-red-600 font-semibold">{i.daysOverdue}</td>
                    <td className="text-right font-mono">{fmt(i.amount)}</td>
                    <td className="text-right font-mono font-bold text-red-600">{fmt(i.balanceDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && active === 'payables' && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-2xl font-bold text-amber-700">{fmt(data.totalDue)}</p>
                <p className="text-sm text-gray-500 mt-1">Total por pagar</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-2xl font-bold text-red-700">{fmt(data.totalOverdue)}</p>
                <p className="text-sm text-gray-500 mt-1">Vencido</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-700">{data.supplierCount}</p>
                <p className="text-sm text-gray-500 mt-1">Proveedores</p>
              </div>
            </div>
            <table className="table"><thead><tr><th>Proveedor</th><th>CUIT</th><th className="text-right">Al día</th><th className="text-right">Vencido</th><th className="text-right">Total</th></tr></thead>
              <tbody>{(data.items ?? []).map((s: any) => (
                <tr key={s.supplierId}><td>{s.supplierName}</td><td>{s.cuit}</td><td className="text-right font-mono">{fmt(s.pendingAmount)}</td><td className={`text-right font-mono ${s.overdueAmount > 0 ? 'text-red-600 font-semibold' : ''}`}>{fmt(s.overdueAmount)}</td><td className="text-right font-mono font-bold">{fmt(s.totalDue)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
