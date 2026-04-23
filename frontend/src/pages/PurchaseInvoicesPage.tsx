import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchasesService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { StatusBadge } from '../components/ui/Badge'
import { format } from 'date-fns'

export default function PurchaseInvoicesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading, refetch } = useQuery({ queryKey: ['purchase-invoices'], queryFn: () => purchasesService.getAll({ page: 1, pageSize: 500 }) })
  const confirmMutation = useMutation({ mutationFn: purchasesService.confirm, onSuccess: () => { toast.success('Compra confirmada. Stock y precios actualizados.'); qc.invalidateQueries({ queryKey: ['purchase-invoices'] }) }, onError: (e: any) => toast.error(e.response?.data?.message || 'Error') })
  const cancelMutation = useMutation({ mutationFn: purchasesService.cancel, onSuccess: () => { toast.success('Cancelada'); qc.invalidateQueries({ queryKey: ['purchase-invoices'] }) } })

  const columns: Column<any>[] = [
    { key: 'fullNumber', header: 'Número', render: r => <span className="font-mono text-xs">{r.fullNumber}</span> },
    { key: 'supplierInvoiceNumber', header: 'Comp. Proveedor' },
    { key: 'invoiceDate', header: 'Fecha', render: r => format(new Date(r.invoiceDate), 'dd/MM/yyyy') },
    { key: 'supplierName', header: 'Proveedor' },
    { key: 'total', header: 'Total', render: r => `$ ${r.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
    { key: 'status', header: 'Estado', render: r => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Facturas de Compra" subtitle={`${data?.totalCount ?? 0} registros`}
        actions={<button className="btn-primary" onClick={() => navigate('/purchases/new')}><Plus className="w-4 h-4" /> Nueva Compra</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="facturas-compra"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" title="Ver" onClick={() => navigate(`/purchases/${row.id}`)}><Eye className="w-3.5 h-3.5" /></button>
              {row.status === 'draft' && <>
                <button className="btn-ghost btn-sm p-1 text-green-600" title="Confirmar" onClick={() => confirmMutation.mutate(row.id)}><CheckCircle className="w-3.5 h-3.5" /></button>
                <button className="btn-ghost btn-sm p-1 text-red-500" title="Cancelar" onClick={() => cancelMutation.mutate(row.id)}><XCircle className="w-3.5 h-3.5" /></button>
              </>}
            </>
          )} />
      </div>
    </div>
  )
}
