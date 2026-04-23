import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersService, paramsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Edit2, Trash2, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'

export default function SuppliersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})

  const { data, isLoading, refetch } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersService.getAll({ page: 1, pageSize: 200 }) })
  const { data: vatConditions } = useQuery({ queryKey: ['vat-conditions'], queryFn: paramsService.getVatConditions })
  const { data: paymentConditions } = useQuery({ queryKey: ['payment-conditions'], queryFn: paramsService.getPaymentConditions })

  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id ? suppliersService.update(modal.data.id, d) : suppliersService.create(d),
    onSuccess: () => { toast.success('Proveedor guardado'); qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({ mutationFn: suppliersService.delete, onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['suppliers'] }) } })
  const restoreMutation = useMutation({ mutationFn: suppliersService.restore, onSuccess: () => { toast.success('Restaurado'); qc.invalidateQueries({ queryKey: ['suppliers'] }) } })

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '90px' },
    { key: 'businessName', header: 'Razón Social' },
    { key: 'cuit', header: 'CUIT', width: '130px' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'vatConditionName', header: 'Cond. IVA' },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); saveMutation.mutate(form) }

  return (
    <div>
      <PageHeader title="Proveedores" subtitle={`${data?.totalCount ?? 0} registros`}
        actions={<button className="btn-primary" onClick={() => { setForm({}); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nuevo Proveedor</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="proveedores"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button>
              {!row.isDeleted
                ? <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                : <button className="btn-ghost btn-sm p-1 text-green-500" onClick={() => restoreMutation.mutate(row.id)}><RotateCcw className="w-3.5 h-3.5" /></button>}
            </>
          )} />
      </div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="2xl"
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>Guardar</button></>}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Código *</label><input className="input" required value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Razón Social *</label><input className="input" required value={form.businessName ?? ''} onChange={e => setForm((f: any) => ({ ...f, businessName: e.target.value }))} /></div>
          <div className="form-group"><label className="label">CUIT *</label><input className="input" required value={form.cuit ?? ''} onChange={e => setForm((f: any) => ({ ...f, cuit: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Email</label><input className="input" type="email" value={form.email ?? ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Teléfono</label><input className="input" value={form.phone ?? ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Ciudad</label><input className="input" value={form.city ?? ''} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Contacto</label><input className="input" value={form.contactPerson ?? ''} onChange={e => setForm((f: any) => ({ ...f, contactPerson: e.target.value }))} /></div>
          <div className="form-group">
            <label className="label">Cond. IVA</label>
            <select className="input" value={form.vatConditionId ?? ''} onChange={e => setForm((f: any) => ({ ...f, vatConditionId: +e.target.value || null }))}>
              <option value="">Seleccionar...</option>
              {(vatConditions ?? []).map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Cond. de Pago</label>
            <select className="input" value={form.paymentConditionId ?? ''} onChange={e => setForm((f: any) => ({ ...f, paymentConditionId: +e.target.value || null }))}>
              <option value="">Seleccionar...</option>
              {(paymentConditions ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="label">Notas</label><textarea className="input" rows={2} value={form.notes ?? ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
        </form>
      </Modal>
    </div>
  )
}
