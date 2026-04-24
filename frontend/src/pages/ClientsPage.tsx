import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsService, paramsService, priceListsService, usersService, clientDocsService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import DocumentsSection from '../components/uploads/DocumentsSection'
import { Plus, Edit2, Trash2, RotateCcw, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { useCanAccess } from '../hooks/useCanAccess'

export default function ClientsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const can = useCanAccess('clients')
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [selectedClientType, setSelectedClientType] = useState<any>(null)
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedVat, setSelectedVat] = useState<any>(null)
  const [selectedPayCond, setSelectedPayCond] = useState<any>(null)

  useEffect(() => {
    if (!modal.open) return
    if (!modal.data?.id) {
      setSelectedClientType(null); setSelectedZone(null); setSelectedSeller(null)
      setSelectedVat(null); setSelectedPayCond(null); setSelectedPriceList(null)
      setForm({})
      return
    }
    clientsService.getById(modal.data.id).then((full: any) => {
      setForm(full)
      setSelectedClientType(full.clientTypeId ? { id: full.clientTypeId, label: full.clientTypeName ?? '' } : null)
      setSelectedZone(full.zoneId ? { id: full.zoneId, label: full.zoneName ?? '' } : null)
      setSelectedSeller(full.assignedSellerId ? { id: full.assignedSellerId, label: full.assignedSellerName ?? '' } : null)
      setSelectedVat(full.vatConditionId ? { id: full.vatConditionId, label: full.vatConditionName ?? '' } : null)
      setSelectedPayCond(full.paymentConditionId ? { id: full.paymentConditionId, label: full.paymentConditionName ?? '' } : null)
      setSelectedPriceList(full.defaultPriceListId ? { id: full.defaultPriceListId, label: full.defaultPriceListName ?? '' } : null)
    })
  }, [modal.open, modal.data?.id])

  // Cascade: client type → default price list
  useEffect(() => {
    if (!selectedClientType) return
    const ct = (clientTypes ?? []).find((c: any) => c.id === selectedClientType.id)
    if (ct?.defaultPriceListId && !selectedPriceList) {
      setSelectedPriceList({ id: ct.defaultPriceListId, label: ct.defaultPriceListName ?? 'Lista' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientType?.id])

  // Cascade: zone → default seller
  useEffect(() => {
    if (!selectedZone) return
    const z = (zones ?? []).find((zz: any) => zz.id === selectedZone.id)
    if (z?.defaultSellerId && !selectedSeller) {
      setSelectedSeller({ id: z.defaultSellerId, label: z.defaultSellerName ?? 'Vendedor' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone?.id])

  const [selectedPriceList, setSelectedPriceList] = useState<any>(null)

  const [showDeleted, setShowDeleted] = useState(false)
  const { data: clients, isLoading, refetch } = useQuery({ queryKey: ['clients', showDeleted], queryFn: () => clientsService.getAll({ page: 1, pageSize: 200, includeDeleted: showDeleted }) })
  const { data: clientTypes } = useQuery({ queryKey: ['client-types'], queryFn: paramsService.getClientTypes })
  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: paramsService.getZones })
  const { data: vatConditions } = useQuery({ queryKey: ['vat-conditions'], queryFn: paramsService.getVatConditions })
  const { data: paymentConditions } = useQuery({ queryKey: ['payment-conditions'], queryFn: paramsService.getPaymentConditions })
  const { data: priceLists } = useQuery({ queryKey: ['price-lists-all'], queryFn: () => priceListsService.getAll({ page: 1, pageSize: 200 }) })

  const saveMutation = useMutation({
    mutationFn: (data: any) => modal.data?.id ? clientsService.update(modal.data.id, data) : clientsService.create(data),
    onSuccess: () => { toast.success('Cliente guardado'); qc.invalidateQueries({ queryKey: ['clients'] }); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsService.delete(id),
    onSuccess: () => { toast.success('Cliente eliminado'); qc.invalidateQueries({ queryKey: ['clients'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => clientsService.restore(id),
    onSuccess: () => { toast.success('Cliente restaurado'); qc.invalidateQueries({ queryKey: ['clients'] }) }
  })

  const openNew = () => { setModal({ open: true }) }
  const openEdit = (row: any) => { setModal({ open: true, data: row }) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      ...form,
      clientTypeId: selectedClientType?.id ?? null,
      zoneId: selectedZone?.id ?? null,
      assignedSellerId: selectedSeller?.id ?? null,
      vatConditionId: selectedVat?.id ?? null,
      paymentConditionId: selectedPayCond?.id ?? null,
      defaultPriceListId: selectedPriceList?.id ?? null,
    })
  }

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '90px' },
    { key: 'businessName', header: 'Razón Social' },
    { key: 'cuit', header: 'CUIT', width: '130px' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Teléfono', width: '120px' },
    { key: 'clientTypeName', header: 'Tipo' },
    { key: 'zoneName', header: 'Zona' },
    { key: 'isActive', header: 'Estado', render: (r) => r.isDeleted ? <Badge variant="red">Eliminado</Badge> : <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${clients?.totalCount ?? 0} registros`}
        actions={can.write && <button className="btn-primary" onClick={openNew}><Plus className="w-4 h-4" /> Nuevo Cliente</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={clients?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="clientes"
          rowClassName={(r: any) => r.isDeleted ? 'opacity-60' : ''}
          toolbar={
            <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 select-none ml-2">
              <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} />
              Ver eliminados
            </label>
          }
          actions={(row: any) => (
            <>
              {!row.isDeleted && <button className="btn-ghost btn-sm p-1" onClick={() => navigate(`/clients/${row.id}/account`)} title="Cuenta corriente"><Wallet className="w-3.5 h-3.5" /></button>}
              {!row.isDeleted && can.write && <button className="btn-ghost btn-sm p-1" onClick={() => openEdit(row)} title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>}
              {!row.isDeleted && can.delete && <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)} title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>}
              {row.isDeleted && can.write && <button className="btn-ghost btn-sm p-1 text-green-600" onClick={() => restoreMutation.mutate(row.id)} title="Reactivar"><RotateCcw className="w-3.5 h-3.5" /></button>}
            </>
          )}
        />
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Cliente' : 'Nuevo Cliente'} size="2xl"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>Guardar</button>
          </>
        }>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Código *</label><input className="input" required value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} disabled={!!modal.data} /></div>
          <div className="form-group"><label className="label">Razón Social *</label><input className="input" required value={form.businessName ?? ''} onChange={e => setForm((f: any) => ({ ...f, businessName: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Nombre Comercial</label><input className="input" value={form.tradeName ?? ''} onChange={e => setForm((f: any) => ({ ...f, tradeName: e.target.value }))} /></div>
          <div className="form-group"><label className="label">CUIT</label><input className="input" value={form.cuit ?? ''} onChange={e => setForm((f: any) => ({ ...f, cuit: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Email</label><input className="input" type="email" value={form.email ?? ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Teléfono</label><input className="input" value={form.phone ?? ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Ciudad</label><input className="input" value={form.city ?? ''} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Dirección</label><input className="input" value={form.address ?? ''} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} /></div>
          <SearchAutocomplete label="Tipo de Cliente" value={selectedClientType} onChange={setSelectedClientType}
            onSearch={async (t) => (clientTypes ?? []).filter((c: any) => c.name.toLowerCase().includes((t ?? '').toLowerCase())).map((c: any) => ({ id: c.id, label: c.name }))} />
          <SearchAutocomplete label="Zona" value={selectedZone} onChange={setSelectedZone}
            onSearch={async (t) => (zones ?? []).filter((z: any) => z.name.toLowerCase().includes((t ?? '').toLowerCase())).map((z: any) => ({ id: z.id, label: z.name }))} />
          <SearchAutocomplete label="Cond. IVA" value={selectedVat} onChange={setSelectedVat}
            onSearch={async (t) => (vatConditions ?? []).filter((v: any) => v.name.toLowerCase().includes((t ?? '').toLowerCase())).map((v: any) => ({ id: v.id, label: v.name }))} />
          <SearchAutocomplete label="Cond. de Pago" value={selectedPayCond} onChange={setSelectedPayCond}
            onSearch={async (t) => (paymentConditions ?? []).filter((p: any) => p.name.toLowerCase().includes((t ?? '').toLowerCase())).map((p: any) => ({ id: p.id, label: p.name }))} />
          <SearchAutocomplete label="Vendedor asignado" value={selectedSeller} onChange={setSelectedSeller}
            onSearch={async (t) => { const rs = await usersService.searchSellers(t ?? ''); return rs.map((u: any) => ({ id: u.id, label: `${u.firstName} ${u.lastName}`, sublabel: u.email })) }} />
          <SearchAutocomplete label="Lista de Precios" value={selectedPriceList} onChange={setSelectedPriceList}
            onSearch={async (t) => (priceLists?.items ?? []).filter((p: any) => p.name.toLowerCase().includes((t ?? '').toLowerCase())).map((p: any) => ({ id: p.id, label: p.name }))} />
          <div className="form-group col-span-2"><label className="label">Notas</label><textarea className="input" rows={2} value={form.notes ?? ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
        </form>

        {modal.data?.id && (
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <DocumentsSection kind="client" entityId={modal.data.id}
              getDocuments={clientDocsService.getDocuments}
              uploadDocument={clientDocsService.uploadDocument}
              deleteDocument={clientDocsService.deleteDocument} />
          </div>
        )}
      </Modal>
    </div>
  )
}
