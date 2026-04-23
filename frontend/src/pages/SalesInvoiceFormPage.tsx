import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService, clientsService, productsService, paramsService, stockService } from '../services'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import PageHeader from '../components/ui/PageHeader'
import { Plus, Trash2, Save, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface InvoiceItem { productId: number; productName: string; quantity: number; unitPrice: number; discountPercentage: number; vatRate: number; sortOrder: number }

export default function SalesInvoiceFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [invoiceType, setInvoiceType] = useState('A')
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])

  const { data: locations } = useQuery({ queryKey: ['stock-locations'], queryFn: stockService.getLocations })
  const { data: paymentConditions } = useQuery({ queryKey: ['payment-conditions'], queryFn: paramsService.getPaymentConditions })
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  const addItem = () => setItems(prev => [...prev, { productId: 0, productName: '', quantity: 1, unitPrice: 0, discountPercentage: 0, vatRate: 21, sortOrder: prev.length }])

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const subtotal = items.reduce((acc, it) => {
    const net = it.quantity * it.unitPrice * (1 - it.discountPercentage / 100)
    return acc + net
  }, 0)
  const vatTotal = items.reduce((acc, it) => {
    const net = it.quantity * it.unitPrice * (1 - it.discountPercentage / 100)
    return acc + net * (it.vatRate / 100)
  }, 0)
  const total = subtotal + vatTotal

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEdit ? salesService.update(+id!, data) : salesService.create(data),
    onSuccess: (result) => { toast.success('Factura guardada'); navigate('/sales') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar')
  })

  const confirmMutation = useMutation({
    mutationFn: (invoiceId: number) => salesService.confirm(invoiceId),
    onSuccess: () => { toast.success('Factura confirmada. Stock descontado.'); navigate('/sales') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al confirmar')
  })

  const handleSave = () => {
    if (!selectedClient) return toast.error('Seleccione un cliente')
    if (!selectedLocation) return toast.error('Seleccione locación de stock')
    if (items.length === 0) return toast.error('Agregue al menos un item')
    saveMutation.mutate({
      invoiceType, invoiceDate, clientId: selectedClient.id,
      sellerId: selectedSeller?.id, paymentConditionId: selectedPayment?.id,
      stockLocationId: selectedLocation.id, notes,
      items: items.map(it => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice, discountPercentage: it.discountPercentage, vatRate: it.vatRate, sortOrder: it.sortOrder }))
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader title={isEdit ? 'Editar Factura de Venta' : 'Nueva Factura de Venta'}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/sales')}><ArrowLeft className="w-4 h-4" /> Volver</button>
            <button className="btn-primary" onClick={handleSave} disabled={saveMutation.isPending}><Save className="w-4 h-4" /> Guardar</button>
          </>
        } />

      {/* Header */}
      <div className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="label">Tipo</label>
          <select className="input" value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
            <option value="A">Factura A</option><option value="B">Factura B</option><option value="C">Factura C</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label">Fecha</label>
          <input type="date" className="input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Locación de Stock *</label>
          <SearchAutocomplete value={selectedLocation} onChange={setSelectedLocation}
            onSearch={async (t) => (locations ?? []).filter((l: any) => l.name.toLowerCase().includes(t.toLowerCase())).map((l: any) => ({ id: l.id, label: l.name }))} />
        </div>
        <div className="form-group col-span-2">
          <SearchAutocomplete label="Cliente *" value={selectedClient} onChange={setSelectedClient}
            onSearch={async (t) => { const r = await clientsService.search(t); return r.map((c: any) => ({ id: c.id, label: c.businessName, sublabel: c.cuit })) }} />
        </div>
        <div className="form-group">
          <label className="label">Cond. de Pago</label>
          <SearchAutocomplete value={selectedPayment} onChange={setSelectedPayment}
            onSearch={async (t) => (paymentConditions ?? []).filter((p: any) => p.name.toLowerCase().includes(t.toLowerCase())).map((p: any) => ({ id: p.id, label: p.name }))} />
        </div>
        <div className="form-group col-span-2">
          <label className="label">Notas</label>
          <input className="input" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Items</h3>
          <button className="btn-secondary btn-sm" onClick={addItem}><Plus className="w-4 h-4" /> Agregar item</button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Producto</th><th>Cant.</th><th>Precio Unit.</th><th>Dto.%</th><th>IVA%</th><th>Subtotal</th><th className="w-10"></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin items</td></tr>}
              {items.map((item, idx) => {
                const net = item.quantity * item.unitPrice * (1 - item.discountPercentage / 100)
                const lineTotal = net * (1 + item.vatRate / 100)
                return (
                  <tr key={idx}>
                    <td className="min-w-[200px]">
                      <SearchAutocomplete value={item.productId ? { id: item.productId, label: item.productName } : null}
                        onChange={opt => { if (opt) { updateItem(idx, 'productId', opt.id); updateItem(idx, 'productName', opt.label) } }}
                        onSearch={async (t) => { const r = await productsService.search(t); return r.map((p: any) => ({ id: p.id, label: p.name, sublabel: `Stock: ${p.totalStock}` })) }} />
                    </td>
                    <td><input className="input w-20" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} /></td>
                    <td><input className="input w-28" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', +e.target.value)} /></td>
                    <td><input className="input w-20" type="number" min="0" max="100" step="0.01" value={item.discountPercentage} onChange={e => updateItem(idx, 'discountPercentage', +e.target.value)} /></td>
                    <td>
                      <select className="input w-20" value={item.vatRate} onChange={e => updateItem(idx, 'vatRate', +e.target.value)}>
                        {[0, 10.5, 21, 27].map(v => <option key={v} value={v}>{v}%</option>)}
                      </select>
                    </td>
                    <td className="font-mono font-medium">$ {lineTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td><button className="text-red-500 hover:text-red-700" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal neto</span><span>$ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">IVA</span><span>$ {vatTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-700 pt-1">
              <span>Total</span><span>$ {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
