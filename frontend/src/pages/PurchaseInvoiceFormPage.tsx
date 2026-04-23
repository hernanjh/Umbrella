import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { purchasesService, suppliersService, productsService, paramsService, stockService } from '../services'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import PageHeader from '../components/ui/PageHeader'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface PurchaseItem { productId: number; productName: string; quantity: number; unitPrice: number; discountPercentage: number; vatRate: number; sortOrder: number }

export default function PurchaseInvoiceFormPage() {
  const navigate = useNavigate()
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [invoiceType, setInvoiceType] = useState('A')
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])

  const { data: locations } = useQuery({ queryKey: ['stock-locations'], queryFn: stockService.getLocations })
  const { data: paymentConditions } = useQuery({ queryKey: ['payment-conditions'], queryFn: paramsService.getPaymentConditions })

  const addItem = () => setItems(prev => [...prev, { productId: 0, productName: '', quantity: 1, unitPrice: 0, discountPercentage: 0, vatRate: 21, sortOrder: prev.length }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof PurchaseItem, value: any) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice * (1 - it.discountPercentage / 100), 0)
  const vatTotal = items.reduce((acc, it) => { const net = it.quantity * it.unitPrice * (1 - it.discountPercentage / 100); return acc + net * (it.vatRate / 100) }, 0)

  const saveMutation = useMutation({
    mutationFn: (data: any) => purchasesService.create(data),
    onSuccess: () => { toast.success('Compra guardada'); navigate('/purchases') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const handleSave = () => {
    if (!selectedSupplier) return toast.error('Seleccione un proveedor')
    if (!selectedLocation) return toast.error('Seleccione locación de stock')
    if (items.length === 0) return toast.error('Agregue al menos un item')
    saveMutation.mutate({ supplierInvoiceNumber, invoiceType, invoiceDate, supplierId: selectedSupplier.id, paymentConditionId: selectedPayment?.id, stockLocationId: selectedLocation.id, notes, items: items.map(it => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice, discountPercentage: it.discountPercentage, vatRate: it.vatRate, sortOrder: it.sortOrder })) })
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Nueva Factura de Compra"
        actions={<>
          <button className="btn-secondary" onClick={() => navigate('/purchases')}><ArrowLeft className="w-4 h-4" /> Volver</button>
          <button className="btn-primary" onClick={handleSave} disabled={saveMutation.isPending}><Save className="w-4 h-4" /> Guardar</button>
        </>} />
      <div className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="form-group"><label className="label">Tipo</label>
          <select className="input" value={invoiceType} onChange={e => setInvoiceType(e.target.value)}><option value="A">A</option><option value="B">B</option><option value="C">C</option></select>
        </div>
        <div className="form-group"><label className="label">Fecha</label><input type="date" className="input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
        <div className="form-group"><label className="label">Número comprobante</label><input className="input" value={supplierInvoiceNumber} onChange={e => setSupplierInvoiceNumber(e.target.value)} /></div>
        <div className="form-group col-span-2">
          <SearchAutocomplete label="Proveedor *" value={selectedSupplier} onChange={setSelectedSupplier}
            onSearch={async (t) => { const r = await suppliersService.search(t); return r.map((s: any) => ({ id: s.id, label: s.businessName, sublabel: s.cuit })) }} />
        </div>
        <div className="form-group">
          <label className="label">Locación de Stock *</label>
          <SearchAutocomplete value={selectedLocation} onChange={setSelectedLocation}
            onSearch={async (t) => (locations ?? []).filter((l: any) => l.name.toLowerCase().includes(t.toLowerCase())).map((l: any) => ({ id: l.id, label: l.name }))} />
        </div>
        <div className="form-group">
          <label className="label">Cond. de Pago</label>
          <SearchAutocomplete value={selectedPayment} onChange={setSelectedPayment}
            onSearch={async (t) => (paymentConditions ?? []).filter((p: any) => p.name.toLowerCase().includes(t.toLowerCase())).map((p: any) => ({ id: p.id, label: p.name }))} />
        </div>
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Items</h3>
          <button className="btn-secondary btn-sm" onClick={addItem}><Plus className="w-4 h-4" /> Agregar</button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Producto</th><th>Cant.</th><th>Precio Unit.</th><th>Dto.%</th><th>IVA%</th><th>Subtotal</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin items</td></tr>}
              {items.map((item, idx) => {
                const net = item.quantity * item.unitPrice * (1 - item.discountPercentage / 100)
                return (
                  <tr key={idx}>
                    <td className="min-w-[200px]">
                      <SearchAutocomplete value={item.productId ? { id: item.productId, label: item.productName } : null}
                        onChange={opt => { if (opt) { updateItem(idx, 'productId', opt.id); updateItem(idx, 'productName', opt.label) } }}
                        onSearch={async (t) => { const r = await productsService.search(t); return r.map((p: any) => ({ id: p.id, label: p.name })) }} />
                    </td>
                    <td><input className="input w-20" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} /></td>
                    <td><input className="input w-28" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', +e.target.value)} /></td>
                    <td><input className="input w-20" type="number" min="0" max="100" value={item.discountPercentage} onChange={e => updateItem(idx, 'discountPercentage', +e.target.value)} /></td>
                    <td><select className="input w-20" value={item.vatRate} onChange={e => updateItem(idx, 'vatRate', +e.target.value)}>{[0, 10.5, 21, 27].map(v => <option key={v} value={v}>{v}%</option>)}</select></td>
                    <td className="font-mono font-medium">$ {net.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td><button className="text-red-500" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>$ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">IVA</span><span>$ {vatTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>$ {(subtotal + vatTotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
