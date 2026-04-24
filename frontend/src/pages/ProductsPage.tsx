import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService, paramsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import { Plus, Edit2, Trash2, RotateCcw, Images, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'
import DocumentsSection from '../components/uploads/DocumentsSection'
import ProductPhotosSection from '../components/uploads/ProductPhotosSection'
import ProductPhotosLightbox from '../components/uploads/ProductPhotosLightbox'
import { useCanAccess } from '../hooks/useCanAccess'

const UNITS = ['un', 'kg', 'lt', 'm', 'm2', 'caja', 'par', 'paquete']

export default function ProductsPage() {
  const qc = useQueryClient()
  const can = useCanAccess('products')
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [lightbox, setLightbox] = useState<{ id: number; name: string } | null>(null)

  const [showDeleted, setShowDeleted] = useState(false)
  const { data, isLoading, refetch } = useQuery({ queryKey: ['products', showDeleted], queryFn: () => productsService.getAll({ page: 1, pageSize: 500, includeDeleted: showDeleted }) })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: paramsService.getCategories })

  useEffect(() => {
    if (!modal.open) return
    if (!modal.data?.id) {
      setForm({ unit: 'un', trackStock: true, minimumStock: 0 })
      setSelectedUnit({ id: 1, label: 'un' })
      setSelectedCategory(null)
      return
    }
    productsService.getById(modal.data.id).then((full: any) => {
      setForm(full)
      setSelectedCategory(full.categoryId ? { id: full.categoryId, label: full.categoryName ?? '' } : null)
      const unitIdx = UNITS.indexOf(full.unit ?? 'un')
      setSelectedUnit({ id: unitIdx >= 0 ? unitIdx + 1 : 1, label: full.unit ?? 'un' })
    })
  }, [modal.open, modal.data?.id])

  const saveMutation = useMutation({
    mutationFn: (d: any) => modal.data?.id ? productsService.update(modal.data.id, d) : productsService.create(d),
    onSuccess: () => { toast.success('Producto guardado'); qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const deleteMutation = useMutation({ mutationFn: productsService.delete, onSuccess: () => { toast.success('Eliminado'); qc.invalidateQueries({ queryKey: ['products'] }) }, onError: (e: any) => toast.error(e.response?.data?.message || 'No se puede eliminar') })
  const restoreMutation = useMutation({ mutationFn: productsService.restore, onSuccess: () => { toast.success('Restaurado'); qc.invalidateQueries({ queryKey: ['products'] }) } })

  const columns: Column<any>[] = [
    { key: 'photoUrl', header: '', width: '60px', render: (r: any) => (
      r.photoUrl
        ? <img src={r.photoUrl} alt="" className="w-10 h-10 object-cover rounded" />
        : <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400"><ImageIcon className="w-4 h-4" /></div>
    ) },
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'brand', header: 'Marca' },
    { key: 'model', header: 'Modelo' },
    { key: 'barcode', header: 'Cód. Barras', width: '130px' },
    { key: 'categoryName', header: 'Categoría' },
    { key: 'unit', header: 'Unidad', width: '80px' },
    { key: 'lastPurchasePrice', header: 'Último Costo', render: r => `$ ${r.lastPurchasePrice?.toLocaleString()}` },
    { key: 'totalStock', header: 'Stock Total', render: r => <span className={r.totalStock <= 0 ? 'text-red-500 font-semibold' : ''}>{r.totalStock}</span> },
    { key: 'isActive', header: 'Estado', render: r => r.isDeleted ? <Badge variant="red">Eliminado</Badge> : <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      ...form,
      categoryId: selectedCategory?.id ?? null,
      unit: selectedUnit?.label ?? form.unit ?? 'un',
    })
  }

  return (
    <div>
      <PageHeader title="Productos" subtitle={`${data?.totalCount ?? 0} registros`}
        actions={can.write && <button className="btn-primary" onClick={() => setModal({ open: true })}><Plus className="w-4 h-4" /> Nuevo Producto</button>} />
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
              {!row.isDeleted && (row.photoCount ?? 0) > 0 && (
                <button className="btn-ghost btn-sm p-1" title={`Ver fotos (${row.photoCount})`} onClick={() => setLightbox({ id: row.id, name: row.name })}><Images className="w-3.5 h-3.5" /></button>
              )}
              {!row.isDeleted && can.write && <button className="btn-ghost btn-sm p-1" onClick={() => setModal({ open: true, data: row })} title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>}
              {!row.isDeleted && can.delete && <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)} title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>}
              {row.isDeleted && can.write && <button className="btn-ghost btn-sm p-1 text-green-600" onClick={() => restoreMutation.mutate(row.id)} title="Reactivar"><RotateCcw className="w-3.5 h-3.5" /></button>}
            </>
          )} />
        {lightbox && <ProductPhotosLightbox open={!!lightbox} onClose={() => setLightbox(null)} productId={lightbox.id} productName={lightbox.name} />}
      </div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Producto' : 'Nuevo Producto'} size="2xl"
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>Guardar</button></>}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Código *</label><input className="input" required value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Nombre *</label><input className="input" required value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Marca</label><input className="input" value={form.brand ?? ''} onChange={e => setForm((f: any) => ({ ...f, brand: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Modelo</label><input className="input" value={form.model ?? ''} onChange={e => setForm((f: any) => ({ ...f, model: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Código de Barras</label><input className="input" value={form.barcode ?? ''} onChange={e => setForm((f: any) => ({ ...f, barcode: e.target.value }))} /></div>
          <SearchAutocomplete label="Categoría" value={selectedCategory} onChange={setSelectedCategory}
            onSearch={async (t) => (categories ?? []).filter((c: any) => c.name.toLowerCase().includes((t ?? '').toLowerCase())).map((c: any) => ({ id: c.id, label: c.name }))} />
          <SearchAutocomplete label="Unidad" value={selectedUnit} onChange={setSelectedUnit}
            onSearch={async (t) => UNITS.filter(u => u.includes((t ?? '').toLowerCase())).map((u, i) => ({ id: UNITS.indexOf(u) + 1, label: u }))} />
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
              <ProductPhotosSection productId={modal.data.id} />
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
