import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, paramsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import { Plus, Edit2, Trash2, RotateCcw, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'
import DocumentsSection from '../components/uploads/DocumentsSection'
import { useRef } from 'react'

export default function ProductsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const photoInputRef = useRef<HTMLInputElement>(null)

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: number, file: File }) => productsService.uploadPhoto(id, file),
    onSuccess: (data) => { setForm((f: any) => ({ ...f, photoUrl: data.photoUrl })); toast.success('Foto actualizada'); qc.invalidateQueries({ queryKey: ['products'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al subir foto')
  })

  const [showDeleted, setShowDeleted] = useState(false)
  const { data, isLoading, refetch } = useQuery({ queryKey: ['products', showDeleted], queryFn: () => productsService.getAll({ page: 1, pageSize: 500, includeDeleted: showDeleted }) })
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
          rowClassName={(r: any) => r.isDeleted ? 'opacity-60' : ''}
          toolbar={
            <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 select-none ml-2">
              <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} />
              Ver eliminados
            </label>
          }
          actions={(row: any) => (
            <>
              {!row.isDeleted && <button className="btn-ghost btn-sm p-1" onClick={() => { setForm(row); setModal({ open: true, data: row }) }} title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>}
              {!row.isDeleted
                ? <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)} title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                : <button className="btn-ghost btn-sm p-1 text-green-600" onClick={() => restoreMutation.mutate(row.id)} title="Reactivar"><RotateCcw className="w-3.5 h-3.5" /></button>}
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

        {modal.data?.id && (
          <>
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Foto del producto</h4>
              <div className="flex items-center gap-4">
                {form.photoUrl
                  ? <img src={form.photoUrl} alt="" className="w-24 h-24 object-cover rounded border" />
                  : <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center text-gray-400 text-xs">Sin foto</div>}
                <button type="button" className="btn-secondary btn-sm" onClick={() => photoInputRef.current?.click()} disabled={photoMutation.isPending}>
                  <Upload className="w-4 h-4" /> {form.photoUrl ? 'Cambiar' : 'Subir'} foto
                </button>
                <input ref={photoInputRef} type="file" className="hidden" accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) photoMutation.mutate({ id: modal.data.id, file: f }) }} />
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <DocumentsSection kind="product" entityId={modal.data.id}
                getDocuments={productsService.getDocuments}
                uploadDocument={productsService.uploadDocument}
                deleteDocument={productsService.deleteDocument} />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
