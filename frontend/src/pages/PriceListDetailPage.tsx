import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { priceListsService, productsService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import { ArrowLeft, RefreshCw, Percent, Trash2, Plus, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function PriceListDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [bulkPct, setBulkPct] = useState('')
  const [newProduct, setNewProduct] = useState<any>(null)
  const [newMode, setNewMode] = useState<'percentage' | 'fixed'>('percentage')
  const [newPct, setNewPct] = useState('0')
  const [newFixed, setNewFixed] = useState('0')

  const { data, isLoading } = useQuery({ queryKey: ['price-list', id], queryFn: () => priceListsService.getById(+id!) })

  const upsertMutation = useMutation({
    mutationFn: ({ productId, pricingMode, profitPercentage, fixedPrice }: any) =>
      priceListsService.upsertItem(+id!, { productId, pricingMode, profitPercentage, fixedPrice }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['price-list', id] }); toast.success('Precio actualizado') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const removeMutation = useMutation({
    mutationFn: (productId: number) => priceListsService.removeItem(+id!, productId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['price-list', id] }); toast.success('Producto quitado de la lista') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const bulkMutation = useMutation({
    mutationFn: () => priceListsService.bulkUpdate(+id!, { pricingMode: 'percentage', profitPercentage: +bulkPct }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['price-list', id] }); toast.success('Precios actualizados masivamente') }
  })

  const recalcMutation = useMutation({
    mutationFn: () => priceListsService.recalculate(+id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['price-list', id] }); toast.success('Precios recalculados') }
  })

  const handleAddProduct = () => {
    if (!newProduct) return toast.error('Seleccione un producto')
    upsertMutation.mutate(
      { productId: newProduct.id, pricingMode: newMode, profitPercentage: +newPct || 0, fixedPrice: +newFixed || 0 },
      { onSuccess: () => { setNewProduct(null); setNewPct('0'); setNewFixed('0'); setNewMode('percentage'); qc.invalidateQueries({ queryKey: ['price-list', id] }); toast.success('Producto agregado') } }
    )
  }

  const existingIds = new Set((data?.items ?? []).map((i: any) => i.productId))

  return (
    <div className="space-y-5">
      <PageHeader title={data?.name ?? 'Lista de Precios'} subtitle={`${data?.items?.length ?? 0} productos`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/price-lists')}><ArrowLeft className="w-4 h-4" /> Volver</button>
            <button className="btn-secondary" onClick={() => recalcMutation.mutate()}><RefreshCw className="w-4 h-4" /> Recalcular</button>
          </>
        } />

      {/* Add product */}
      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">Agregar producto</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <SearchAutocomplete label="Producto" value={newProduct} onChange={setNewProduct}
              onSearch={async (t) => {
                const r = await productsService.search(t)
                return r.filter((p: any) => !existingIds.has(p.id)).map((p: any) => ({ id: p.id, label: p.name, sublabel: p.code }))
              }} />
          </div>
          <div>
            <label className="label">Modo</label>
            <select className="input" value={newMode} onChange={e => setNewMode(e.target.value as any)}>
              <option value="percentage">% Rentabilidad</option>
              <option value="fixed">Precio fijo</option>
            </select>
          </div>
          <div>
            <label className="label">{newMode === 'percentage' ? '% sobre costo' : 'Precio de venta'}</label>
            {newMode === 'percentage'
              ? <input className="input" type="number" step="0.01" value={newPct} onChange={e => setNewPct(e.target.value)} />
              : <input className="input" type="number" step="0.01" value={newFixed} onChange={e => setNewFixed(e.target.value)} />}
          </div>
          <button className="btn-primary" onClick={handleAddProduct} disabled={!newProduct || upsertMutation.isPending}>
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {/* Bulk update */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aplicar % rentabilidad a toda la lista:</span>
        <div className="flex items-center gap-2">
          <input className="input w-28" type="number" step="0.01" placeholder="%" value={bulkPct} onChange={e => setBulkPct(e.target.value)} />
          <button className="btn-primary btn-sm" onClick={() => bulkMutation.mutate()} disabled={!bulkPct || bulkMutation.isPending}>
            <Percent className="w-4 h-4" /> Aplicar
          </button>
        </div>
      </div>

      {/* Items table */}
      <div className="card p-5">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Código</th><th>Producto</th><th>Unidad</th><th>Último Costo</th><th>Modo</th><th>% Rentab.</th><th>Precio Fijo</th><th>Precio Final</th><th className="w-24">Acciones</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="text-center py-8">Cargando...</td></tr>}
              {!isLoading && (data?.items ?? []).length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Esta lista no tiene productos. Agregue uno desde el formulario de arriba.</td></tr>
              )}
              {(data?.items ?? []).map((item: any) => (
                <PriceListItemRow key={item.id} item={item}
                  onUpdate={(dto) => upsertMutation.mutate(dto)}
                  onRemove={() => removeMutation.mutate(item.productId)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PriceListItemRow({ item, onUpdate, onRemove }: { item: any; onUpdate: (dto: any) => void; onRemove: () => void }) {
  const [mode, setMode] = useState<string>(item.pricingMode || 'percentage')
  const [pct, setPct] = useState<string>(String(item.profitPercentage ?? 0))
  const [fixed, setFixed] = useState<string>(String(item.fixedPrice ?? 0))

  const dirty =
    mode !== (item.pricingMode || 'percentage') ||
    +pct !== +(item.profitPercentage ?? 0) ||
    +fixed !== +(item.fixedPrice ?? 0)

  const save = () => {
    onUpdate({
      productId: item.productId,
      pricingMode: mode,
      profitPercentage: +pct || 0,
      fixedPrice: +fixed || 0,
    })
  }

  return (
    <tr className={dirty ? 'bg-amber-50 dark:bg-amber-900/20' : ''}>
      <td className="font-mono text-xs">{item.productCode}</td>
      <td>{item.productName}</td>
      <td>{item.unit}</td>
      <td>$ {item.lastPurchasePrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      <td>
        <select className="input w-32 text-xs" value={mode} onChange={e => setMode(e.target.value)}>
          <option value="percentage">% Rentab.</option>
          <option value="fixed">Precio fijo</option>
        </select>
      </td>
      <td>
        <input className="input w-24 text-xs" type="number" step="0.01" value={pct}
          onChange={e => setPct(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && dirty) save() }}
          disabled={mode !== 'percentage'} />
      </td>
      <td>
        <input className="input w-28 text-xs" type="number" step="0.01" value={fixed}
          onChange={e => setFixed(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && dirty) save() }}
          disabled={mode !== 'fixed'} />
      </td>
      <td className="font-semibold text-green-700 dark:text-green-400">
        $ {item.finalPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </td>
      <td>
        <div className="flex items-center gap-1">
          <button className="btn-primary btn-sm p-1 disabled:opacity-40" onClick={save} disabled={!dirty} title="Guardar">
            <Save className="w-3.5 h-3.5" />
          </button>
          <button className="btn-ghost btn-sm p-1 text-red-500 hover:text-red-700" onClick={onRemove} title="Quitar">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
