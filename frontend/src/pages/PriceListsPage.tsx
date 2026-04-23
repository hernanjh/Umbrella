import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { priceListsService, productsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'

export default function PriceListsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({ currency: 'ARS' })

  const { data, isLoading, refetch } = useQuery({ queryKey: ['price-lists'], queryFn: () => priceListsService.getAll({ page: 1, pageSize: 100 }) })

  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id ? priceListsService.update(modal.data.id, d) : priceListsService.create(d),
    onSuccess: () => { toast.success('Lista guardada'); qc.invalidateQueries({ queryKey: ['price-lists'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({ mutationFn: priceListsService.delete, onSuccess: () => { toast.success('Eliminada'); qc.invalidateQueries({ queryKey: ['price-lists'] }) } })

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'currency', header: 'Moneda', width: '80px' },
    { key: 'itemCount', header: 'Productos', width: '100px' },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activa' : 'Inactiva'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Listas de Precios"
        actions={<button className="btn-primary" onClick={() => { setForm({ currency: 'ARS' }); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nueva Lista</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="listas-precios"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => navigate(`/price-lists/${row.id}`)}><Eye className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )} />
      </div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Lista' : 'Nueva Lista'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>Guardar</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Código</label><input className="input" value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Nombre</label><input className="input" value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Moneda</label><select className="input" value={form.currency ?? 'ARS'} onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))}><option>ARS</option><option>USD</option></select></div>
          <div className="form-group"><label className="label">Descripción</label><textarea className="input" rows={2} value={form.description ?? ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
