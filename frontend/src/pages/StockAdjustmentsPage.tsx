import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockService, productsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import { Plus, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { StatusBadge } from '../components/ui/Badge'

export default function StockAdjustmentsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [adjItems, setAdjItems] = useState<any[]>([])
  const { data: locations } = useQuery({ queryKey: ['stock-locations'], queryFn: stockService.getLocations })
  const { data, isLoading, refetch } = useQuery({ queryKey: ['stock-adjustments'], queryFn: () => stockService.getAdjustments({ page: 1, pageSize: 200 }) })

  const createMutation = useMutation({
    mutationFn: stockService.createAdjustment,
    onSuccess: () => { toast.success('Ajuste creado'); qc.invalidateQueries({ queryKey: ['stock-adjustments'] }); setModal(false) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const confirmMutation = useMutation({
    mutationFn: (id: number) => stockService.confirmAdjustment(id),
    onSuccess: () => { toast.success('Ajuste confirmado. Stock actualizado.'); qc.invalidateQueries({ queryKey: ['stock-adjustments'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const addAdjItem = () => setAdjItems(prev => [...prev, { productId: 0, productName: '', stockLocationId: 0, newQuantity: 0 }])
  const updateAdjItem = (idx: number, field: string, value: any) => setAdjItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))

  const handleSave = () => {
    if (!reason) return toast.error('Ingrese un motivo')
    if (adjItems.length === 0) return toast.error('Agregue al menos un item')
    createMutation.mutate({ reason, notes, adjustmentDate: new Date().toISOString(), items: adjItems })
  }

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '120px' },
    { key: 'adjustmentDate', header: 'Fecha', render: r => format(new Date(r.adjustmentDate), 'dd/MM/yyyy') },
    { key: 'reason', header: 'Motivo' },
    { key: 'itemCount', header: 'Items', width: '70px' },
    { key: 'status', header: 'Estado', render: r => <StatusBadge status={r.status} /> },
    { key: 'createdBy', header: 'Creado por' },
  ]

  return (
    <div>
      <PageHeader title="Ajustes de Stock"
        actions={<button className="btn-primary" onClick={() => { setAdjItems([]); setReason(''); setModal(true) }}><Plus className="w-4 h-4" /> Nuevo Ajuste</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={data?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="ajustes-stock"
          actions={row => row.status === 'draft' ? (
            <button className="btn-ghost btn-sm p-1 text-green-600" onClick={() => confirmMutation.mutate(row.id)}><CheckCircle className="w-3.5 h-3.5" /></button>
          ) : null} />
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo Ajuste de Stock" size="xl"
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button className="btn-primary" onClick={handleSave} disabled={createMutation.isPending}>Guardar</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">Motivo *</label><input className="input" required value={reason} onChange={e => setReason(e.target.value)} /></div>
          <div className="form-group"><label className="label">Notas</label><textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Items a ajustar</h4>
            <button className="btn-secondary btn-sm" onClick={addAdjItem}><Plus className="w-3 h-3" /> Agregar</button>
          </div>
          {adjItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <SearchAutocomplete value={item.productId ? { id: item.productId, label: item.productName } : null}
                onChange={opt => { if (opt) { updateAdjItem(idx, 'productId', opt.id); updateAdjItem(idx, 'productName', opt.label) } }}
                onSearch={async (t) => { const r = await productsService.search(t); return r.map((p: any) => ({ id: p.id, label: p.name })) }}
                placeholder="Buscar producto..." />
              <select className="input" value={item.stockLocationId} onChange={e => updateAdjItem(idx, 'stockLocationId', +e.target.value)}>
                <option value="0">Locación...</option>
                {(locations ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <input className="input" type="number" min="0" step="0.01" placeholder="Nueva cantidad" value={item.newQuantity} onChange={e => updateAdjItem(idx, 'newQuantity', +e.target.value)} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
