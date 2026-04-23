import { useQuery } from '@tanstack/react-query'
import { salesService, salesPaymentsService } from '../../services'
import { format } from 'date-fns'
import Badge from '../ui/Badge'
import { FileDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SalesInvoicePreview({ invoiceId }: { invoiceId: number }) {
  const { data: inv, isLoading } = useQuery({
    queryKey: ['sales-invoice', invoiceId],
    queryFn: () => salesService.getById(invoiceId),
  })
  const { data: payments } = useQuery({
    queryKey: ['sales-payments', invoiceId],
    queryFn: () => salesPaymentsService.getByInvoice(invoiceId),
  })

  const fmt = (n: any) => `$ ${(+(n ?? 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  const downloadPdf = async () => {
    try {
      const res = await salesService.getPdf(invoiceId)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `factura-${inv?.fullNumber ?? invoiceId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Error al descargar PDF') }
  }

  if (isLoading || !inv) return <div className="py-8 text-center text-gray-400">Cargando...</div>

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{inv.fullNumber}</h2>
          <p className="text-xs text-gray-500">{format(new Date(inv.invoiceDate), 'dd/MM/yyyy')} · <Badge variant={inv.status === 'paid' ? 'green' : inv.status === 'cancelled' ? 'red' : inv.status === 'confirmed' || inv.status === 'partially_paid' ? 'yellow' : 'gray'}>{inv.status}</Badge></p>
        </div>
        <button className="btn-secondary btn-sm" onClick={downloadPdf}><FileDown className="w-4 h-4" /> PDF</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><div className="text-xs text-gray-500">Cliente</div><div className="font-medium">{inv.clientName}</div><div className="text-xs text-gray-500">{inv.clientCuit}</div></div>
        <div><div className="text-xs text-gray-500">Vendedor</div><div>{inv.sellerName ?? '—'}</div></div>
        <div><div className="text-xs text-gray-500">Lista de precios</div><div>{inv.priceListName ?? '—'}</div></div>
        <div><div className="text-xs text-gray-500">Cond. de pago</div><div>{inv.paymentConditionName ?? '—'}</div></div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Producto</th><th className="text-right">Cant.</th><th className="text-right">P.Unit.</th><th className="text-right">Dto%</th><th className="text-right">IVA%</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {(inv.items ?? []).map((it: any) => (
              <tr key={it.id}>
                <td>{it.productName}</td>
                <td className="text-right font-mono">{(+it.quantity).toFixed(2)}</td>
                <td className="text-right font-mono">{fmt(it.unitPrice)}</td>
                <td className="text-right font-mono">{(+it.discountPercentage).toFixed(1)}</td>
                <td className="text-right font-mono">{(+it.vatRate).toFixed(1)}</td>
                <td className="text-right font-mono font-medium">{fmt(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-mono">{fmt(inv.taxableBase)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">IVA</span><span className="font-mono">{fmt(inv.vatAmount)}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="font-mono">{fmt(inv.total)}</span></div>
          {+inv.paidAmount > 0 && <div className="flex justify-between text-green-700 dark:text-green-400"><span>Pagado</span><span className="font-mono">{fmt(inv.paidAmount)}</span></div>}
          {+inv.balanceDue > 0 && <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold"><span>Saldo</span><span className="font-mono">{fmt(inv.balanceDue)}</span></div>}
        </div>
      </div>

      {(payments?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Pagos</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Fecha</th><th>Forma</th><th>Ref.</th><th className="text-right">Monto</th></tr></thead>
              <tbody>
                {payments!.map((p: any) => (
                  <tr key={p.id}>
                    <td>{format(new Date(p.paymentDate), 'dd/MM/yyyy')}</td>
                    <td>{p.paymentMethodName}</td>
                    <td className="text-gray-500">{p.reference ?? '—'}</td>
                    <td className="text-right font-mono">{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
