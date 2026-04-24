import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService, paramsService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import { Download, FileDown, Printer, AlertTriangle, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export default function DailyCollectionsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const user = useAuthStore(s => s.user)
  const [date, setDate] = useState(today)
  const [zoneId, setZoneId] = useState<number | ''>('')

  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: paramsService.getZones })

  // Sellers get locked to their zone — disable the selector in that case
  const isSeller = !!user?.isSeller && !user?.roles.includes('Administrador')
  const effectiveZone = isSeller ? (user?.zoneId ?? null) : (zoneId === '' ? null : zoneId)

  const { data, isLoading } = useQuery({
    queryKey: ['daily-collections', effectiveZone, date],
    queryFn: () => reportsService.dailyCollections({ zoneId: effectiveZone ?? undefined, date })
  })

  const fmt = (n: any) => `$ ${(+(n ?? 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  const exportExcel = async () => {
    try {
      const res = await reportsService.dailyCollectionsExcel({ zoneId: effectiveZone ?? undefined, date })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `cobros-${date}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al exportar') }
  }

  const exportPdf = async () => {
    try {
      const res = await reportsService.dailyCollectionsPdf({ zoneId: effectiveZone ?? undefined, date })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `cobros-${date}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al exportar PDF') }
  }

  return (
    <div className="space-y-5 daily-collections-page">
      <PageHeader
        title="Planilla de cobros del día"
        subtitle={data ? `${data.clientCount} clientes · ${fmt(data.totalToCollect)} a cobrar` : undefined}
        actions={
          <div className="flex gap-2 no-print">
            <button className="btn-secondary" onClick={exportExcel}><Download className="w-4 h-4" /> Excel</button>
            <button className="btn-secondary" onClick={exportPdf}><FileDown className="w-4 h-4" /> PDF</button>
            <button className="btn-primary" onClick={() => window.print()}><Printer className="w-4 h-4" /> Imprimir</button>
          </div>
        }
      />

      <div className="card p-4 flex items-end gap-4 flex-wrap no-print">
        <div>
          <label className="label mb-1">Fecha</label>
          <input type="date" className="input w-44" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label mb-1">Zona</label>
          <select className="input w-56" value={zoneId} onChange={e => setZoneId(e.target.value === '' ? '' : +e.target.value)} disabled={isSeller}>
            <option value="">Todas las zonas</option>
            {(zones ?? []).map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          {isSeller && <p className="text-xs text-gray-500 mt-1">Fijado a tu zona asignada</p>}
        </div>
      </div>

      {/* KPI strip for print too */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{fmt(data.totalToCollect)}</p>
            <p className="text-xs text-gray-500 mt-1">Total a cobrar</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{fmt(data.totalOverdue)}</p>
            <p className="text-xs text-gray-500 mt-1">Vencido</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{fmt(data.totalUpcoming)}</p>
            <p className="text-xs text-gray-500 mt-1">Próximos 7 días</p>
          </div>
        </div>
      )}

      <div className="print-header hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">PLANILLA DE COBROS DEL DÍA</h1>
        <p className="text-sm mt-1">Fecha: {format(new Date(date), 'dd/MM/yyyy')} {data?.zoneName ? `· Zona: ${data.zoneName}` : ''}</p>
      </div>

      <div className="card p-0 overflow-hidden print:shadow-none print:border-0">
        {isLoading && <div className="p-8 text-center text-gray-400">Cargando...</div>}
        {!isLoading && data && data.clients.length === 0 && (
          <div className="p-8 text-center text-gray-400">No hay cobros pendientes para la fecha y zona seleccionadas.</div>
        )}

        {(data?.clients ?? []).map((c: any) => (
          <div key={c.clientId} className="border-b border-gray-200 dark:border-gray-700 print:break-inside-avoid">
            {/* Client header row */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white">{c.businessName}</span>
                  <span className="text-xs text-gray-500 font-mono">{c.clientCode}</span>
                  {c.cuit && <span className="text-xs text-gray-500">CUIT: {c.cuit}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex gap-3 flex-wrap">
                  {c.address && <span>{c.address}</span>}
                  {c.city && <span>{c.city}</span>}
                  {c.phone && <span>Tel: {c.phone}</span>}
                  {!c.phone && c.mobile && <span>Cel: {c.mobile}</span>}
                  {c.assignedSellerName && <span>Vend: {c.assignedSellerName}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary-700">{fmt(c.totalToCollect)}</div>
                {c.overdueAmount > 0 && <div className="text-xs text-red-600 font-semibold">Vencido: {fmt(c.overdueAmount)}</div>}
              </div>
            </div>

            {/* Rows */}
            <table className="table text-xs">
              <thead className="bg-white dark:bg-gray-800">
                <tr>
                  <th className="w-28">Factura</th>
                  <th className="w-32">Cuota/Comp.</th>
                  <th className="w-24">Vencimiento</th>
                  <th className="w-16 text-right">Días</th>
                  <th className="w-28 text-right">Saldo</th>
                  <th className="w-28 print:w-32">Cobrado</th>
                  <th className="w-28 print:w-32">Forma pago</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {(c.overdueInstallments ?? []).map((i: any) => (
                  <tr key={`oi-${i.installmentId}`} className="bg-red-50/50 dark:bg-red-900/10">
                    <td className="font-mono">{i.invoiceFullNumber}</td>
                    <td>Cuota {i.sequenceNumber} ({i.planCode})</td>
                    <td>{format(new Date(i.dueDate), 'dd/MM/yyyy')}</td>
                    <td className="text-right font-mono text-red-600 font-semibold">
                      <AlertTriangle className="inline w-3 h-3 mr-1" />{i.daysOverdue}
                    </td>
                    <td className="text-right font-mono font-semibold">{fmt(i.balanceDue)}</td>
                    <td className="print-writeable"></td>
                    <td className="print-writeable"></td>
                    <td className="print-writeable"></td>
                  </tr>
                ))}
                {(c.unpaidInvoices ?? []).map((i: any) => (
                  <tr key={`inv-${i.invoiceId}`} className="bg-red-50/50 dark:bg-red-900/10">
                    <td className="font-mono">{i.fullNumber}</td>
                    <td className="italic">Factura vencida</td>
                    <td>{format(new Date(i.dueDate), 'dd/MM/yyyy')}</td>
                    <td className="text-right font-mono text-red-600 font-semibold">{i.daysOverdue}</td>
                    <td className="text-right font-mono font-semibold">{fmt(i.balanceDue)}</td>
                    <td className="print-writeable"></td>
                    <td className="print-writeable"></td>
                    <td className="print-writeable"></td>
                  </tr>
                ))}
                {(c.upcomingInstallments ?? []).map((i: any) => (
                  <tr key={`ui-${i.installmentId}`}>
                    <td className="font-mono">{i.invoiceFullNumber}</td>
                    <td>Cuota {i.sequenceNumber} ({i.planCode})</td>
                    <td>{format(new Date(i.dueDate), 'dd/MM/yyyy')}</td>
                    <td className="text-right text-gray-400">
                      <CalendarDays className="inline w-3 h-3 mr-1" />—
                    </td>
                    <td className="text-right font-mono">{fmt(i.balanceDue)}</td>
                    <td className="print-writeable"></td>
                    <td className="print-writeable"></td>
                    <td className="print-writeable"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {data && data.clients.length > 0 && (
          <div className="p-4 flex justify-end items-center gap-4 bg-gray-50 dark:bg-gray-800 font-semibold">
            <span className="text-sm">TOTAL GENERAL:</span>
            <span className="text-lg text-primary-700">{fmt(data.totalToCollect)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
