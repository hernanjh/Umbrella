import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import DataGrid, { Column } from '../components/ui/DataGrid'
import { Wallet, AlertTriangle } from 'lucide-react'

export default function PayablesPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['payables'], queryFn: reportsService.payables })
  const fmt = (n: any) => n == null ? '—' : `$ ${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  const columns: Column<any>[] = [
    { key: 'supplierCode', header: 'Código', width: '90px' },
    { key: 'supplierName', header: 'Proveedor' },
    { key: 'cuit', header: 'CUIT' },
    { key: 'pendingAmount', header: 'Al día', render: r => <span className="font-mono">{fmt(r.pendingAmount)}</span> },
    { key: 'overdueAmount', header: 'Vencido', render: r => <span className={`font-mono ${+r.overdueAmount > 0 ? 'text-red-600 font-semibold' : ''}`}>{fmt(r.overdueAmount)}</span> },
    { key: 'totalDue', header: 'Total deuda', render: r => <span className="font-mono font-bold">{fmt(r.totalDue)}</span> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Cuentas por Pagar" subtitle={`${data?.supplierCount ?? 0} proveedores con saldo`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500 flex items-center gap-1"><Wallet className="w-4 h-4" /> Total a pagar</div>
          <div className="text-2xl font-bold">{fmt(data?.totalDue ?? 0)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-600" /> Vencido</div>
          <div className="text-2xl font-bold text-red-600">{fmt(data?.totalOverdue ?? 0)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Proveedores</div>
          <div className="text-2xl font-bold">{data?.supplierCount ?? 0}</div>
        </div>
      </div>

      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="cuentas-por-pagar" />
      </div>
    </div>
  )
}
