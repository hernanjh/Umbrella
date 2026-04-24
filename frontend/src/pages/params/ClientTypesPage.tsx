import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paramsService, priceListsService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'

export default function ClientTypesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const { data, isLoading, refetch } = useQuery({ queryKey: ['client-types'], queryFn: paramsService.getClientTypes })
  const { data: priceLists } = useQuery({ queryKey: ['price-lists-all'], queryFn: () => priceListsService.getAll({ page: 1, pageSize: 200 }) })
  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id
      ? paramsService.updateClientType(modal.data.id, { name: d.name, description: d.description, isActive: d.isActive ?? true, defaultPriceListId: d.defaultPriceListId || null })
      : paramsService.createClientType({ code: d.code, name: d.name, description: d.description, defaultPriceListId: d.defaultPriceListId || null }),
    onSuccess: () => { toast.success('Guardado'); qc.invalidateQueries({ queryKey: ['client-types'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({ mutationFn: paramsService.deleteClientType, onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['client-types'] }) } })
  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'defaultPriceListName', header: 'Lista de Precios por defecto', render: r => r.defaultPriceListName ?? <span className="text-gray-400">—</span> },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="Tipos de Cliente" actions={<button className="btn-primary" onClick={() => { setForm({}); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nuevo</button>} />
      <div className="card p-5"><DataGrid columns={columns} data={data ?? []} loading={isLoading} onRefresh={refetch} exportFileName="tipos-cliente"
        actions={row => (<><button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button><button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button></>)} /></div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar' : 'Nuevo Tipo de Cliente'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={() => saveMutation.mutate(form)}>Guardar</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Código</label><input className="input" value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Nombre</label><input className="input" value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group">
            <label className="label">Lista de Precios por defecto</label>
            <select className="input" value={form.defaultPriceListId ?? ''} onChange={e => setForm((f: any) => ({ ...f, defaultPriceListId: e.target.value ? +e.target.value : null }))}>
              <option value="">— Sin lista —</option>
              {(priceLists?.items ?? []).map((pl: any) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Se usará como sugerencia al seleccionar un cliente de este tipo en una factura.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
