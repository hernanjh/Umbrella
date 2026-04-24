import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService, rolesService, paramsService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Edit2, Trash2, RotateCcw, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any; mode?: 'edit' | 'new' | 'password' }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [newPassword, setNewPassword] = useState('')

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'], queryFn: () => usersService.getAll({ page: 1, pageSize: 200 })
  })
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: rolesService.getAll })
  const { data: zones } = useQuery({ queryKey: ['zones'], queryFn: paramsService.getZones })

  const saveMutation = useMutation({
    mutationFn: (data: any) => modal.data?.id
      ? usersService.update(modal.data.id, data)
      : usersService.create(data),
    onSuccess: () => {
      toast.success(modal.data ? 'Usuario actualizado' : 'Usuario creado')
      qc.invalidateQueries({ queryKey: ['users'] })
      setModal({ open: false })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersService.delete(id),
    onSuccess: () => { toast.success('Usuario eliminado'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => usersService.restore(id),
    onSuccess: () => { toast.success('Usuario restaurado'); qc.invalidateQueries({ queryKey: ['users'] }) }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      usersService.resetPassword(id, password),
    onSuccess: () => { toast.success('Contraseña restablecida'); setModal({ open: false }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const openNew = () => {
    setForm({ isActive: true })
    setSelectedRoles([])
    setModal({ open: true, mode: 'new' })
  }

  const openEdit = (row: any) => {
    // Full details (not the list DTO) when available
    usersService.getById(row.id).then((full: any) => {
      setForm(full)
      setSelectedRoles(full.roles?.map((r: any) => r.roleId ?? r.id) ?? [])
      setModal({ open: true, data: full, mode: 'edit' })
    })
  }

  const openResetPassword = (row: any) => {
    setNewPassword('')
    setModal({ open: true, data: row, mode: 'password' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (modal.mode === 'password') {
      if (newPassword.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres')
      resetPasswordMutation.mutate({ id: modal.data.id, password: newPassword })
      return
    }
    const payload: any = {
      firstName: form.firstName, lastName: form.lastName,
      phone: form.phone, isActive: form.isActive !== false,
      roleIds: selectedRoles,
      zoneId: form.zoneId ? +form.zoneId : null,
    }
    if (modal.mode === 'new') {
      payload.email = form.email
      payload.password = form.password
    }
    saveMutation.mutate(payload)
  }

  const toggleRole = (id: number) =>
    setSelectedRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '90px' },
    { key: 'firstName', header: 'Nombre', render: (r) => `${r.firstName} ${r.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Teléfono', width: '120px' },
    {
      key: 'roles', header: 'Roles',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.roles ?? []).map((role: string, i: number) => (
            <Badge key={i} variant="blue">{role}</Badge>
          ))}
        </div>
      )
    },
    { key: 'lastLoginAt', header: 'Último acceso', render: (r) => r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleDateString('es-AR') : '-' },
    { key: 'isActive', header: 'Estado', render: (r) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  const title = modal.mode === 'password' ? 'Restablecer Contraseña' : modal.mode === 'edit' ? 'Editar Usuario' : 'Nuevo Usuario'

  return (
    <div>
      <PageHeader title="Usuarios del Sistema" subtitle={`${users?.totalCount ?? 0} usuarios`}
        actions={<button className="btn-primary" onClick={openNew}><Plus className="w-4 h-4" /> Nuevo Usuario</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={users?.items ?? []} loading={isLoading} onRefresh={refetch}
          exportFileName="usuarios"
          actions={(row) => (
            <>
              <button className="btn-ghost btn-sm p-1" title="Editar" onClick={() => openEdit(row)}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button className="btn-ghost btn-sm p-1 text-yellow-500" title="Cambiar contraseña" onClick={() => openResetPassword(row)}>
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              {!row.isDeleted
                ? <button className="btn-ghost btn-sm p-1 text-red-500" title="Eliminar" onClick={() => deleteMutation.mutate(row.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                : <button className="btn-ghost btn-sm p-1 text-green-500" title="Restaurar" onClick={() => restoreMutation.mutate(row.id)}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
              }
            </>
          )}
        />
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={title} size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit}
              disabled={saveMutation.isPending || resetPasswordMutation.isPending}>
              Guardar
            </button>
          </>
        }>
        {modal.mode === 'password' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Restableciendo contraseña para: <strong>{modal.data?.firstName} {modal.data?.lastName}</strong>
            </p>
            <div className="form-group">
              <label className="label">Nueva Contraseña *</label>
              <input type="password" className="input" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Nombre *</label>
              <input className="input" required value={form.firstName ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Apellido *</label>
              <input className="input" required value={form.lastName ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, lastName: e.target.value }))} />
            </div>
            {modal.mode === 'new' && (
              <>
                <div className="form-group">
                  <label className="label">Email *</label>
                  <input className="input" type="email" required value={form.email ?? ''}
                    onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Contraseña *</label>
                  <input className="input" type="password" required value={form.password ?? ''}
                    onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres" />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="label">Teléfono</label>
              <input className="input" value={form.phone ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Zona asignada</label>
              <select className="input" value={form.zoneId ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, zoneId: e.target.value || null }))}>
                <option value="">Sin zona</option>
                {(zones ?? []).map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Si el rol es de vendedor, sólo verá datos de esta zona.</p>
            </div>
            <div className="form-group flex items-center gap-2 mt-6">
              <input type="checkbox" id="isActive" checked={form.isActive !== false}
                onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded" />
              <label htmlFor="isActive" className="label mb-0">Usuario activo</label>
            </div>
            <div className="form-group col-span-2">
              <label className="label">Roles</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(roles ?? []).map((r: any) => (
                  <label key={r.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                    selectedRoles.includes(r.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}>
                    <input type="checkbox" className="hidden" checked={selectedRoles.includes(r.id)}
                      onChange={() => toggleRole(r.id)} />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
