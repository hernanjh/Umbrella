import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService, clientsService, productsService, paramsService, stockService, priceListsService } from '../services'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import PageHeader from '../components/ui/PageHeader'
import PaymentsSection from '../components/payments/PaymentsSection'
import { Plus, Trash2, Save, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface InvoiceItem {
  productId: number
  productName: string
  stockLocationId: number
  stockLocationName: string
  stockOptions: { id: number; name: string; quantity: number }[]
  quantity: number
  unitPrice: number
  discountPercentage: number
  vatRate: number
  sortOrder: number
}

export default function SalesInvoiceFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedPriceList, setSelectedPriceList] = useState<any>(null)
  const [invoiceType, setInvoiceType] = useState('A')
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [hydrated, setHydrated] = useState(false)

  const { data: locations } = useQuery({ queryKey: ['stock-locations'], queryFn: stockService.getLocations })
  const { data: paymentConditions } = useQuery({ queryKey: ['payment-conditions'], queryFn: paramsService.getPaymentConditions })
  const { data: priceLists } = useQuery({ queryKey: ['price-lists-all'], queryFn: () => priceListsService.getAll({ page: 1, pageSize: 200 }) })

  const { data: existingInvoice } = useQuery({
    queryKey: ['sales-invoice', id],
    queryFn: () => salesService.getById(+id!),
    enabled: isEdit,
  })

  const { data: priceListDetail } = useQuery({
    queryKey: ['price-list', selectedPriceList?.id],
    queryFn: () => priceListsService.getById(selectedPriceList.id),
    enabled: !!selectedPriceList?.id,
  })

  const priceByProduct = useMemo(() => {
    const m = new Map<number, number>()
    for (const it of priceListDetail?.items ?? []) m.set(it.productId, it.finalPrice)
    return m
  }, [priceListDetail])

  // Hydrate form when editing
  useEffect(() => {
    if (!isEdit || !existingInvoice || hydrated) return
    setInvoiceType(existingInvoice.invoiceType)
    setInvoiceDate(format(new Date(existingInvoice.invoiceDate), 'yyyy-MM-dd'))
    setNotes(existingInvoice.notes ?? '')
    setSelectedClient({
      id: existingInvoice.clientId,
      label: existingInvoice.clientName,
      sublabel: existingInvoice.clientCuit,
    })
    if (existingInvoice.sellerId) setSelectedSeller({ id: existingInvoice.sellerId, label: existingInvoice.sellerName })
    if (existingInvoice.priceListId) setSelectedPriceList({ id: existingInvoice.priceListId, label: existingInvoice.priceListName })
    if (existingInvoice.paymentConditionId) setSelectedPayment({ id: existingInvoice.paymentConditionId, label: existingInvoice.paymentConditionName })
    setItems((existingInvoice.items ?? []).map((it: any) => ({
      productId: it.productId,
      productName: it.productName,
      stockLocationId: it.stockLocationId ?? existingInvoice.stockLocationId,
      stockLocationName: it.stockLocationName ?? existingInvoice.stockLocationName ?? '',
      stockOptions: [],
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountPercentage: it.discountPercentage,
      vatRate: it.vatRate,
      sortOrder: it.sortOrder,
    })))
    setHydrated(true)
  }, [existingInvoice, isEdit, hydrated])

  useEffect(() => {
    if (hydrated) return
    if (selectedClient?.defaultPriceListId) {
      setSelectedPriceList({ id: selectedClient.defaultPriceListId, label: selectedClient.defaultPriceListName ?? 'Lista' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id])

  const addItem = () => setItems(prev => [...prev, {
    productId: 0, productName: '',
    stockLocationId: 0, stockLocationName: '', stockOptions: [],
    quantity: 1, unitPrice: 0, discountPercentage: 0, vatRate: 21, sortOrder: prev.length,
  }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item))

  const onProductSelected = (idx: number, opt: any) => {
    const priceFromList = priceByProduct.get(opt.id)
    const stockOpts = (opt.stockByLocation ?? []) as { stockLocationId: number; stockLocationName: string; quantity: number }[]
    const withStock = stockOpts.filter(s => s.quantity > 0)
    const defaultLoc = withStock.length === 1 ? withStock[0] : stockOpts.length === 1 ? stockOpts[0] : null
    const allLocs = (locations ?? []) as { id: number; name: string }[]
    const normalized = stockOpts.length > 0
      ? stockOpts.map(s => ({ id: s.stockLocationId, name: s.stockLocationName, quantity: s.quantity }))
      : allLocs.map(l => ({ id: l.id, name: l.name, quantity: 0 }))
    updateItem(idx, {
      productId: opt.id,
      productName: opt.label,
      unitPrice: priceFromList ?? 0,
      stockLocationId: defaultLoc ? defaultLoc.stockLocationId : 0,
      stockLocationName: defaultLoc ? defaultLoc.stockLocationName : '',
      stockOptions: normalized,
    })
    if (selectedPriceList && priceFromList === undefined) toast.error(`"${opt.label}" no está en la lista "${selectedPriceList.label}"`)
  }

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice * (1 - it.discountPercentage / 100), 0)
  const vatTotal = items.reduce((acc, it) => { const net = it.quantity * it.unitPrice * (1 - it.discountPercentage / 100); return acc + net * (it.vatRate / 100) }, 0)
  const total = subtotal + vatTotal

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEdit ? salesService.update(+id!, data) : salesService.create(data),
    onSuccess: () => { toast.success('Factura guardada'); navigate('/sales') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar')
  })

  const confirmMutation = useMutation({
    mutationFn: () => salesService.confirm(+id!),
    onSuccess: () => {
      toast.success('Factura confirmada. Stock descontado.')
      qc.invalidateQueries({ queryKey: ['sales-invoice', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al confirmar'),
  })

  const handleSave = () => {
    if (!selectedClient) return toast.error('Seleccione un cliente')
    if (items.length === 0) return toast.error('Agregue al menos un item')
    if (items.some(it => !it.productId)) return toast.error('Falta elegir producto en algún item')
    if (items.some(it => !it.stockLocationId)) return toast.error('Falta elegir locación de stock en algún item')
    saveMutation.mutate({
      invoiceType, invoiceDate, clientId: selectedClient.id,
      sellerId: selectedSeller?.id, paymentConditionId: selectedPayment?.id,
      priceListId: selectedPriceList?.id,
      stockLocationId: items[0]?.stockLocationId,
      notes,
      items: items.map(it => ({
        productId: it.productId,
        stockLocationId: it.stockLocationId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercentage: it.discountPercentage,
        vatRate: it.vatRate,
        sortOrder: it.sortOrder,
      }))
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? `Factura de Venta ${existingInvoice?.fullNumber ?? ''}` : 'Nueva Factura de Venta'}
        subtitle={isEdit && existingInvoice ? `Estado: ${existingInvoice.status}` : undefined}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/sales')}><ArrowLeft className="w-4 h-4" /> Volver</button>
            {isEdit && existingInvoice?.status === 'draft' && (
              <button className="btn-primary" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                <CheckCircle className="w-4 h-4" /> Confirmar
              </button>
            )}
            {(!isEdit || existingInvoice?.status === 'draft') && (
              <button className="btn-primary" onClick={handleSave} disabled={saveMutation.isPending}><Save className="w-4 h-4" /> Guardar</button>
            )}
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
          <label className="label">Lista de Precios</label>
          <select className="input" value={selectedPriceList?.id ?? ''}
            onChange={e => {
              const pl = (priceLists?.items ?? []).find((p: any) => p.id === +e.target.value)
              setSelectedPriceList(pl ? { id: pl.id, label: pl.name } : null)
            }}>
            <option value="">— Sin lista —</option>
            {(priceLists?.items ?? []).map((pl: any) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
          </select>
        </div>
        <div className="form-group col-span-2">
          <SearchAutocomplete label="Cliente *" value={selectedClient} onChange={setSelectedClient}
            onSearch={async (t) => {
              const r = await clientsService.search(t)
              return r.map((c: any) => ({ id: c.id, label: c.businessName, sublabel: c.cuit, defaultPriceListId: c.defaultPriceListId, defaultPriceListName: c.defaultPriceListName }))
            }} />
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
            <thead>
              <tr>
                <th>Producto</th>
                <th>Locación</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Dto.%</th>
                <th>IVA%</th>
                <th>Subtotal</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Sin items</td></tr>}
              {items.map((item, idx) => {
                const net = item.quantity * item.unitPrice * (1 - item.discountPercentage / 100)
                const lineTotal = net * (1 + item.vatRate / 100)
                const locationList = item.stockOptions.length > 0
                  ? item.stockOptions
                  : (locations ?? []).map((l: any) => ({ id: l.id, name: l.name, quantity: 0 }))
                return (
                  <tr key={idx}>
                    <td className="min-w-[200px]">
                      <SearchAutocomplete value={item.productId ? { id: item.productId, label: item.productName } : null}
                        onChange={opt => { if (opt) onProductSelected(idx, opt) }}
                        onSearch={async (t) => {
                          const r = await productsService.search(t)
                          return r.map((p: any) => ({ id: p.id, label: p.name, sublabel: `Stock: ${p.totalStock}`, stockByLocation: p.stockByLocation }))
                        }} />
                    </td>
                    <td className="min-w-[160px]">
                      <select className="input w-40 text-xs" value={item.stockLocationId || ''}
                        onChange={e => {
                          const locId = +e.target.value
                          const loc = locationList.find((l: any) => l.id === locId)
                          updateItem(idx, { stockLocationId: locId, stockLocationName: loc?.name ?? '' })
                        }}>
                        <option value="">— Elegir —</option>
                        {locationList.map((l: any) => (
                          <option key={l.id} value={l.id}>
                            {l.name}{item.productId && l.quantity !== undefined ? ` (${l.quantity})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td><input className="input w-20" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, { quantity: +e.target.value })} /></td>
                    <td><input className="input w-28" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, { unitPrice: +e.target.value })} /></td>
                    <td><input className="input w-20" type="number" min="0" max="100" step="0.01" value={item.discountPercentage} onChange={e => updateItem(idx, { discountPercentage: +e.target.value })} /></td>
                    <td>
                      <select className="input w-20" value={item.vatRate} onChange={e => updateItem(idx, { vatRate: +e.target.value })}>
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

      {/* Payments (only when invoice exists) */}
      {isEdit && existingInvoice && (
        <PaymentsSection
          kind="sales"
          invoiceId={existingInvoice.id}
          invoiceFullNumber={existingInvoice.fullNumber}
          invoiceStatus={existingInvoice.status}
          total={+existingInvoice.total}
          paidAmount={+existingInvoice.paidAmount}
          balanceDue={+existingInvoice.balanceDue}
        />
      )}
    </div>
  )
}
