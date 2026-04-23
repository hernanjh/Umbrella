import { useQuery } from '@tanstack/react-query'
import { stockService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import { format } from 'date-fns'

export default function StockMovementsPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['stock-movements'], queryFn: () => stockService.getMovements({ page: 1, pageSize: 500 }) })

  const typeColor: Record<string, string> = { Sale: 'badge-red', Purchase: 'badge-green', Adjustment: 'badge-yellow', Transfer: 'badge-blue' }

  const columns: Column<any>[] = [
    { key: 'createdAt', header: 'Fecha', width: '120px', render: r => format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm') },
    { key: 'productName', header: 'Producto' },
    { key: 'locationName', header: 'Locación' },
    { key: 'movementType', header: 'Tipo', render: r => <span className={typeColor[r.movementType] ?? 'badge-gray'}>{r.movementType}</span> },
    { key: 'quantity', header: 'Cantidad', render: r => <span className={r.quantity >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{r.quantity >= 0 ? '+' : ''}{r.quantity}</span> },
    { key: 'stockBefore', header: 'Antes', width: '80px' },
    { key: 'stockAfter', header: 'Después', width: '80px' },
    { key: 'referenceType', header: 'Referencia', render: r => r.referenceType ? `${r.referenceType} #${r.referenceId}` : '-' },
    { key: 'createdBy', header: 'Usuario' },
  ]

  return (
    <div>
      <PageHeader title="Movimientos de Stock" subtitle={`${data?.totalCount ?? 0} movimientos`} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="movimientos-stock" />
      </div>
    </div>
  )
}
