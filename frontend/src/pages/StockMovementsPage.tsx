import { useQuery } from '@tanstack/react-query'
import { stockService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import { format } from 'date-fns'

const MOVEMENT_LABEL: Record<string, string> = {
  Sale: 'Venta',
  Purchase: 'Compra',
  Adjustment: 'Ajuste',
  Transfer: 'Transferencia',
  SaleCancelled: 'Venta anulada',
  PurchaseCancelled: 'Compra anulada',
}
const MOVEMENT_COLOR: Record<string, string> = {
  Sale: 'badge-red',
  Purchase: 'badge-green',
  Adjustment: 'badge-yellow',
  Transfer: 'badge-blue',
  SaleCancelled: 'badge-gray',
  PurchaseCancelled: 'badge-gray',
}
const REFERENCE_LABEL: Record<string, string> = {
  SalesInvoice: 'Factura de venta',
  PurchaseInvoice: 'Factura de compra',
  StockAdjustment: 'Ajuste de stock',
  SalesPayment: 'Pago de venta',
  PurchasePayment: 'Pago de compra',
}

export default function StockMovementsPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['stock-movements'], queryFn: () => stockService.getMovements({ page: 1, pageSize: 500 }) })

  const columns: Column<any>[] = [
    { key: 'createdAt', header: 'Fecha', width: '120px', render: r => format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm') },
    { key: 'productName', header: 'Producto' },
    { key: 'locationName', header: 'Locación' },
    {
      key: 'movementType', header: 'Tipo',
      render: r => <span className={MOVEMENT_COLOR[r.movementType] ?? 'badge-gray'}>{MOVEMENT_LABEL[r.movementType] ?? r.movementType}</span>
    },
    { key: 'quantity', header: 'Cantidad', render: r => <span className={r.quantity >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{r.quantity >= 0 ? '+' : ''}{r.quantity}</span> },
    { key: 'stockBefore', header: 'Antes', width: '80px' },
    { key: 'stockAfter', header: 'Después', width: '80px' },
    {
      key: 'referenceType', header: 'Referencia',
      render: r => r.referenceType ? `${REFERENCE_LABEL[r.referenceType] ?? r.referenceType} #${r.referenceId}` : '—'
    },
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
