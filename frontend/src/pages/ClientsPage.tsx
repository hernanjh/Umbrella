import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsService, paramsService, priceListsService, usersService } from '../services'
import DataGrid, { Column } from '../components/ui/DataGrid'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import { Plus, Edit2, Trash2, RotateCcw, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'
import { useNavigate } from 'react-router-dom'

export default function ClientsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [selectedClientType, setSelectedClientType] = useState<any>(null)
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedVat, setSelectedVat] = useState<any>(null)
  const [selectedPayCond, setSelectedPayCond] = useState<any>(null)

  useEffect(() => {
    if (modal.open) {
      const d = modal.data
      setSelectedClientType(d?.clientTypeId ? { id: d.clientTypeId, label: d.clientTypeName ?? '' } : null)
      setSelectedZone(d?.zoneId ? { id: d.zoneId, label: d.zoneName ?? '' } : null)
      setSelectedSeller(d?.assignedSellerId ? { id: d.assignedSellerId, label: d.assignedSellerName ?? '' } : null)
      setSelectedVat(d?.vatConditionId ? { id: d.vatConditionId, label: d.vatConditionName ?? '' } : null)
      setSelectedPayCond(d?.paymentConditionId ? { id: d.paymentConditionId, label: d.paymentConditionName ?? '' } : null)
    }
  }, [modal.open, modal.data])

  const [selectedPriceList, setSelectedPriceList] = useState<any>(null)

  useEffect(() => {
    if (modal.open) {
      const d = modal.data
      setSelectedPriceList(d?.defaultPriceListId ? { id: d.defaultPriceListId, label: d.defaultPriceListName ?? '' } : null)
    }
  }, [modal.open, modal.data])

  const { data: clients, isLoading, refetch } = useQuery({ queryKey: ['clients'], queryFn: () => clientsService.getAll({ page: 1, pageSize: 200 }) })
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

  const openNew = () => { setForm({}); setSelectedClientType(null); setSelectedZone(null); setSelectedSeller(null); setModal({ open: true }) }
  const openEdit = (row: any) => { setForm(row); setModal({ open: true, data: row }) }

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
    { key: 'isActive', header: 'Estado', render: (r) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${clients?.totalCount ?? 0} registros`}
        actions={<button className="btn-primary" onClick={openNew}><Plus className="w-4 h-4" /> Nuevo Cliente</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={clients?.items ?? []} loading={isLoading} onRefresh={refetch} exportFileName="clientes"
          actions={(row) => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => navigate(`/clients/${row.id}/account`)} title="Cuenta corriente"><Wallet className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost btn-sm p-1" onClick={() => openEdit(row)}><Edit2 className="w-3.5 h-3.5" /></button>
              {!row.isDeleted
                ? <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                : <button className="btn-ghost btn-sm p-1 text-green-500" onClick={() => restoreMutation.mutate(row.id)}><RotateCcw className="w-3.5 h-3.5" /></button>
              }
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
      </Modal>
    </div>
  )
}
