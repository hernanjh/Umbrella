import { useQuery } from '@tanstack/react-query'
import { productsService } from '../../services'
import Modal from '../ui/Modal'
import { Star } from 'lucide-react'

export default function ProductPhotosLightbox({ productId, productName, open, onClose }: {
  productId: number
  productName: string
  open: boolean
  onClose: () => void
}) {
  const { data: photos } = useQuery({
    queryKey: ['product-photos', productId],
    queryFn: () => productsService.getPhotos(productId),
    enabled: open && !!productId,
  })

  return (
    <Modal open={open} onClose={onClose} title={`Fotos — ${productName}`} size="2xl">
      {(!photos || photos.length === 0) ? (
        <div className="text-sm text-gray-400 py-12 text-center">Sin fotos cargadas</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((p: any) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer"
              className={`relative rounded border overflow-hidden group ${p.isDefault ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-200 dark:border-gray-700'}`}>
              <img src={p.url} alt={p.fileName} className="w-full h-40 object-cover" />
              {p.isDefault && (
                <span className="absolute top-1 left-1 text-xs bg-primary-600 text-white px-2 py-0.5 rounded flex items-center gap-1"><Star className="w-3 h-3" /> Por defecto</span>
              )}
            </a>
          ))}
        </div>
      )}
    </Modal>
  )
}
