import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paramsService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

export default function SystemConfigPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['system-config'], queryFn: paramsService.getSystemConfig })
  const [form, setForm] = useState<any>({})

  useEffect(() => { if (data) setForm(data) }, [data])

  const saveMutation = useMutation({
    mutationFn: paramsService.updateSystemConfig,
    onSuccess: () => { toast.success('Configuración guardada'); qc.invalidateQueries({ queryKey: ['system-config'] }) },
    onError: () => toast.error('Error al guardar')
  })

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Configuración General" />
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Datos de la empresa</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2"><label className="label">Razón Social *</label><input className="input" value={form.companyName ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyName: e.target.value }))} /></div>
          <div className="form-group"><label className="label">CUIT</label><input className="input" value={form.companyCuit ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyCuit: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Teléfono</label><input className="input" value={form.companyPhone ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyPhone: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Email</label><input className="input" type="email" value={form.companyEmail ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyEmail: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Sitio Web</label><input className="input" value={form.website ?? ''} onChange={e => setForm((f: any) => ({ ...f, website: e.target.value }))} /></div>
          <div className="form-group col-span-2"><label className="label">Dirección</label><input className="input" value={form.companyAddress ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyAddress: e.target.value }))} /></div>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Parámetros del sistema</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Moneda</label><input className="input" value={form.currency ?? 'ARS'} onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Símbolo</label><input className="input" value={form.currencySymbol ?? '$'} onChange={e => setForm((f: any) => ({ ...f, currencySymbol: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Zona horaria</label><input className="input" value={form.timezone ?? ''} onChange={e => setForm((f: any) => ({ ...f, timezone: e.target.value }))} /></div>
          <div className="form-group flex items-center gap-3 pt-5">
            <input type="checkbox" id="negStock" checked={form.allowNegativeStock ?? false} onChange={e => setForm((f: any) => ({ ...f, allowNegativeStock: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="negStock" className="text-sm text-gray-700 dark:text-gray-300">Permitir stock negativo</label>
          </div>
        </div>
      </div>
      <button className="btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}><Save className="w-4 h-4" /> Guardar configuración</button>
    </div>
  )
}
