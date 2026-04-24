import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { authService } from '../services'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import PageHeader from '../components/ui/PageHeader'
import { Save, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [form, setForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '', theme: theme })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const updateMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => { setUser(data); setTheme(data.theme as any); toast.success('Perfil actualizado') },
    onError: () => toast.error('Error al actualizar')
  })

  const pwMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => { toast.success('Contraseña actualizada'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Mi Perfil" />

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Datos personales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Nombre</label><input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Apellido</label><input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Teléfono</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div className="form-group">
            <label className="label">Tema</label>
            <div className="flex gap-2">
              <button onClick={() => setForm(f => ({ ...f, theme: 'light' }))} className={`btn flex-1 ${form.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}><Sun className="w-4 h-4" /> Claro</button>
              <button onClick={() => setForm(f => ({ ...f, theme: 'dark' }))} className={`btn flex-1 ${form.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}><Moon className="w-4 h-4" /> Oscuro</button>
            </div>
          </div>
        </div>
        <button className="btn-primary mt-2" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}><Save className="w-4 h-4" /> Guardar cambios</button>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Cambiar contraseña</h3>
        <div className="space-y-3">
          <div className="form-group"><label className="label">Contraseña actual</label><input className="input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Nueva contraseña</label><input className="input" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Confirmar</label><input className="input" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} /></div>
          <button className="btn-primary" onClick={() => pwMutation.mutate(pwForm)} disabled={pwMutation.isPending}><Save className="w-4 h-4" /> Cambiar contraseña</button>
        </div>
      </div>
    </div>
  )
}
