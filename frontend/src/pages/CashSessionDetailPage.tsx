import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { cashService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Badge from '../components/ui/Badge'

export default function CashSessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data } = useQuery({ queryKey: ['cash-session', id], queryFn: () => cashService.getSession(+id!), enabled: !!id })

  const fmt = (n: any) => n == null ? '—' : `$ ${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      <PageHeader title={data ? `Sesión ${data.code}` : 'Sesión de Caja'}
        subtitle={data ? `Estado: ${data.status === 'open' ? 'Abierta' : 'Cerrada'}` : undefined}
        actions={<button className="btn-secondary" onClick={() => navigate('/cash/sessions')}><ArrowLeft className="w-4 h-4" /> Volver</button>} />

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4"><div className="text-sm text-gray-500">Apertura</div><div className="text-xl font-bold">{fmt(data.openingBalance)}</div><div className="text-xs text-gray-400">{format(new Date(data.openingDate), 'dd/MM/yyyy HH:mm')}</div></div>
            <div className="card p-4"><div className="text-sm text-gray-500">Ingresos</div><div className="text-xl font-bold text-green-700 dark:text-green-400">{fmt(data.totalIncome)}</div></div>
            <div className="card p-4"><div className="text-sm text-gray-500">Egresos</div><div className="text-xl font-bold text-red-600">{fmt(data.totalExpense)}</div></div>
            <div className="card p-4 ring-2 ring-primary-500"><div className="text-sm text-gray-500">{data.status === 'open' ? 'Saldo actual' : 'Saldo al cierre'}</div><div className="text-2xl font-bold">{fmt(data.status === 'open' ? data.currentBalance : data.countedBalance)}</div></div>
          </div>

          {data.status === 'closed' && (
            <div className="card p-4 grid grid-cols-3 text-sm">
              <div><div className="text-gray-500">Esperado</div><div className="font-mono">{fmt(data.expectedBalance)}</div></div>
              <div><div className="text-gray-500">Contado</div><div className="font-mono">{fmt(data.countedBalance)}</div></div>
              <div><div className="text-gray-500">Diferencia</div><div className={`font-mono ${+data.differenceAmount !== 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>{fmt(data.differenceAmount)}</div></div>
              <div className="col-span-3 text-xs text-gray-400 mt-2">Cerrada {format(new Date(data.closingDate), 'dd/MM/yyyy HH:mm')} por {data.closedBy}</div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold mb-4">Movimientos</h3>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Forma pago</th><th>Descripción</th><th className="text-right">Monto</th></tr></thead>
                <tbody>
                  {(data.movements ?? []).map((m: any) => (
                    <tr key={m.id}>
                      <td className="text-xs">{format(new Date(m.movementDate), 'dd/MM HH:mm')}</td>
                      <td>
                        <Badge variant={m.type === 'income' || m.type === 'opening' ? 'green' : m.type === 'expense' ? 'red' : 'gray'}>
                          {m.type === 'income' ? 'Ingreso' : m.type === 'expense' ? 'Egreso' : m.type === 'opening' ? 'Apertura' : m.type === 'closing' ? 'Cierre' : 'Ajuste'}
                        </Badge>
                      </td>
                      <td>{m.paymentMethodName ?? '—'}</td>
                      <td className="text-sm">{m.description}</td>
                      <td className={`text-right font-mono ${m.type === 'expense' ? 'text-red-600' : 'text-green-700 dark:text-green-400'}`}>{m.type === 'expense' ? '-' : '+'} {fmt(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
