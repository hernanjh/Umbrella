import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, paramsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Edit2, Trash2, RotateCcw, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'

export default function ProductsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})

  const { data, isLoading, refetch } = useQuery({ queryKey: ['products'], queryFn: () => productsService.getAll({ page: 1, pageSize: 500 }) })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: paramsService.getCategories })

  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id ? productsService.update(modal.data.id, d) : productsService.create(d),
    onSuccess: () => { toast.success('Producto guardado'); qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({ mutationFn: productsService.delete, onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['products'] }) }, onError: (e: any) => toast.error(e.response?.data?.message || 'No se puede eliminar') })
  const restoreMutation = useMutation({ mutationFn: productsService.restore, onSuccess: () => { toast.success('Restaurado'); qc.invalidateQueries({ queryKey: ['products'] }) } })

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'barcode', header: 'Cód. Barras', width: '130px' },
    { key: 'categoryName', header: 'Categoría' },
    { key: 'unit', header: 'Unidad', width: '80px' },
    { key: 'lastPurchasePrice', header: 'Último Costo', render: r => `$ ${r.lastPurchasePrice?.toLocaleString()}` },
    { key: 'averagePurchasePrice', header: 'Costo Promedio', render: r => `$ ${r.averagePurchasePrice?.toLocaleString()}` },
    { key: 'totalStock', header: 'Stock Total', render: r => <span className={r.totalStock <= 0 ? 'text-red-500 font-semibold' : ''}>{r.totalStock}</span> },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); saveMutation.mutate(form) }

  return (
    <div>
      <PageHeader title="Productos" subtitle={`${data?.totalCount ?? 0} registros`}
        actions={<button className="btn-primary" onClick={() => { setForm({ unit: 'un', trackStock: true, minimumStock: 0 }); setModal({ open: true }) }}><Plus className="w-4 h-4" /> Nuevo Producto</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="productos"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }}><Edit2 className="w-3.5 h-3.5" /></button>
              {!row.isDeleted
                ? <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                : <button className="btn-ghost btn-sm p-1 text-green-500" onClick={() => restoreMutation.mutate(row.id)}><RotateCcw className="w-3.5 h-3.5" /></button>}
            </>
          )} />
      </div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Producto' : 'Nuevo Producto'} size="xl"
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>Guardar</button></>}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Código *</label><input className="input" required value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Nombre *</label><input className="input" required value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Código de Barras</label><input className="input" value={form.barcode ?? ''} onChange={e => setForm((f: any) => ({ ...f, barcode: e.target.value }))} /></div>
          <div className="form-group">
            <label className="label">Categoría</label>
            <select className="input" value={form.categoryId ?? ''} onChange={e => setForm((f: any) => ({ ...f, categoryId: +e.target.value || null }))}>
              <option value="">Sin categoría</option>
              {(categories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Unidad</label>
            <select className="input" value={form.unit ?? 'un'} onChange={e => setForm((f: any) => ({ ...f, unit: e.target.value }))}>
              {['un', 'kg', 'lt', 'm', 'm2', 'caja', 'par', 'paquete'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="label">Stock Mínimo</label><input className="input" type="number" step="0.01" value={form.minimumStock ?? 0} onChange={e => setForm((f: any) => ({ ...f, minimumStock: +e.target.value }))} /></div>
          <div className="form-group col-span-2"><label className="label">Descripción</label><textarea className="input" rows={2} value={form.description ?? ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
          <div className="form-group flex items-center gap-2 col-span-2">
            <input type="checkbox" id="trackStock" checked={form.trackStock ?? true} onChange={e => setForm((f: any) => ({ ...f, trackStock: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <label htmlFor="trackStock" className="text-sm text-gray-700 dark:text-gray-300">Controlar stock</label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
