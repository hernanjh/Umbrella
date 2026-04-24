import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentMethodsService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../../components/ui/Badge'

const TYPES = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Otro' },
]

export default function PaymentMethodsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({ type: 'cash', affectsCash: true, isActive: true })
  const { data, isLoading, refetch } = useQuery({ queryKey: ['payment-methods', 'all'], queryFn: () => paymentMethodsService.getAll(true) })

  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id
      ? paymentMethodsService.update(modal.data.id, { name: d.name, type: d.type, affectsCash: !!d.affectsCash, isActive: !!d.isActive, notes: d.notes })
      : paymentMethodsService.create({ code: d.code, name: d.name, type: d.type, affectsCash: !!d.affectsCash, notes: d.notes }),
    onSuccess: () => { toast.success('Guardado'); qc.invalidateQueries({ queryKey: ['payment-methods'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({
    mutationFn: paymentMethodsService.delete,
    onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['payment-methods'] }) }
  })

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'type', header: 'Tipo', render: r => TYPES.find(t => t.value === r.type)?.label ?? r.type },
    { key: 'affectsCash', header: 'Afecta Caja', render: r => <Badge variant={r.affectsCash ? 'green' : 'gray'}>{r.affectsCash ? 'Sí' : 'No'}</Badge> },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Formas de Pago"
        actions={<button className="btn-primary" onClick={() => { setForm({ type: 'cash', affectsCash: true, isActive: true }); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nueva</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data ?? []} loading={isLoading} onRefresh={refetch} exportFileName="formas-pago"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => { setForm({ ...row }); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )} />
      </div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>Guardar</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Código</label><input className="input" value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Nombre</label><input className="input" value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group">
            <label className="label">Tipo</label>
            <select className="input" value={form.type ?? 'cash'} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group flex items-center gap-2">
            <input type="checkbox" id="affectsCash" checked={!!form.affectsCash} onChange={e => setForm((f: any) => ({ ...f, affectsCash: e.target.checked }))} />
            <label htmlFor="affectsCash" className="label !mb-0">Afecta caja (se registra como movimiento de caja)</label>
          </div>
          {modal.data && (
            <div className="form-group flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={!!form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="isActive" className="label !mb-0">Activo</label>
            </div>
          )}
          <div className="form-group"><label className="label">Notas</label><input className="input" value={form.notes ?? ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
