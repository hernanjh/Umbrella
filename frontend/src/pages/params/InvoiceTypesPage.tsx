import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paramsService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import SearchAutocomplete from '../../components/ui/SearchAutocomplete'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'

const KINDS = [
  { id: 1, value: 'sales', label: 'Ventas' },
  { id: 2, value: 'purchase', label: 'Compras' },
]

export default function InvoiceTypesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({ kind: 'sales', isActive: true })
  const { data, isLoading, refetch } = useQuery({ queryKey: ['invoice-types'], queryFn: paramsService.getInvoiceTypes })

  const kindOption = (k: string) => {
    const f = KINDS.find(x => x.value === k)
    return f ? { id: f.id, label: f.label } : null
  }

  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id
      ? paramsService.updateInvoiceType(modal.data.id, { name: d.name, description: d.description, kind: d.kind, isActive: d.isActive ?? true })
      : paramsService.createInvoiceType({ code: d.code, name: d.name, description: d.description, kind: d.kind }),
    onSuccess: () => { toast.success('Guardado'); qc.invalidateQueries({ queryKey: ['invoice-types'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({
    mutationFn: paramsService.deleteInvoiceType,
    onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['invoice-types'] }) }
  })

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'kind', header: 'Tipo', render: r => r.kind === 'sales' ? 'Ventas' : 'Compras' },
    { key: 'description', header: 'Descripción' },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Tipos de Comprobante"
        actions={<button className="btn-primary" onClick={() => { setForm({ kind: 'sales', isActive: true }); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nuevo</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data ?? []} loading={isLoading} onRefresh={refetch} exportFileName="tipos-comprobante"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )} />
      </div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Tipo de Comprobante' : 'Nuevo Tipo de Comprobante'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>Guardar</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Código *</label><input className="input" value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} placeholder="A, B, C, X, NC-A..." /></div>
          <div className="form-group"><label className="label">Nombre *</label><input className="input" value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <SearchAutocomplete label="Aplica a" required value={kindOption(form.kind)}
            onChange={opt => setForm((f: any) => ({ ...f, kind: KINDS.find(k => k.id === opt?.id)?.value ?? 'sales' }))}
            onSearch={async (t) => KINDS.filter(k => k.label.toLowerCase().includes((t ?? '').toLowerCase()))} />
          <div className="form-group"><label className="label">Descripción</label><input className="input" value={form.description ?? ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
          {modal.data && (
            <div className="form-group flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={!!form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="isActive" className="label !mb-0">Activo</label>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
