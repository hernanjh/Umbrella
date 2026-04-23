import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cashService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import DataGrid, { Column } from '../components/ui/DataGrid'
import { ArrowLeft, Eye } from 'lucide-react'
import { format } from 'date-fns'
import Badge from '../components/ui/Badge'

export default function CashSessionsPage() {
  const navigate = useNavigate()
  const { data, isLoading, refetch } = useQuery({ queryKey: ['cash-sessions'], queryFn: () => cashService.getSessions() })

  const fmt = (n: number | null) => n == null ? '—' : `$ ${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código' },
    { key: 'openingDate', header: 'Apertura', render: r => format(new Date(r.openingDate), 'dd/MM/yyyy HH:mm') },
    { key: 'closingDate', header: 'Cierre', render: r => r.closingDate ? format(new Date(r.closingDate), 'dd/MM/yyyy HH:mm') : '—' },
    { key: 'openingBalance', header: 'Apertura $', render: r => fmt(r.openingBalance) },
    { key: 'expectedBalance', header: 'Esperado $', render: r => fmt(r.expectedBalance) },
    { key: 'countedBalance', header: 'Contado $', render: r => fmt(r.countedBalance) },
    { key: 'differenceAmount', header: 'Dif. $', render: r => r.differenceAmount == null ? '—' : <span className={+r.differenceAmount < 0 ? 'text-red-600' : +r.differenceAmount > 0 ? 'text-amber-700 dark:text-amber-400' : ''}>{fmt(r.differenceAmount)}</span> },
    { key: 'status', header: 'Estado', render: r => <Badge variant={r.status === 'open' ? 'green' : 'gray'}>{r.status === 'open' ? 'Abierta' : 'Cerrada'}</Badge> },
    { key: 'createdBy', header: 'Usuario' },
  ]

  return (
    <div>
      <PageHeader title="Histórico de Caja"
        actions={<button className="btn-secondary" onClick={() => navigate('/cash')}><ArrowLeft className="w-4 h-4" /> Caja actual</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data ?? []} loading={isLoading} onRefresh={refetch} exportFileName="sesiones-caja"
          actions={row => (<button className="btn-ghost btn-sm p-1" onClick={() => navigate(`/cash/sessions/${row.id}`)}><Eye className="w-3.5 h-3.5" /></button>)} />
      </div>
    </div>
  )
}
