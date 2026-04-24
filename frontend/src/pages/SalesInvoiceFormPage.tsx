import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService, clientsService, productsService, paramsService, stockService, priceListsService, usersService } from '../services'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import PageHeader from '../components/ui/PageHeader'
import PaymentsSection from '../components/payments/PaymentsSection'
import InstallmentPlanSection from '../components/payments/InstallmentPlanSection'
import { Plus, Trash2, Save, ArrowLeft, CheckCircle, XCircle, FileDown } from 'lucide-react'
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

// VAT options come from the backend parametrization (/params/vat-rates).
// Each VatRate row has an Id and its Rate; we use {id: vatRateId, label: "21%"} in the autocomplete.

export default function SalesInvoiceFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedPriceList, setSelectedPriceList] = useState<any>(null)
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<any>(null)
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [hydrated, setHydrated] = useState(false)

  const { data: locations } = useQuery({ queryKey: ['stock-locations'], queryFn: stockService.getLocations })
  const { data: paymentConditions } = useQuery({ queryKey: ['payment-conditions'], queryFn: paramsService.getPaymentConditions })
  const { data: priceLists } = useQuery({ queryKey: ['price-lists-all'], queryFn: () => priceListsService.getAll({ page: 1, pageSize: 200 }) })
  const { data: invoiceTypes } = useQuery({ queryKey: ['invoice-types', 'sales'], queryFn: paramsService.getInvoiceTypes })
  const { data: vatRates } = useQuery({ queryKey: ['vat-rates'], queryFn: paramsService.getVatRates })

  const salesInvoiceTypes = useMemo(() => (invoiceTypes ?? []).filter((it: any) => it.kind === 'sales' && it.isActive), [invoiceTypes])
  const activeVatRates = useMemo(() => (vatRates ?? []).filter((v: any) => v.isActive), [vatRates])
  const defaultVatRate = useMemo(() => activeVatRates.find((v: any) => v.isDefault)?.rate ?? 21, [activeVatRates])

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
    for (const it of priceListDetail?.items ?? []) {
      if (it.hasPriceConfigured) m.set(it.productId, it.finalPrice)
    }
    return m
  }, [priceListDetail])

  const invoiceTypeCode = selectedInvoiceType?.sublabel ?? 'A'

  // Hydrate form when editing
  useEffect(() => {
    if (!isEdit || !existingInvoice || hydrated) return
    const matchingType = salesInvoiceTypes.find((t: any) => t.code === existingInvoice.invoiceType)
    setSelectedInvoiceType(matchingType
      ? { id: matchingType.id, label: matchingType.name, sublabel: matchingType.code }
      : { id: 0, label: existingInvoice.invoiceType, sublabel: existingInvoice.invoiceType })
    setInvoiceDate(format(new Date(existingInvoice.invoiceDate), 'yyyy-MM-dd'))
    setNotes(existingInvoice.notes ?? '')
    setSelectedClient({ id: existingInvoice.clientId, label: existingInvoice.clientName, sublabel: existingInvoice.clientCuit })
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
  }, [existingInvoice, isEdit, hydrated, salesInvoiceTypes])

  useEffect(() => {
    if (hydrated) return
    if (!selectedInvoiceType && salesInvoiceTypes.length > 0) {
      const def = salesInvoiceTypes.find((t: any) => t.code === 'A') ?? salesInvoiceTypes[0]
      setSelectedInvoiceType({ id: def.id, label: def.name, sublabel: def.code })
    }
  }, [salesInvoiceTypes, hydrated, selectedInvoiceType])

  // Auto-fill price list + seller from client
  useEffect(() => {
    if (hydrated) return
    if (selectedClient?.defaultPriceListId) {
      setSelectedPriceList({ id: selectedClient.defaultPriceListId, label: selectedClient.defaultPriceListName ?? 'Lista' })
    }
    if (selectedClient?.assignedSellerId) {
      setSelectedSeller({ id: selectedClient.assignedSellerId, label: selectedClient.assignedSellerName ?? 'Vendedor' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id])

  const addItem = () => setItems(prev => [...prev, {
    productId: 0, productName: '',
    stockLocationId: 0, stockLocationName: '', stockOptions: [],
    quantity: 1, unitPrice: 0, discountPercentage: 0, vatRate: defaultVatRate, sortOrder: prev.length,
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

  const cancelMutation = useMutation({
    mutationFn: () => salesService.cancel(+id!),
    onSuccess: () => {
      toast.success('Factura anulada. Stock y pagos revertidos.')
      qc.invalidateQueries({ queryKey: ['sales-invoice', id] })
      qc.invalidateQueries({ queryKey: ['sales-payments', +id!] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al anular'),
  })

  const downloadPdf = async () => {
    try {
      const res = await salesService.getPdf(+id!)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `factura-${existingInvoice?.fullNumber ?? id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al descargar PDF') }
  }

  const handleSave = () => {
    if (!selectedClient) return toast.error('Seleccione un cliente')
    if (items.length === 0) return toast.error('Agregue al menos un item')
    if (items.some(it => !it.productId)) return toast.error('Falta elegir producto en algún item')
    if (items.some(it => !it.stockLocationId)) return toast.error('Falta elegir locación de stock en algún item')
    saveMutation.mutate({
      invoiceType: invoiceTypeCode, invoiceDate, clientId: selectedClient.id,
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
            {isEdit && existingInvoice?.status !== 'draft' && (
              <button className="btn-secondary" onClick={downloadPdf}><FileDown className="w-4 h-4" /> PDF</button>
            )}
            {isEdit && existingInvoice?.status === 'draft' && (
              <button className="btn-primary" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                <CheckCircle className="w-4 h-4" /> Confirmar
              </button>
            )}
            {(!isEdit || existingInvoice?.status === 'draft') && (
              <button className="btn-primary" onClick={handleSave} disabled={saveMutation.isPending}><Save className="w-4 h-4" /> Guardar</button>
            )}
            {isEdit && existingInvoice && existingInvoice.status !== 'cancelled' && existingInvoice.status !== 'draft' && (
              <button className="btn-secondary text-red-600" onClick={() => { if (confirm('¿Anular esta factura? Se revertirán pagos y stock.')) cancelMutation.mutate() }} disabled={cancelMutation.isPending}>
                <XCircle className="w-4 h-4" /> Anular
              </button>
            )}
          </>
        } />

      {/* Header */}
      <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <SearchAutocomplete label="Tipo" required value={selectedInvoiceType}
          onChange={setSelectedInvoiceType}
          onSearch={async (t) => salesInvoiceTypes.filter((it: any) => it.name.toLowerCase().includes((t ?? '').toLowerCase()) || it.code.toLowerCase().includes((t ?? '').toLowerCase()))
            .map((it: any) => ({ id: it.id, label: it.name, sublabel: it.code }))} />
        <div className="form-group">
          <label className="label">Fecha</label>
          <input type="date" className="input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
        </div>
        <SearchAutocomplete label="Lista de Precios" value={selectedPriceList} onChange={setSelectedPriceList}
          onSearch={async (t) => (priceLists?.items ?? []).filter((p: any) => p.name.toLowerCase().includes((t ?? '').toLowerCase())).map((p: any) => ({ id: p.id, label: p.name }))} />
        <div className="form-group col-span-2">
          <SearchAutocomplete label="Cliente *" value={selectedClient} onChange={setSelectedClient}
            onSearch={async (t) => {
              const r = await clientsService.search(t ?? '')
              return r.map((c: any) => ({ id: c.id, label: c.businessName, sublabel: c.cuit, defaultPriceListId: c.defaultPriceListId, defaultPriceListName: c.defaultPriceListName, assignedSellerId: c.assignedSellerId, assignedSellerName: c.assignedSellerName }))
            }} />
        </div>
        <SearchAutocomplete label="Vendedor" value={selectedSeller} onChange={setSelectedSeller}
          onSearch={async (t) => {
            const rs = await usersService.searchSellers(t ?? '')
            return rs.map((u: any) => ({ id: u.id, label: `${u.firstName} ${u.lastName}`, sublabel: u.email }))
          }} />
        <SearchAutocomplete label="Cond. de Pago" value={selectedPayment} onChange={setSelectedPayment}
          onSearch={async (t) => (paymentConditions ?? []).filter((p: any) => p.name.toLowerCase().includes((t ?? '').toLowerCase())).map((p: any) => ({ id: p.id, label: p.name }))} />
        <div className="form-group col-span-3">
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
                <th>IVA</th>
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
                          const r = await productsService.search(t ?? '')
                          return r.map((p: any) => ({ id: p.id, label: p.name, sublabel: `Stock: ${p.totalStock}`, stockByLocation: p.stockByLocation }))
                        }} />
                    </td>
                    <td className="min-w-[160px]">
                      <SearchAutocomplete value={item.stockLocationId ? { id: item.stockLocationId, label: item.stockLocationName } : null}
                        onChange={opt => { if (opt) updateItem(idx, { stockLocationId: opt.id, stockLocationName: opt.label }) }}
                        onSearch={async (t) => locationList.filter((l: any) => l.name.toLowerCase().includes((t ?? '').toLowerCase())).map((l: any) => ({ id: l.id, label: l.name, sublabel: item.productId && l.quantity !== undefined ? `Stock: ${l.quantity}` : undefined }))} />
                    </td>
                    <td><input className="input w-20" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, { quantity: +e.target.value })} /></td>
                    <td><input className="input w-28" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, { unitPrice: +e.target.value })} /></td>
                    <td><input className="input w-20" type="number" min="0" max="100" step="0.01" value={item.discountPercentage} onChange={e => updateItem(idx, { discountPercentage: +e.target.value })} /></td>
                    <td className="min-w-[110px]">
                      <select className="input w-24" value={item.vatRate}
                        onChange={e => updateItem(idx, { vatRate: +e.target.value })}>
                        {activeVatRates.length === 0 && <option value={item.vatRate}>{item.vatRate}%</option>}
                        {activeVatRates.map((v: any) => (
                          <option key={v.id} value={v.rate}>{v.name}</option>
                        ))}
                        {/* Preserve current value if it isn't in the active list (legacy invoices) */}
                        {activeVatRates.every((v: any) => +v.rate !== +item.vatRate) && activeVatRates.length > 0 && (
                          <option value={item.vatRate}>{item.vatRate}%</option>
                        )}
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

      {isEdit && existingInvoice && (
        <>
          <InstallmentPlanSection
            invoiceId={existingInvoice.id}
            invoiceFullNumber={existingInvoice.fullNumber}
            invoiceStatus={existingInvoice.status}
            balanceDue={+existingInvoice.balanceDue}
            defaultStartDate={invoiceDate}
          />
          <PaymentsSection
            kind="sales"
            invoiceId={existingInvoice.id}
            invoiceFullNumber={existingInvoice.fullNumber}
            invoiceStatus={existingInvoice.status}
            total={+existingInvoice.total}
            paidAmount={+existingInvoice.paidAmount}
            balanceDue={+existingInvoice.balanceDue}
          />
        </>
      )}
    </div>
  )
}
