import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, AlertTriangle, AlertCircle, Info, CheckCheck } from 'lucide-react'
import { alertsService } from '../../services'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

type Alert = {
  key: string
  module: string
  severity: 'info' | 'warning' | 'error'
  title: string
  description: string
  link?: string | null
  createdAt: string
  isRead: boolean
}

const severityIcon = (s: string) => {
  if (s === 'error') return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
  if (s === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
  return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
}

export default function NotificationsDropdown() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsService.getAll,
    refetchInterval: 60_000,        // refresh every 60s
    refetchOnWindowFocus: true,
  })

  const markReadMut = useMutation({
    mutationFn: (keys: string[]) => alertsService.markRead(keys),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
  const markAllMut = useMutation({
    mutationFn: () => alertsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const items: Alert[] = data?.items ?? []
  const unread = data?.unreadCount ?? 0

  const onAlertClick = (a: Alert) => {
    if (!a.isRead) markReadMut.mutate([a.key])
    if (a.link) { navigate(a.link); setOpen(false) }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost p-2 rounded-lg relative"
        title={unread > 0 ? `${unread} alertas sin leer` : 'Sin novedades'}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {unread > 1 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-96 card shadow-lg z-50 flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">Notificaciones</div>
              <div className="text-xs text-gray-500">
                {unread > 0 ? `${unread} sin leer de ${items.length}` : `${items.length} alertas`}
              </div>
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllMut.mutate()}
                disabled={markAllMut.isPending}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {items.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Sin novedades
              </div>
            )}

            {items.map(a => (
              <div
                key={a.key}
                className={clsx(
                  'px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors group',
                  !a.isRead && 'bg-blue-50/30 dark:bg-blue-900/10'
                )}
                onClick={() => onAlertClick(a)}
              >
                <div className="flex items-start gap-3">
                  {severityIcon(a.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={clsx('text-sm', !a.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400')}>
                        {a.title}
                      </span>
                      {!a.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{a.description}</div>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: es })}
                      </span>
                      {!a.isRead && (
                        <button
                          onClick={e => { e.stopPropagation(); markReadMut.mutate([a.key]) }}
                          className="text-[10px] text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Marcar como leída"
                        >
                          <Check className="w-3 h-3" /> Leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
