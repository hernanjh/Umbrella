import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { clientAccountService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import { ArrowLeft, FileText, Banknote } from 'lucide-react'
import { format } from 'date-fns'

export default function ClientAccountPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['client-account', id],
    queryFn: () => clientAccountService.get(+id!),
    enabled: !!id,
  })

  const fmt = (n: number) => `$ ${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      <PageHeader
        title={data ? `Cuenta Corriente — ${data.clientName}` : 'Cuenta Corriente'}
        subtitle={data?.clientCuit ? `CUIT ${data.clientCuit}` : undefined}
        actions={<button className="btn-secondary" onClick={() => navigate('/clients')}><ArrowLeft className="w-4 h-4" /> Volver</button>}
      />

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="text-sm text-gray-500">Total facturado</div>
            <div className="text-2xl font-bold">{fmt(data.totalInvoiced)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-500">Total pagado</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{fmt(data.totalPaid)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-500">Saldo actual</div>
            <div className={`text-2xl font-bold ${data.currentBalance > 0 ? 'text-amber-700 dark:text-amber-400' : data.currentBalance < 0 ? 'text-red-600' : ''}`}>
              {fmt(data.currentBalance)}
            </div>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Movimientos</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th className="text-right">Debe</th>
                <th className="text-right">Haber</th>
                <th className="text-right">Saldo</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-8">Cargando...</td></tr>}
              {!isLoading && data?.entries?.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin movimientos</td></tr>
              )}
              {(data?.entries ?? []).map((e: any, idx: number) => (
                <tr key={idx}>
                  <td>{format(new Date(e.date), 'dd/MM/yyyy')}</td>
                  <td>
                    {e.kind === 'invoice'
                      ? <span className="inline-flex items-center gap-1 text-xs"><FileText className="w-3.5 h-3.5" /> Factura</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400"><Banknote className="w-3.5 h-3.5" /> Pago</span>}
                  </td>
                  <td className="text-sm">{e.description}</td>
                  <td className="text-right font-mono">{e.debit > 0 ? fmt(e.debit) : ''}</td>
                  <td className="text-right font-mono text-green-700 dark:text-green-400">{e.credit > 0 ? fmt(e.credit) : ''}</td>
                  <td className="text-right font-mono font-semibold">{fmt(e.balance)}</td>
                  <td>
                    {e.kind === 'invoice' && e.invoiceId && (
                      <button className="btn-ghost btn-sm p-1" onClick={() => navigate(`/sales/${e.invoiceId}`)} title="Ver factura">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
