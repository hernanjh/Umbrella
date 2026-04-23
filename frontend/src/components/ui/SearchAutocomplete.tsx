import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Loader2, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface Option { id: number; label: string; sublabel?: string; [key: string]: any }

interface SearchAutocompleteProps {
  value: Option | null
  onChange: (val: Option | null) => void
  onSearch: (term: string) => Promise<Option[]>
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
  error?: string
}

export default function SearchAutocomplete({
  value, onChange, onSearch, placeholder = 'Buscar...', disabled, className, label, required, error
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (value) setQuery(value.label)
    else setQuery('')
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (containerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
      if (!value) setQuery('')
      else setQuery(value.label)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [value])

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const rect = inputRef.current?.getBoundingClientRect()
      if (rect) setMenuPos({ left: rect.left, top: rect.bottom + 4, width: rect.width })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, options.length])

  const runSearch = async (term: string) => {
    setLoading(true)
    try {
      const results = await onSearch(term)
      setOptions(results)
      setOpen(true)
      hasLoadedRef.current = true
    } catch {
      setOptions([])
      setOpen(true)
    } finally { setLoading(false) }
  }

  const handleInput = (q: string) => {
    setQuery(q)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runSearch(q), 250)
  }

  const openAndLoad = () => {
    if (disabled) return
    if (options.length > 0) { setOpen(true); return }
    runSearch('')
  }

  const select = (opt: Option) => {
    onChange(opt)
    setQuery(opt.label)
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    setOptions([])
    hasLoadedRef.current = false
    inputRef.current?.focus()
  }

  const menu = open && menuPos && (
    <div
      ref={menuRef}
      style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, width: menuPos.width, zIndex: 1000 }}
    >
      {loading && (
        <div className="card shadow-xl py-3 px-3 text-sm text-gray-500 dark:text-gray-400">Cargando…</div>
      )}
      {!loading && options.length > 0 && (
        <ul className="card shadow-xl overflow-auto max-h-60 py-1">
          {options.map(opt => (
            <li key={opt.id}
              onMouseDown={(e) => { e.preventDefault(); select(opt) }}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</div>
              {opt.sublabel && <div className="text-xs text-gray-500 dark:text-gray-400">{opt.sublabel}</div>}
            </li>
          ))}
        </ul>
      )}
      {!loading && options.length === 0 && (
        <div className="card shadow-xl py-3 px-3 text-sm text-gray-500 dark:text-gray-400">
          {query.length > 0 ? `Sin resultados para "${query}"` : 'Sin resultados'}
        </div>
      )}
    </div>
  )

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {label && <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={openAndLoad}
          onClick={openAndLoad}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx('input pl-9 pr-16', error && 'border-red-500 focus:ring-red-500')}
        />
        {loading && <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
        {!loading && value && (
          <button type="button" onClick={clear} className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" title="Limpiar">
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="button" onMouseDown={e => { e.preventDefault(); openAndLoad() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" title="Ver opciones"
          disabled={disabled}>
          <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {menu && createPortal(menu, document.body)}
    </div>
  )
}
