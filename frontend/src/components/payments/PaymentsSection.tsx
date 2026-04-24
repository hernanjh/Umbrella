import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesPaymentsService, purchasePaymentsService } from '../../services'
import RegisterPaymentModal from './RegisterPaymentModal'
import { Plus, Trash2, Banknote } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Props {
  kind: 'sales' | 'purchase'
  invoiceId: number
  invoiceFullNumber?: string
  invoiceStatus?: string
  total: number
  paidAmount: number
  balanceDue: number
  onPaymentsChanged?: () => void
}

export default function PaymentsSection({ kind, invoiceId, invoiceFullNumber, invoiceStatus, total, paidAmount, balanceDue, onPaymentsChanged }: Props) {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)

  const svc = kind === 'sales' ? salesPaymentsService : purchasePaymentsService
  const { data: payments } = useQuery({
    queryKey: [kind === 'sales' ? 'sales-payments' : 'purchase-payments', invoiceId],
    queryFn: () => svc.getByInvoice(invoiceId),
    enabled: !!invoiceId,
  })

  const del = useMutation({
    mutationFn: (paymentId: number) => svc.delete(invoiceId, paymentId),
    onSuccess: () => {
      toast.success('Pago anulado')
      qc.invalidateQueries({ queryKey: [kind === 'sales' ? 'sales-payments' : 'purchase-payments', invoiceId] })
      qc.invalidateQueries({ queryKey: [kind === 'sales' ? 'sales-invoice' : 'purchase-invoice'] })
      onPaymentsChanged?.()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const disabled = invoiceStatus === 'draft' || invoiceStatus === 'cancelled' || balanceDue <= 0

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Pagos</h3>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModalOpen(true)} disabled={disabled}
          title={disabled ? (invoiceStatus === 'draft' ? 'Confirmá la factura antes de cargar pagos' : (balanceDue <= 0 ? 'No hay saldo pendiente' : 'Factura cancelada')) : ''}>
          <Plus className="w-4 h-4" /> Registrar pago
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
          <div className="text-xs text-gray-500">Total factura</div>
          <div className="font-semibold">$ {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2">
          <div className="text-xs text-gray-500">Pagado</div>
          <div className="font-semibold text-green-700 dark:text-green-400">$ {paidAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className={`rounded-lg px-3 py-2 ${balanceDue > 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}>
          <div className="text-xs text-gray-500">Saldo pendiente</div>
          <div className={`font-semibold ${balanceDue > 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>$ {balanceDue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Fecha</th><th>Forma</th><th>Referencia</th><th>Monto</th><th>Notas</th><th className="w-10"></th></tr></thead>
          <tbody>
            {(!payments || payments.length === 0) && <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">Sin pagos registrados</td></tr>}
            {(payments ?? []).map((p: any) => (
              <tr key={p.id}>
                <td>{format(new Date(p.paymentDate), 'dd/MM/yyyy')}</td>
                <td>{p.paymentMethodName}{p.paymentMethodAffectsCash ? <span className="text-xs text-gray-500 ml-1">(caja)</span> : null}</td>
                <td className="text-gray-500">{p.reference ?? '—'}</td>
                <td className="font-mono font-medium">$ {(+p.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td className="text-gray-500 text-xs">{p.notes ?? ''}</td>
                <td>
                  <button className="text-red-500 hover:text-red-700" title="Anular pago"
                    onClick={() => { if (confirm('¿Anular este pago?')) del.mutate(p.id) }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RegisterPaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        kind={kind}
        invoiceId={invoiceId}
        invoiceFullNumber={invoiceFullNumber}
        balanceDue={balanceDue}
        onSaved={onPaymentsChanged}
      />
    </div>
  )
}
