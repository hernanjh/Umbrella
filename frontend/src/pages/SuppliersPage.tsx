import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersService, paramsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import { Plus, Edit2, Trash2, RotateCcw, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'

export default function SuppliersPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [selectedVat, setSelectedVat] = useState<any>(null)
  const [selectedPayCond, setSelectedPayCond] = useState<any>(null)

  const [showDeleted, setShowDeleted] = useState(false)
  const { data, isLoading, refetch } = useQuery({ queryKey: ['suppliers', showDeleted], queryFn: () => suppliersService.getAll({ page: 1, pageSize: 200, includeDeleted: showDeleted }) })
  const { data: vatConditions } = useQuery({ queryKey: ['vat-conditions'], queryFn: paramsService.getVatConditions })
  const { data: paymentConditions } = useQuery({ queryKey: ['payment-conditions'], queryFn: paramsService.getPaymentConditions })

  useEffect(() => {
    if (!modal.open) return
    if (!modal.data?.id) {
      setForm({}); setSelectedVat(null); setSelectedPayCond(null)
      return
    }
    suppliersService.getById(modal.data.id).then((full: any) => {
      setForm(full)
      setSelectedVat(full.vatConditionId ? { id: full.vatConditionId, label: full.vatConditionName ?? '' } : null)
      setSelectedPayCond(full.paymentConditionId ? { id: full.paymentConditionId, label: full.paymentConditionName ?? '' } : null)
    })
  }, [modal.open, modal.data?.id])

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
    { key: 'isActive', header: 'Estado', render: r => r.isDeleted ? <Badge variant="red">Eliminado</Badge> : <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({ ...form, vatConditionId: selectedVat?.id ?? null, paymentConditionId: selectedPayCond?.id ?? null })
  }

  return (
    <div>
      <PageHeader title="Proveedores" subtitle={`${data?.totalCount ?? 0} registros`}
        actions={<button className="btn-primary" onClick={() => { setForm({}); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nuevo Proveedor</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="proveedores"
          rowClassName={(r: any) => r.isDeleted ? 'opacity-60' : ''}
          toolbar={
            <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 select-none ml-2">
              <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} />
              Ver eliminados
            </label>
          }
          actions={(row: any) => (
            <>
              {!row.isDeleted && <button className="btn-ghost btn-sm p-1" title="Cuenta corriente" onClick={() => navigate(`/suppliers/${row.id}/account`)}><Wallet className="w-3.5 h-3.5" /></button>}
              {!row.isDeleted && <button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }} title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>}
              {!row.isDeleted
                ? <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)} title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                : <button className="btn-ghost btn-sm p-1 text-green-600" onClick={() => restoreMutation.mutate(row.id)} title="Reactivar"><RotateCcw className="w-3.5 h-3.5" /></button>}
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
          <SearchAutocomplete label="Cond. IVA" value={selectedVat} onChange={setSelectedVat}
            onSearch={async (t) => (vatConditions ?? []).filter((v: any) => v.name.toLowerCase().includes((t ?? '').toLowerCase())).map((v: any) => ({ id: v.id, label: v.name }))} />
          <SearchAutocomplete label="Cond. de Pago" value={selectedPayCond} onChange={setSelectedPayCond}
            onSearch={async (t) => (paymentConditions ?? []).filter((p: any) => p.name.toLowerCase().includes((t ?? '').toLowerCase())).map((p: any) => ({ id: p.id, label: p.name }))} />
          <div className="form-group col-span-2"><label className="label">Notas</label><textarea className="input" rows={2} value={form.notes ?? ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
        </form>
      </Modal>
    </div>
  )
}
