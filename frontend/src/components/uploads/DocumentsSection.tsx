import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, FileText, FileImage, File as FileIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Props {
  kind: 'product' | 'client'
  entityId: number
  getDocuments: (id: number) => Promise<any[]>
  uploadDocument: (id: number, file: File, description?: string) => Promise<any>
  deleteDocument: (id: number, docId: number) => Promise<any>
}

export default function DocumentsSection({ kind, entityId, getDocuments, uploadDocument, deleteDocument }: Props) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const queryKey = [`${kind}-docs`, entityId]

  const { data: docs } = useQuery({ queryKey, queryFn: () => getDocuments(entityId), enabled: !!entityId })

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadDocument(entityId, file),
    onSuccess: () => { toast.success('Documento subido'); qc.invalidateQueries({ queryKey }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al subir')
  })

  const delMut = useMutation({
    mutationFn: (docId: number) => deleteDocument(entityId, docId),
    onSuccess: () => { toast.success('Documento eliminado'); qc.invalidateQueries({ queryKey }) }
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => uploadMut.mutate(f))
    if (inputRef.current) inputRef.current.value = ''
  }

  const icon = (type: string) => {
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(type)) return <FileImage className="w-4 h-4 text-blue-500" />
    if (type === 'pdf') return <FileText className="w-4 h-4 text-red-500" />
    return <FileIcon className="w-4 h-4 text-gray-500" />
  }

  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Documentos</h4>
        <button type="button" className="btn-secondary btn-sm" onClick={() => inputRef.current?.click()} disabled={uploadMut.isPending}>
          <Upload className="w-4 h-4" /> Subir archivo
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" />
      </div>
      <div className="space-y-1">
        {(!docs || docs.length === 0) && <div className="text-xs text-gray-400 py-2 text-center">Sin documentos cargados</div>}
        {(docs ?? []).map((d: any) => (
          <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            {icon(d.fileType)}
            <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-sm text-primary-600 hover:underline truncate">{d.fileName}</a>
            <span className="text-xs text-gray-400">{fmtSize(d.fileSizeBytes)}</span>
            <span className="text-xs text-gray-400">{format(new Date(d.createdAt), 'dd/MM/yyyy')}</span>
            <button type="button" className="text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Eliminar?')) delMut.mutate(d.id) }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
