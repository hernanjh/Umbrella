import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashService, paymentMethodsService } from '../services'
import PageHeader from '../components/ui/PageHeader'
import Modal from '../components/ui/Modal'
import SearchAutocomplete from '../components/ui/SearchAutocomplete'
import { Plus, Trash2, LockOpen, Lock, Banknote, History } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Badge from '../components/ui/Badge'

const TYPES = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Egreso' },
  { value: 'adjustment', label: 'Ajuste' },
]

export default function CashPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: current } = useQuery({ queryKey: ['cash-current'], queryFn: cashService.getCurrent })
  const { data: methods } = useQuery({ queryKey: ['payment-methods', 'active'], queryFn: () => paymentMethodsService.getAll(false) })

  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [moveModal, setMoveModal] = useState(false)
  const [openForm, setOpenForm] = useState<any>({ openingBalance: 0, notes: '' })
  const [closeForm, setCloseForm] = useState<any>({ countedBalance: 0, notes: '' })
  const [moveForm, setMoveForm] = useState<any>({ type: 'income', amount: 0, paymentMethodId: 0, description: '' })

  const openMut = useMutation({
    mutationFn: cashService.open,
    onSuccess: () => { toast.success('Caja abierta'); qc.invalidateQueries({ queryKey: ['cash-current'] }); qc.invalidateQueries({ queryKey: ['dashboard-summary'] }); setOpenModal(false) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const closeMut = useMutation({
    mutationFn: () => cashService.close(current!.id, closeForm),
    onSuccess: () => { toast.success('Caja cerrada'); qc.invalidateQueries({ queryKey: ['cash-current'] }); qc.invalidateQueries({ queryKey: ['dashboard-summary'] }); setCloseModal(false) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const addMoveMut = useMutation({
    mutationFn: () => cashService.addMovement(current!.id, { ...moveForm, amount: +moveForm.amount, paymentMethodId: +moveForm.paymentMethodId || null }),
    onSuccess: () => { toast.success('Movimiento registrado'); qc.invalidateQueries({ queryKey: ['cash-current'] }); setMoveModal(false); setMoveForm({ type: 'income', amount: 0, paymentMethodId: 0, description: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })
  const delMoveMut = useMutation({
    mutationFn: (id: number) => cashService.deleteMovement(id),
    onSuccess: () => { toast.success('Movimiento anulado'); qc.invalidateQueries({ queryKey: ['cash-current'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const fmt = (n: number) => `$ ${(+n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      <PageHeader title="Caja" subtitle={current ? `Sesión abierta ${current.code}` : 'Sin sesión abierta'}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/cash/sessions')}><History className="w-4 h-4" /> Histórico</button>
            {!current && <button className="btn-primary" onClick={() => { setOpenForm({ openingBalance: 0, notes: '' }); setOpenModal(true) }}><LockOpen className="w-4 h-4" /> Abrir caja</button>}
            {current && <button className="btn-primary" onClick={() => { setCloseForm({ countedBalance: current.currentBalance, notes: '' }); setCloseModal(true) }}><Lock className="w-4 h-4" /> Cerrar caja</button>}
          </>
        } />

      {current ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-sm text-gray-500">Apertura</div>
              <div className="text-xl font-bold">{fmt(current.openingBalance)}</div>
              <div className="text-xs text-gray-400 mt-1">{format(new Date(current.openingDate), 'dd/MM/yyyy HH:mm')}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-500">Ingresos</div>
              <div className="text-xl font-bold text-green-700 dark:text-green-400">{fmt(current.totalIncome)}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-gray-500">Egresos</div>
              <div className="text-xl font-bold text-red-600">{fmt(current.totalExpense)}</div>
            </div>
            <div className="card p-4 ring-2 ring-primary-500">
              <div className="text-sm text-gray-500 flex items-center gap-1"><Banknote className="w-4 h-4" /> Saldo actual</div>
              <div className="text-2xl font-bold">{fmt(current.currentBalance)}</div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Movimientos del día</h3>
              <button className="btn-primary btn-sm" onClick={() => setMoveModal(true)}><Plus className="w-4 h-4" /> Movimiento manual</button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Forma pago</th><th>Descripción</th><th className="text-right">Monto</th><th></th></tr></thead>
                <tbody>
                  {(current.movements ?? []).length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin movimientos</td></tr>}
                  {(current.movements ?? []).map((m: any) => (
                    <tr key={m.id}>
                      <td className="text-xs">{format(new Date(m.movementDate), 'dd/MM HH:mm')}</td>
                      <td>
                        <Badge variant={m.type === 'income' || m.type === 'opening' ? 'green' : m.type === 'expense' ? 'red' : 'gray'}>
                          {m.type === 'income' ? 'Ingreso' : m.type === 'expense' ? 'Egreso' : m.type === 'opening' ? 'Apertura' : m.type === 'closing' ? 'Cierre' : 'Ajuste'}
                        </Badge>
                      </td>
                      <td>{m.paymentMethodName ?? '—'}</td>
                      <td className="text-sm">{m.description}</td>
                      <td className={`text-right font-mono font-medium ${m.type === 'expense' ? 'text-red-600' : 'text-green-700 dark:text-green-400'}`}>
                        {m.type === 'expense' ? '-' : '+'} {fmt(m.amount)}
                      </td>
                      <td>
                        {m.type !== 'opening' && m.type !== 'closing' && !m.referenceType && (
                          <button className="text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Anular?')) delMoveMut.mutate(m.id) }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-10 text-center text-gray-500">
          <Banknote className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="mb-4">No hay una sesión de caja abierta.</p>
          <button className="btn-primary" onClick={() => setOpenModal(true)}><LockOpen className="w-4 h-4" /> Abrir caja</button>
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir caja"
        footer={<><button className="btn-secondary" onClick={() => setOpenModal(false)}>Cancelar</button><button className="btn-primary" onClick={() => openMut.mutate({ openingBalance: +openForm.openingBalance, notes: openForm.notes || null })} disabled={openMut.isPending}>Abrir</button></>}>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Saldo inicial</label><input className="input" type="number" step="0.01" value={openForm.openingBalance} onChange={e => setOpenForm((f: any) => ({ ...f, openingBalance: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Notas</label><textarea className="input" rows={2} value={openForm.notes} onChange={e => setOpenForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Cerrar caja"
        footer={<><button className="btn-secondary" onClick={() => setCloseModal(false)}>Cancelar</button><button className="btn-primary" onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>Cerrar</button></>}>
        <div className="space-y-3">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm flex justify-between"><span>Saldo esperado</span><span className="font-semibold">{fmt(current?.currentBalance ?? 0)}</span></div>
          <div className="form-group"><label className="label">Saldo contado (arqueo)</label><input className="input" type="number" step="0.01" value={closeForm.countedBalance} onChange={e => setCloseForm((f: any) => ({ ...f, countedBalance: +e.target.value }))} /></div>
          <div className="form-group"><label className="label">Notas</label><textarea className="input" rows={2} value={closeForm.notes} onChange={e => setCloseForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          {current && +closeForm.countedBalance !== +current.currentBalance && (
            <div className="text-xs text-amber-700 dark:text-amber-400">Diferencia: {fmt(+closeForm.countedBalance - +current.currentBalance)}</div>
          )}
        </div>
      </Modal>

      <Modal open={moveModal} onClose={() => setMoveModal(false)} title="Movimiento manual de caja"
        footer={<><button className="btn-secondary" onClick={() => setMoveModal(false)}>Cancelar</button><button className="btn-primary" onClick={() => addMoveMut.mutate()} disabled={addMoveMut.isPending}>Registrar</button></>}>
        <div className="space-y-3">
          <SearchAutocomplete label="Tipo" required
            value={{ id: TYPES.findIndex(t => t.value === moveForm.type) + 1, label: TYPES.find(t => t.value === moveForm.type)?.label ?? '' }}
            onChange={opt => { if (opt) setMoveForm((f: any) => ({ ...f, type: TYPES[opt.id - 1].value })) }}
            onSearch={async () => TYPES.map((t, i) => ({ id: i + 1, label: t.label }))} />
          <div className="form-group"><label className="label">Monto</label><input className="input" type="number" step="0.01" value={moveForm.amount} onChange={e => setMoveForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
          <SearchAutocomplete label="Forma de pago (opcional)"
            value={moveForm.paymentMethodId ? { id: +moveForm.paymentMethodId, label: (methods ?? []).find((m: any) => m.id === +moveForm.paymentMethodId)?.name ?? '' } : null}
            onChange={opt => setMoveForm((f: any) => ({ ...f, paymentMethodId: opt?.id ?? 0 }))}
            onSearch={async (t) => (methods ?? []).filter((m: any) => m.name.toLowerCase().includes((t ?? '').toLowerCase())).map((m: any) => ({ id: m.id, label: m.name }))} />
          <div className="form-group"><label className="label">Descripción</label><input className="input" value={moveForm.description} onChange={e => setMoveForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
