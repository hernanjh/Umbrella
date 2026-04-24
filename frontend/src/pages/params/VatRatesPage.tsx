import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paramsService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Edit2, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VatRatesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({ rate: 0, isDefault: false })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vat-rates'],
    queryFn: paramsService.getVatRates,
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) =>
      modal.data?.id ? paramsService.updateVatRate(modal.data.id, d) : paramsService.createVatRate(d),
    onSuccess: () => {
      toast.success(modal.data ? 'Tasa actualizada' : 'Tasa creada')
      qc.invalidateQueries({ queryKey: ['vat-rates'] })
      setModal({ open: false })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => paramsService.deleteVatRate(id),
    onSuccess: () => {
      toast.success('Tasa eliminada')
      qc.invalidateQueries({ queryKey: ['vat-rates'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const open = (row?: any) => {
    setForm(row ?? { code: '', name: '', rate: 0, isDefault: false, isActive: true })
    setModal({ open: true, data: row })
  }

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '120px', render: r => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{r.code}</span> },
    { key: 'name', header: 'Nombre' },
    { key: 'rate', header: 'Tasa', width: '100px', render: r => <span className="font-mono font-semibold">{Number(r.rate).toFixed(2)}%</span> },
    { key: 'isDefault', header: 'Por defecto', width: '120px', render: r => r.isDefault ? <Badge variant="blue"><Star className="w-3 h-3 inline -mt-0.5 mr-1" />Sí</Badge> : <span className="text-gray-400">—</span> },
    { key: 'isActive', header: 'Estado', width: '100px', render: r => <Badge variant={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Tasas de IVA"
        subtitle="Alícuotas disponibles en los ítems de factura"
        actions={
          <button className="btn-primary" onClick={() => open()}>
            <Plus className="w-4 h-4" /> Nueva Tasa
          </button>
        }
      />
      <div className="card p-5">
        <DataGrid
          columns={columns}
          data={data ?? []}
          loading={isLoading}
          onRefresh={refetch}
          exportFileName="tasas-iva"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" title="Editar" onClick={() => open(row)}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button className="btn-ghost btn-sm p-1 text-red-500" title="Eliminar"
                onClick={() => { if (confirm(`¿Eliminar tasa "${row.name}"?`)) deleteMutation.mutate(row.id) }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        />
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.data ? 'Editar Tasa de IVA' : 'Nueva Tasa de IVA'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button>
            <button className="btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>Guardar</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="form-group">
            <label className="label">Código *</label>
            <input className="input font-mono" value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} disabled={!!modal.data} maxLength={10} />
          </div>
          <div className="form-group">
            <label className="label">Nombre *</label>
            <input className="input" value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Ej: IVA 21%" />
          </div>
          <div className="form-group">
            <label className="label">Alícuota (%) *</label>
            <input className="input" type="number" step="0.01" min="0" max="100" value={form.rate ?? 0} onChange={e => setForm((f: any) => ({ ...f, rate: +e.target.value }))} />
          </div>
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.isDefault ?? false} onChange={e => setForm((f: any) => ({ ...f, isDefault: e.target.checked }))} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Usar como predeterminada</span>
            </label>
            {modal.data && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={form.isActive !== false} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} />
                <span className="text-sm text-gray-700 dark:text-gray-300">Activa</span>
              </label>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
