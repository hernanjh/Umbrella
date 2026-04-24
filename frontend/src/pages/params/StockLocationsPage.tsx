import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'

export default function StockLocationsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({ type: 'warehouse' })
  const { data, isLoading, refetch } = useQuery({ queryKey: ['stock-locations'], queryFn: stockService.getLocations })
  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id ? stockService.updateLocation(modal.data.id, d) : stockService.createLocation(d),
    onSuccess: () => { toast.success('Guardado'); qc.invalidateQueries({ queryKey: ['stock-locations'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({ mutationFn: stockService.deleteLocation, onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['stock-locations'] }) }, onError: (e: any) => toast.error(e.response?.data?.message || 'No se puede eliminar') })
  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'type', header: 'Tipo' },
    { key: 'responsibleUserName', header: 'Responsable' },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activa' : 'Inactiva'}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="Locaciones de Stock" actions={<button className="btn-primary" onClick={() => { setForm({ type: 'warehouse' }); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nueva</button>} />
      <div className="card p-5"><DataGrid columns={columns} data={data ?? []} loading={isLoading} onRefresh={refetch} exportFileName="locaciones"
        actions={row => (<><button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button><button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button></>)} /></div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Locación' : 'Nueva Locación'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={() => saveMutation.mutate(form)}>Guardar</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Código</label><input className="input" value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Nombre</label><input className="input" value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group">
            <label className="label">Tipo</label>
            <select className="input" value={form.type ?? 'warehouse'} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}>
              <option value="warehouse">Depósito</option>
              <option value="seller">Vendedor</option>
              <option value="transit">Tránsito</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
          <div className="form-group"><label className="label">Descripción</label><textarea className="input" rows={2} value={form.description ?? ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
