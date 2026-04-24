import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { installmentPlansService, paymentMethodsService } from '../../services'
import Modal from '../ui/Modal'
import SearchAutocomplete from '../ui/SearchAutocomplete'
import Badge from '../ui/Badge'
import { CalendarDays, Plus, Trash2, Edit2, Banknote, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const FREQ_LABEL: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }
const FREQS = [
  { id: 1, label: 'Semanal', value: 'weekly' },
  { id: 2, label: 'Quincenal', value: 'biweekly' },
  { id: 3, label: 'Mensual', value: 'monthly' },
]

interface Props {
  invoiceId: number
  invoiceFullNumber?: string
  invoiceStatus?: string
  balanceDue: number
  defaultStartDate?: string
}

export default function InstallmentPlanSection({ invoiceId, invoiceFullNumber, invoiceStatus, balanceDue, defaultStartDate }: Props) {
  const qc = useQueryClient()
  const queryKey = ['installment-plan', invoiceId]
  const { data: plan } = useQuery({ queryKey, queryFn: () => installmentPlansService.getByInvoice(invoiceId), enabled: !!invoiceId })
  const { data: methods } = useQuery({ queryKey: ['payment-methods', 'active'], queryFn: () => paymentMethodsService.getAll(false) })

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<any>({ frequency: 'monthly', numberOfInstallments: 3, startDate: defaultStartDate ?? format(new Date(), 'yyyy-MM-dd') })
  const [selectedFreq, setSelectedFreq] = useState<any>({ id: 3, label: 'Mensual' })

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({ installmentId: 0, dueDate: '', amount: 0, cascade: true })

  const [payOpen, setPayOpen] = useState(false)
  const [payForm, setPayForm] = useState<any>({ installmentId: 0, paymentMethodId: 0, paymentDate: format(new Date(), 'yyyy-MM-dd'), amount: 0, reference: '', notes: '', balance: 0 })

  const createMut = useMutation({
    mutationFn: () => installmentPlansService.create(invoiceId, {
      frequency: FREQS.find(f => f.id === selectedFreq?.id)?.value ?? 'monthly',
      numberOfInstallments: +createForm.numberOfInstallments,
      startDate: createForm.startDate,
    }),
    onSuccess: () => {
      toast.success('Plan generado'); setCreateOpen(false)
      qc.invalidateQueries({ queryKey }); qc.invalidateQueries({ queryKey: ['sales-invoice'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const deleteMut = useMutation({
    mutationFn: () => installmentPlansService.delete(invoiceId),
    onSuccess: () => { toast.success('Plan anulado'); qc.invalidateQueries({ queryKey }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const updateMut = useMutation({
    mutationFn: () => installmentPlansService.updateInstallment(invoiceId, editForm.installmentId, { dueDate: editForm.dueDate, amount: +editForm.amount, cascade: !!editForm.cascade }),
    onSuccess: () => { toast.success('Cuota actualizada'); setEditOpen(false); qc.invalidateQueries({ queryKey }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  })

  const payMut = useMutation({
    mutationFn: () => installmentPlansService.pay(invoiceId, payForm.installmentId, {
      paymentMethodId: +payForm.paymentMethodId,
      paymentDate: new Date(payForm.paymentDate).toISOString(),
      amount: +payForm.amount,
      reference: payForm.reference || null,
      notes: payForm.notes || null,
    }),
    onSuccess: () => {
      toast.success('Pago registrado'); setPayOpen(false)
      qc.invalidateQueries({ queryKey })
      qc.invalidateQueries({ queryKey: ['sales-invoice', invoiceId] })
      qc.invalidateQueries({ queryKey: ['sales-payments', invoiceId] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const fmt = (n: any) => `$ ${(+(n ?? 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  const canCreate = (invoiceStatus === 'confirmed' || invoiceStatus === 'partially_paid') && balanceDue > 0 && !plan

  const openEdit = (i: any) => {
    setEditForm({ installmentId: i.id, dueDate: format(new Date(i.dueDate), 'yyyy-MM-dd'), amount: +i.amount, cascade: true })
    setEditOpen(true)
  }
  const openPay = (i: any) => {
    const bal = +i.balanceDue
    setPayForm({ installmentId: i.id, paymentMethodId: methods?.[0]?.id ?? 0, paymentDate: format(new Date(), 'yyyy-MM-dd'), amount: bal, reference: '', notes: '', balance: bal })
    setPayOpen(true)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Plan de pagos</h3>
          {plan && <Badge variant={plan.status === 'completed' ? 'green' : 'blue'}>{plan.status === 'completed' ? 'Completado' : 'Activo'}</Badge>}
        </div>
        {canCreate && (
          <button className="btn-primary btn-sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Generar plan</button>
        )}
        {plan && plan.status !== 'completed' && (
          <button className="btn-secondary btn-sm text-red-600" onClick={() => { if (confirm('¿Anular el plan de pagos?')) deleteMut.mutate() }}><Trash2 className="w-4 h-4" /> Anular plan</button>
        )}
      </div>

      {!plan ? (
        <div className="text-sm text-gray-400 py-4 text-center">
          {canCreate ? 'Esta factura no tiene plan de pagos. Podés generar uno.' : 'Disponible al confirmar la factura.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
            <div className="rounded bg-gray-50 dark:bg-gray-800 px-3 py-2"><div className="text-xs text-gray-500">Frecuencia</div><div className="font-semibold">{FREQ_LABEL[plan.frequency] ?? plan.frequency}</div></div>
            <div className="rounded bg-gray-50 dark:bg-gray-800 px-3 py-2"><div className="text-xs text-gray-500">Cuotas</div><div className="font-semibold">{plan.numberOfInstallments}</div></div>
            <div className="rounded bg-green-50 dark:bg-green-900/30 px-3 py-2"><div className="text-xs text-gray-500">Pagado</div><div className="font-semibold text-green-700 dark:text-green-400">{fmt(plan.totalPaid)}</div></div>
            <div className={`rounded px-3 py-2 ${plan.balanceDue > 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}><div className="text-xs text-gray-500">Saldo</div><div className={`font-semibold ${plan.balanceDue > 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>{fmt(plan.balanceDue)}</div></div>
          </div>

          {plan.overdueCount > 0 && (
            <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {plan.overdueCount} cuota(s) vencida(s) sin pagar.
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead><tr><th>#</th><th>Vencimiento</th><th className="text-right">Monto</th><th className="text-right">Pagado</th><th className="text-right">Saldo</th><th>Estado</th><th className="w-28"></th></tr></thead>
              <tbody>
                {plan.installments.map((i: any) => {
                  const statusVariant = i.status === 'paid' ? 'green' : i.status === 'overdue' ? 'red' : i.status === 'partially_paid' ? 'yellow' : 'gray'
                  const statusLabel = i.status === 'paid' ? 'Pagada' : i.status === 'overdue' ? 'Vencida' : i.status === 'partially_paid' ? 'Parcial' : 'Pendiente'
                  return (
                    <tr key={i.id} className={i.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      <td className="font-mono">{i.sequenceNumber}/{plan.numberOfInstallments}</td>
                      <td>{format(new Date(i.dueDate), 'dd/MM/yyyy')}</td>
                      <td className="text-right font-mono">{fmt(i.amount)}</td>
                      <td className="text-right font-mono text-green-700 dark:text-green-400">{fmt(i.paidAmount)}</td>
                      <td className="text-right font-mono font-semibold">{fmt(i.balanceDue)}</td>
                      <td><Badge variant={statusVariant as any}>{statusLabel}</Badge></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {i.balanceDue > 0 && (
                            <button className="btn-ghost btn-sm p-1 text-green-700" title="Registrar pago" onClick={() => openPay(i)}>
                              <Banknote className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {i.paidAmount === 0 && plan.status !== 'completed' && (
                            <button className="btn-ghost btn-sm p-1" title="Editar" onClick={() => openEdit(i)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create plan modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={`Generar plan de pagos ${invoiceFullNumber ?? ''}`}
        footer={<><button className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancelar</button><button className="btn-primary" onClick={() => createMut.mutate()} disabled={createMut.isPending}>Generar</button></>}>
        <div className="space-y-3">
          <div className="rounded bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm flex justify-between"><span>Saldo pendiente</span><span className="font-semibold">{fmt(balanceDue)}</span></div>
          <SearchAutocomplete label="Frecuencia" value={selectedFreq} onChange={setSelectedFreq}
            onSearch={async (t) => FREQS.filter(f => f.label.toLowerCase().includes((t ?? '').toLowerCase()))} />
          <div className="form-group"><label className="label">Cantidad de cuotas</label><input className="input" type="number" min="1" value={createForm.numberOfInstallments} onChange={e => setCreateForm((f: any) => ({ ...f, numberOfInstallments: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Fecha primera cuota</label><input type="date" className="input" value={createForm.startDate} onChange={e => setCreateForm((f: any) => ({ ...f, startDate: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Edit installment */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar cuota"
        footer={<><button className="btn-secondary" onClick={() => setEditOpen(false)}>Cancelar</button><button className="btn-primary" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>Guardar</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Fecha vencimiento</label><input type="date" className="input" value={editForm.dueDate} onChange={e => setEditForm((f: any) => ({ ...f, dueDate: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Monto</label><input type="number" step="0.01" className="input" value={editForm.amount} onChange={e => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!editForm.cascade} onChange={e => setEditForm((f: any) => ({ ...f, cascade: e.target.checked }))} />
            Recalcular fechas de las cuotas siguientes no pagadas
          </label>
        </div>
      </Modal>

      {/* Pay installment */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pagar cuota"
        footer={<><button className="btn-secondary" onClick={() => setPayOpen(false)}>Cancelar</button><button className="btn-primary" onClick={() => payMut.mutate()} disabled={payMut.isPending}>Registrar</button></>}>
        <div className="space-y-3">
          <div className="rounded bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm flex justify-between"><span>Saldo de la cuota</span><span className="font-semibold">{fmt(payForm.balance)}</span></div>
          <SearchAutocomplete label="Forma de pago" required
            value={payForm.paymentMethodId ? { id: payForm.paymentMethodId, label: (methods ?? []).find((m: any) => m.id === payForm.paymentMethodId)?.name ?? '' } : null}
            onChange={opt => setPayForm((f: any) => ({ ...f, paymentMethodId: opt?.id ?? 0 }))}
            onSearch={async (t) => (methods ?? []).filter((m: any) => m.name.toLowerCase().includes((t ?? '').toLowerCase())).map((m: any) => ({ id: m.id, label: m.name, sublabel: m.affectsCash ? 'Afecta caja' : '' }))} />
          <div className="form-group"><label className="label">Fecha</label><input type="date" className="input" value={payForm.paymentDate} onChange={e => setPayForm((f: any) => ({ ...f, paymentDate: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Monto</label><input type="number" step="0.01" max={payForm.balance} className="input" value={payForm.amount} onChange={e => setPayForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Referencia</label><input className="input" value={payForm.reference} onChange={e => setPayForm((f: any) => ({ ...f, reference: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Notas</label><input className="input" value={payForm.notes} onChange={e => setPayForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
