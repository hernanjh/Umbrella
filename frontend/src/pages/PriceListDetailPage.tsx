import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { priceListsService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import { ArrowLeft, RefreshCw, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function PriceListDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [bulkPct, setBulkPct] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['price-list', id], queryFn: () => priceListsService.getById(+id!) })

  const upsertMutation = useMutation({
    mutationFn: ({ productId, pricingMode, profitPercentage, fixedPrice }: any) =>
      priceListsService.upsertItem(+id!, { productId, pricingMode, profitPercentage, fixedPrice }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['price-list', id] }); toast.success('Precio actualizado') },
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

  return (
    <div className="space-y-5">
      <PageHeader title={data?.name ?? 'Lista de Precios'} subtitle={`${data?.items?.length ?? 0} productos`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/price-lists')}><ArrowLeft className="w-4 h-4" /> Volver</button>
            <button className="btn-secondary" onClick={() => recalcMutation.mutate()}><RefreshCw className="w-4 h-4" /> Recalcular</button>
          </>
        } />

      {/* Bulk update */}
      <div className="card p-4 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Actualizar toda la lista con:</span>
        <div className="flex items-center gap-2">
          <input className="input w-28" type="number" placeholder="% rentab." value={bulkPct} onChange={e => setBulkPct(e.target.value)} />
          <button className="btn-primary btn-sm" onClick={() => bulkMutation.mutate()} disabled={!bulkPct}><Percent className="w-4 h-4" /> Aplicar</button>
        </div>
      </div>

      {/* Items table */}
      <div className="card p-5">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Código</th><th>Producto</th><th>Unidad</th><th>Último Costo</th><th>Modo</th><th>% Rentab.</th><th>Precio Fijo</th><th>Precio Final</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-8">Cargando...</td></tr>}
              {(data?.items ?? []).map((item: any) => (
                <tr key={item.id}>
                  <td className="font-mono text-xs">{item.productCode}</td>
                  <td>{item.productName}</td>
                  <td>{item.unit}</td>
                  <td>$ {item.lastPurchasePrice?.toLocaleString()}</td>
                  <td>
                    <select className="input w-28 text-xs" value={item.pricingMode}
                      onChange={e => upsertMutation.mutate({ productId: item.productId, pricingMode: e.target.value, profitPercentage: item.profitPercentage, fixedPrice: item.fixedPrice })}>
                      <option value="percentage">% Rentab.</option>
                      <option value="fixed">Precio fijo</option>
                    </select>
                  </td>
                  <td>
                    <input className="input w-24 text-xs" type="number" value={item.profitPercentage}
                      onChange={e => upsertMutation.mutate({ productId: item.productId, pricingMode: item.pricingMode, profitPercentage: +e.target.value, fixedPrice: item.fixedPrice })}
                      disabled={item.pricingMode !== 'percentage'} />
                  </td>
                  <td>
                    <input className="input w-28 text-xs" type="number" value={item.fixedPrice}
                      onChange={e => upsertMutation.mutate({ productId: item.productId, pricingMode: item.pricingMode, profitPercentage: item.profitPercentage, fixedPrice: +e.target.value })}
                      disabled={item.pricingMode !== 'fixed'} />
                  </td>
                  <td className="font-semibold text-green-700 dark:text-green-400">$ {item.finalPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
