import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '../../services'
import { Upload, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductPhotosSection({ productId }: { productId: number }) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const queryKey = ['product-photos', productId]

  const { data: photos } = useQuery({ queryKey, queryFn: () => productsService.getPhotos(productId), enabled: !!productId })

  const uploadMut = useMutation({
    mutationFn: (file: File) => productsService.uploadPhoto(productId, file),
    onSuccess: () => { toast.success('Foto subida'); qc.invalidateQueries({ queryKey }); qc.invalidateQueries({ queryKey: ['products'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al subir')
  })

  const delMut = useMutation({
    mutationFn: (photoId: number) => productsService.deletePhoto(productId, photoId),
    onSuccess: () => { toast.success('Foto eliminada'); qc.invalidateQueries({ queryKey }); qc.invalidateQueries({ queryKey: ['products'] }) }
  })

  const setDefaultMut = useMutation({
    mutationFn: (photoId: number) => productsService.setDefaultPhoto(productId, photoId),
    onSuccess: () => { toast.success('Foto por defecto actualizada'); qc.invalidateQueries({ queryKey }); qc.invalidateQueries({ queryKey: ['products'] }) }
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => uploadMut.mutate(f))
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Fotos del producto</h4>
        <button type="button" className="btn-secondary btn-sm" onClick={() => inputRef.current?.click()} disabled={uploadMut.isPending}>
          <Upload className="w-4 h-4" /> Subir foto
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} accept="image/*" />
      </div>

      {(!photos || photos.length === 0) && (
        <div className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded">
          Sin fotos cargadas
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {(photos ?? []).map((p: any) => (
          <div key={p.id} className={`relative group rounded border ${p.isDefault ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-200 dark:border-gray-700'} overflow-hidden`}>
            <img src={p.url} alt={p.fileName} className="w-full h-28 object-cover" />
            {p.isDefault && (
              <span className="absolute top-1 left-1 text-xs bg-primary-600 text-white px-2 py-0.5 rounded flex items-center gap-1"><Star className="w-3 h-3" /> Por defecto</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              {!p.isDefault && (
                <button type="button" className="btn-secondary btn-sm" title="Marcar como por defecto" onClick={() => setDefaultMut.mutate(p.id)}>
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="button" className="btn-secondary btn-sm text-red-600" title="Eliminar"
                onClick={() => { if (confirm('¿Eliminar foto?')) delMut.mutate(p.id) }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
