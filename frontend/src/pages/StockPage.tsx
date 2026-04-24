import { useQuery } from '@tanstack/react-query'
import { stockService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import { Warehouse, AlertTriangle } from 'lucide-react'

export default function StockPage() {
  const { data: stock, isLoading, refetch } = useQuery({ queryKey: ['stock'], queryFn: () => stockService.getStatus() })

  const columns: Column<any>[] = [
    { key: 'productCode', header: 'Código', width: '100px' },
    { key: 'productName', header: 'Producto' },
    { key: 'totalStock', header: 'Stock Total', render: r => (
      <span className={r.totalStock <= 0 ? 'text-red-600 font-bold' : r.belowMinimum ? 'text-yellow-600 font-semibold' : 'text-green-700 font-medium'}>
        {r.totalStock}
      </span>
    )},
    { key: 'minimumStock', header: 'Mínimo' },
    { key: 'belowMinimum', header: 'Alerta', render: r => r.belowMinimum ? <span className="badge-red flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Bajo mínimo</span> : <span className="badge-green">OK</span> },
    { key: 'byLocation', header: 'Por Locación', render: r => (
      <div className="space-y-0.5">
        {(r.byLocation ?? []).map((loc: any) => (
          <div key={loc.locationId} className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{loc.locationName}:</span> {loc.quantity}
          </div>
        ))}
      </div>
    )},
  ]

  const items = (stock ?? []).map((s: any) => ({ ...s, id: s.productId }))
  const below = items.filter((i: any) => i.belowMinimum).length

  return (
    <div>
      <PageHeader title="Estado de Stock" subtitle={below > 0 ? `${below} producto(s) bajo mínimo` : 'Todo el stock en nivel correcto'} />
      {below > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {below} producto(s) por debajo del stock mínimo. Revise y realice los pedidos de compra correspondientes.
        </div>
      )}
      <div className="card p-5">
        <DataGrid columns={columns} data={items} loading={isLoading} onRefresh={refetch} exportFileName="stock" />
      </div>
    </div>
  )
}
