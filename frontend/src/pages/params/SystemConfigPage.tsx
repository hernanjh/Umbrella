import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paramsService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import { Save, Upload, X, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useEffect, useRef } from 'react'

export default function SystemConfigPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['system-config'], queryFn: paramsService.getSystemConfig })
  const [form, setForm] = useState<any>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (data) setForm(data) }, [data])

  const saveMutation = useMutation({
    mutationFn: paramsService.updateSystemConfig,
    onSuccess: () => {
      toast.success('Configuración guardada')
      qc.invalidateQueries({ queryKey: ['system-config'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
    },
    onError: () => toast.error('Error al guardar')
  })

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => paramsService.uploadLogo(file),
    onSuccess: (res: any) => {
      toast.success('Logo actualizado')
      setForm((f: any) => ({ ...f, logoUrl: res.logoUrl }))
      qc.invalidateQueries({ queryKey: ['system-config'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
    },
    onError: () => toast.error('Error al subir el logo')
  })

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) uploadLogoMutation.mutate(f)
    if (fileRef.current) fileRef.current.value = ''
  }

  const clearLogo = () => setForm((f: any) => ({ ...f, logoUrl: null }))

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Configuración General" />
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Datos de la empresa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group col-span-1 sm:col-span-2"><label className="label">Razón Social *</label><input className="input" value={form.companyName ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyName: e.target.value }))} /></div>
          <div className="form-group"><label className="label">CUIT</label><input className="input" value={form.companyCuit ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyCuit: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Teléfono</label><input className="input" value={form.companyPhone ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyPhone: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Email</label><input className="input" type="email" value={form.companyEmail ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyEmail: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Sitio Web</label><input className="input" value={form.website ?? ''} onChange={e => setForm((f: any) => ({ ...f, website: e.target.value }))} /></div>
          <div className="form-group col-span-1 sm:col-span-2"><label className="label">Dirección</label><input className="input" value={form.companyAddress ?? ''} onChange={e => setForm((f: any) => ({ ...f, companyAddress: e.target.value }))} /></div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Logo de la empresa</h3>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden flex-shrink-0">
            {form.logoUrl
              ? <img src={form.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              : <Building2 className="w-8 h-8 text-gray-400" />}
          </div>
          <div className="flex-1 min-w-[240px] space-y-2">
            <div className="form-group mb-0">
              <label className="label">URL del logo</label>
              <input
                className="input"
                value={form.logoUrl ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="/uploads/branding/... o https://..."
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploadLogoMutation.isPending}
              >
                <Upload className="w-4 h-4" /> {uploadLogoMutation.isPending ? 'Subiendo...' : 'Subir archivo'}
              </button>
              {form.logoUrl && (
                <button type="button" className="btn-ghost btn-sm text-red-500" onClick={clearLogo}>
                  <X className="w-4 h-4" /> Quitar
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">Subí una imagen o pegá una URL. Se mostrará en el encabezado del sistema y en los PDFs.</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Parámetros del sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <button className="btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
        <Save className="w-4 h-4" /> Guardar configuración
      </button>
    </div>
  )
}
