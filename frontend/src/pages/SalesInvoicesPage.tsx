import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import { Plus, Eye, CheckCircle, XCircle, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { StatusBadge } from '../components/ui/Badge'
import { format } from 'date-fns'

export default function SalesInvoicesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({ queryKey: ['sales-invoices'], queryFn: () => salesService.getAll({ page: 1, pageSize: 500 }) })

  const confirmMutation = useMutation({ mutationFn: salesService.confirm, onSuccess: () => { toast.success('Factura confirmada'); qc.invalidateQueries({ queryKey: ['sales-invoices'] }) }, onError: (e: any) => toast.error(e.response?.data?.message || 'Error') })
  const cancelMutation = useMutation({
    mutationFn: salesService.cancel,
    onSuccess: () => { toast.success('Factura anulada'); qc.invalidateQueries({ queryKey: ['sales-invoices'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const downloadPdf = async (id: number, fullNumber: string) => {
    try {
      const res = await salesService.getPdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `factura-${fullNumber}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al descargar PDF') }
  }

  const columns: Column<any>[] = [
    { key: 'fullNumber', header: 'Número', width: '130px', render: r => <span className="font-mono text-xs">{r.fullNumber}</span> },
    { key: 'invoiceDate', header: 'Fecha', width: '100px', render: r => format(new Date(r.invoiceDate), 'dd/MM/yyyy') },
    { key: 'clientName', header: 'Cliente' },
    { key: 'sellerName', header: 'Vendedor' },
    { key: 'total', header: 'Total', render: r => `$ ${r.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
    { key: 'balanceDue', header: 'Saldo', render: r => `$ ${r.balanceDue?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
    { key: 'status', header: 'Estado', render: r => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Facturas de Venta" subtitle={`${data?.totalCount ?? 0} registros`}
        actions={<button className="btn-primary" onClick={() => navigate('/sales/new')}><Plus className="w-4 h-4" /> Nueva Factura</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="facturas-venta"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" title="Ver" onClick={() => navigate(`/sales/${row.id}`)}><Eye className="w-3.5 h-3.5" /></button>
              {row.status !== 'draft' && <button className="btn-ghost btn-sm p-1" title="PDF" onClick={() => downloadPdf(row.id, row.fullNumber)}><FileDown className="w-3.5 h-3.5" /></button>}
              {row.status === 'draft' && <button className="btn-ghost btn-sm p-1 text-green-600" title="Confirmar" onClick={() => confirmMutation.mutate(row.id)}><CheckCircle className="w-3.5 h-3.5" /></button>}
              {row.status !== 'cancelled' && row.status !== 'draft' && <button className="btn-ghost btn-sm p-1 text-red-500" title="Anular" onClick={() => { if (confirm('¿Anular esta factura?')) cancelMutation.mutate(row.id) }}><XCircle className="w-3.5 h-3.5" /></button>}
            </>
          )} />
      </div>
    </div>
  )
}
