import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Edit2, Trash2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

type AccessLevel = 'none' | 'read' | 'write'

export default function RolesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})
  const [perms, setPerms] = useState<Record<number, AccessLevel>>({})

  const { data: roles, isLoading, refetch } = useQuery({ queryKey: ['roles'], queryFn: rolesService.getAll })
  const { data: permissions } = useQuery({ queryKey: ['permissions'], queryFn: rolesService.getPermissions })

  useEffect(() => {
    if (!modal.open) return
    if (!modal.data?.id) {
      const initial: Record<number, AccessLevel> = {}
      for (const p of permissions ?? []) initial[p.id] = 'none'
      setPerms(initial)
      setForm({ isActive: true, isSeller: false })
      return
    }
    rolesService.getById(modal.data.id).then((full: any) => {
      setForm(full)
      const map: Record<number, AccessLevel> = {}
      for (const p of permissions ?? []) map[p.id] = 'none'
      for (const rp of full.permissions ?? []) {
        map[rp.permissionId] = rp.canWrite ? 'write' : rp.canRead ? 'read' : 'none'
      }
      setPerms(map)
    })
  }, [modal.open, modal.data?.id, permissions])

  const saveMutation = useMutation({
    mutationFn: (data: any) => modal.data?.id ? rolesService.update(modal.data.id, data) : rolesService.create(data),
    onSuccess: () => {
      toast.success(modal.data ? 'Rol actualizado' : 'Rol creado')
      qc.invalidateQueries({ queryKey: ['roles'] })
      setModal({ open: false })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesService.delete(id),
    onSuccess: () => { toast.success('Rol eliminado'); qc.invalidateQueries({ queryKey: ['roles'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const permsPayload = Object.entries(perms)
      .filter(([_, lvl]) => lvl !== 'none')
      .map(([pid, lvl]) => ({
        permissionId: +pid,
        canRead: true,
        canWrite: lvl === 'write',
        canDelete: lvl === 'write',
        viewAll: true,
      }))
    saveMutation.mutate({
      code: form.code, name: form.name, description: form.description,
      isSeller: form.isSeller ?? false, isActive: form.isActive !== false,
      permissions: permsPayload,
    })
  }

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '90px', render: r => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{r.code}</span> },
    { key: 'name', header: 'Nombre', render: r => <span className="font-medium flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary-500" />{r.name}</span> },
    { key: 'description', header: 'Descripción' },
    { key: 'isSeller', header: 'Vendedor', render: r => r.isSeller ? <Badge variant="blue">Sí</Badge> : <Badge variant="gray">No</Badge> },
    { key: 'userCount', header: 'Usuarios', render: r => <span className="badge-gray">{r.userCount ?? 0}</span> },
    { key: 'isActive', header: 'Estado', render: r => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Roles y Permisos" subtitle={`${(roles ?? []).length} roles`}
        actions={<button className="btn-primary" onClick={() => setModal({ open: true })}><Plus className="w-4 h-4" /> Nuevo Rol</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={roles ?? []} loading={isLoading} onRefresh={refetch} exportFileName="roles"
          actions={row => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => setModal({ open: true, data: row })}><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => { if (confirm(`¿Eliminar "${row.name}"?`)) deleteMutation.mutate(row.id) }}><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )} />
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Rol' : 'Nuevo Rol'} size="2xl"
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>Guardar</button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Código *</label>
              <input className="input font-mono" required value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} disabled={!!modal.data} maxLength={10} /></div>
            <div className="form-group"><label className="label">Nombre *</label>
              <input className="input" required value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="label">Descripción</label>
            <input className="input" value={form.description ?? ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.isSeller ?? false} onChange={e => setForm((f: any) => ({ ...f, isSeller: e.target.checked }))} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Rol de Vendedor</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.isActive !== false} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
            </label>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Permisos por módulo</h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Módulo</th>
                    <th className="w-28 text-center">Sin acceso</th>
                    <th className="w-28 text-center">Solo lectura</th>
                    <th className="w-32 text-center">Lectura y escritura</th>
                  </tr>
                </thead>
                <tbody>
                  {(permissions ?? []).map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.description}</td>
                      {(['none', 'read', 'write'] as const).map(level => (
                        <td key={level} className="text-center">
                          <input type="radio" name={`perm-${p.id}`} checked={(perms[p.id] ?? 'none') === level}
                            onChange={() => setPerms(s => ({ ...s, [p.id]: level }))}
                            className="w-4 h-4 cursor-pointer" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
