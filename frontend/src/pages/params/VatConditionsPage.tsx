import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paramsService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { Plus, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VatConditionsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const { data, isLoading, refetch } = useQuery({ queryKey: ['vat-conditions'], queryFn: paramsService.getVatConditions })
  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id ? paramsService.updateVatCondition(modal.data.id, d) : paramsService.createVatCondition(d),
    onSuccess: () => { toast.success('Guardado'); qc.invalidateQueries({ queryKey: ['vat-conditions'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'afipCode', header: 'Cód. AFIP', width: '100px' },
    { key: 'vatRate', header: '% IVA', width: '80px', render: r => `${r.vatRate}%` },
  ]
  return (
    <div>
      <PageHeader title="Condiciones de IVA" actions={<button className="btn-primary" onClick={() => { setForm({}); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nueva</button>} />
      <div className="card p-5"><DataGrid columns={columns} data={data ?? []} loading={isLoading} onRefresh={refetch} exportFileName="cond-iva"
        actions={row => <button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button>} /></div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar' : 'Nueva Condición de IVA'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={() => saveMutation.mutate(form)}>Guardar</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Código</label><input className="input" value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Nombre</label><input className="input" value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Cód. AFIP</label><input className="input" value={form.afipCode ?? ''} onChange={e => setForm((f: any) => ({ ...f, afipCode: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Alicuota IVA %</label><input className="input" type="number" step="0.01" value={form.vatRate ?? 0} onChange={e => setForm((f: any) => ({ ...f, vatRate: +e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
