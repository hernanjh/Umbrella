import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentMethodsService, salesPaymentsService, purchasePaymentsService } from '../../services'
import Modal from '../ui/Modal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Props {
  open: boolean
  onClose: () => void
  kind: 'sales' | 'purchase'
  invoiceId: number
  invoiceFullNumber?: string
  balanceDue: number
  onSaved?: () => void
}

export default function RegisterPaymentModal({ open, onClose, kind, invoiceId, invoiceFullNumber, balanceDue, onSaved }: Props) {
  const qc = useQueryClient()
  const { data: methods } = useQuery({ queryKey: ['payment-methods', 'active'], queryFn: () => paymentMethodsService.getAll(false) })
  const [form, setForm] = useState<any>({
    paymentMethodId: 0,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    reference: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        paymentMethodId: (methods && methods[0]?.id) || 0,
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        amount: +balanceDue.toFixed(2),
        reference: '',
        notes: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, methods?.length])

  const save = useMutation({
    mutationFn: async (payload: any) => {
      return kind === 'sales'
        ? await salesPaymentsService.create(invoiceId, payload)
        : await purchasePaymentsService.create(invoiceId, payload)
    },
    onSuccess: () => {
      toast.success('Pago registrado')
      qc.invalidateQueries({ queryKey: [kind === 'sales' ? 'sales-payments' : 'purchase-payments', invoiceId] })
      qc.invalidateQueries({ queryKey: [kind === 'sales' ? 'sales-invoice' : 'purchase-invoice'] })
      onSaved?.()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al registrar pago'),
  })

  const submit = () => {
    if (!form.paymentMethodId) return toast.error('Seleccione forma de pago')
    if (!form.amount || +form.amount <= 0) return toast.error('Monto inválido')
    save.mutate({
      paymentMethodId: +form.paymentMethodId,
      paymentDate: new Date(form.paymentDate).toISOString(),
      amount: +form.amount,
      reference: form.reference || null,
      notes: form.notes || null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={`Registrar pago ${invoiceFullNumber ? `- ${invoiceFullNumber}` : ''}`}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={submit} disabled={save.isPending}>Guardar</button></>}>
      <div className="space-y-3">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 flex justify-between">
          <span>Saldo pendiente</span>
          <span className="font-semibold">$ {balanceDue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="form-group">
          <label className="label">Forma de pago</label>
          <select className="input" value={form.paymentMethodId} onChange={e => setForm((f: any) => ({ ...f, paymentMethodId: +e.target.value }))}>
            <option value={0}>— Seleccionar —</option>
            {(methods ?? []).map((m: any) => <option key={m.id} value={m.id}>{m.name}{m.affectsCash ? ' (caja)' : ''}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="label">Fecha</label><input type="date" className="input" value={form.paymentDate} onChange={e => setForm((f: any) => ({ ...f, paymentDate: e.target.value }))} /></div>
        <div className="form-group"><label className="label">Monto *</label><input type="number" min="0.01" step="0.01" max={balanceDue} className="input" value={form.amount} onChange={e => setForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
        <div className="form-group"><label className="label">Referencia (nro de transferencia, cheque, etc.)</label><input className="input" value={form.reference} onChange={e => setForm((f: any) => ({ ...f, reference: e.target.value }))} /></div>
        <div className="form-group"><label className="label">Notas</label><input className="input" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
      </div>
    </Modal>
  )
}
