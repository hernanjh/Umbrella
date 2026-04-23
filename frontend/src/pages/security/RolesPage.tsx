import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesService } from '../../services'
import DataGrid, { Column } from '../../components/ui/DataGrid'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Edit2, Trash2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RolesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false })
  const [form, setForm] = useState<any>({})

  const { data: roles, isLoading, refetch } = useQuery({
    queryKey: ['roles'], queryFn: rolesService.getAll
  })

  const saveMutation = useMutation({
    mutationFn: (data: any) => modal.data?.id
      ? rolesService.update(modal.data.id, { ...data, permissions: [] })
      : rolesService.create({ ...data, permissions: [] }),
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

  const openNew = () => { setForm({ isActive: true, isSeller: false }); setModal({ open: true }) }
  const openEdit = (row: any) => { setForm(row); setModal({ open: true, data: row }) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      code: form.code, name: form.name, description: form.description,
      isSeller: form.isSeller ?? false, isActive: form.isActive !== false
    })
  }

  const columns: Column<any>[] = [
    { key: 'code', header: 'Código', width: '90px', render: (r) => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{r.code}</span> },
    { key: 'name', header: 'Nombre', render: (r) => <span className="font-medium flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary-500" />{r.name}</span> },
    { key: 'description', header: 'Descripción' },
    { key: 'isSeller', header: 'Vendedor', render: (r) => r.isSeller ? <Badge variant="blue">Sí</Badge> : <Badge variant="gray">No</Badge> },
    { key: 'userCount', header: 'Usuarios', render: (r) => <span className="badge-gray">{r.userCount ?? 0}</span> },
    { key: 'isActive', header: 'Estado', render: (r) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Roles y Permisos" subtitle={`${(roles ?? []).length} roles`}
        actions={<button className="btn-primary" onClick={openNew}><Plus className="w-4 h-4" /> Nuevo Rol</button>} />
      <div className="card p-5">
        <DataGrid columns={columns} data={roles ?? []} loading={isLoading} onRefresh={refetch}
          exportFileName="roles"
          actions={(row) => (
            <>
              <button className="btn-ghost btn-sm p-1" onClick={() => openEdit(row)}><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="btn-ghost btn-sm p-1 text-red-500" onClick={() => {
                if (window.confirm(`¿Eliminar el rol "${row.name}"?`)) deleteMutation.mutate(row.id)
              }}><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        />
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })}
        title={modal.data ? 'Editar Rol' : 'Nuevo Rol'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>Guardar</button>
          </>
        }>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Código *</label>
              <input className="input font-mono" required value={form.code ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!modal.data} maxLength={10} placeholder="Ej: ADM" />
            </div>
            <div className="form-group">
              <label className="label">Nombre *</label>
              <input className="input" required value={form.name ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Descripción</label>
            <input className="input" value={form.description ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.isSeller ?? false}
                onChange={e => setForm((f: any) => ({ ...f, isSeller: e.target.checked }))} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Rol de Vendedor</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.isActive !== false}
                onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
