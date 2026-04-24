import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { installmentPlansService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import DataGrid, { Column } from '../components/ui/DataGrid'
import Badge from '../components/ui/Badge'
import { Eye, CalendarDays, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

const FREQ_LABEL: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }

export default function InstallmentPlansPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'active' | 'completed' | ''>('')
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['installment-plans', status],
    queryFn: () => installmentPlansService.getAll(status || undefined),
  })

  const fmt = (n: any) => `$ ${(+(n ?? 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '140px' },
    { key: 'invoiceFullNumber', header: 'Factura', width: '130px' },
    { key: 'clientName', header: 'Cliente' },
    { key: 'frequency', header: 'Frecuencia', render: r => FREQ_LABEL[r.frequency] ?? r.frequency },
    { key: 'numberOfInstallments', header: 'Cuotas', render: r => <span className="font-mono">{r.numberOfInstallments}</span> },
    { key: 'totalAmount', header: 'Total', render: r => <span className="font-mono">{fmt(r.totalAmount)}</span> },
    { key: 'balanceDue', header: 'Saldo', render: r => <span className="font-mono font-semibold">{fmt(r.balanceDue)}</span> },
    {
      key: 'overdueCount', header: 'Vencidas',
      render: r => r.overdueCount > 0
        ? <span className="text-red-600 font-semibold inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{r.overdueCount} · {fmt(r.overdueAmount)}</span>
        : <span className="text-gray-400">—</span>
    },
    { key: 'nextDueDate', header: 'Próxima', render: r => r.nextDueDate ? format(new Date(r.nextDueDate), 'dd/MM/yyyy') : '—' },
    { key: 'status', header: 'Estado', render: r => <Badge variant={r.status === 'completed' ? 'green' : 'blue'}>{r.status === 'completed' ? 'Completado' : 'Activo'}</Badge> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Planes de Pago" subtitle={`${data?.length ?? 0} planes`} />

      <div className="card p-5">
        <DataGrid columns={columns} data={data ?? []} loading={isLoading} onRefresh={refetch} exportFileName="planes-pago"
          toolbar={
            <select className="input h-9 text-sm ml-2 w-32" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="completed">Completados</option>
            </select>
          }
          actions={(row: any) => (
            <button className="btn-ghost btn-sm p-1" title="Ver factura" onClick={() => navigate(`/sales/${row.salesInvoiceId}`)}>
              <Eye className="w-3.5 h-3.5" />
            </button>
          )} />
      </div>
    </div>
  )
}
