import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Download, Search, Filter, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import * as XLSX from 'xlsx'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataGridProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRefresh?: () => void
  actions?: (row: T) => React.ReactNode
  exportFileName?: string
  emptyMessage?: string
  toolbar?: React.ReactNode
  rowClassName?: (row: T) => string | undefined
}

export default function DataGrid<T extends { id?: number }>({ columns, data, loading, onRefresh, actions, exportFileName = 'export', emptyMessage = 'Sin registros', toolbar, rowClassName }: DataGridProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let rows = [...data]
    if (search) {
      const s = search.toLowerCase()
      rows = rows.filter(row =>
        columns.some(col => {
          const val = (row as any)[col.key]
          return val != null && String(val).toLowerCase().includes(s)
        })
      )
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = (a as any)[sortKey], bv = (b as any)[sortKey]
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [data, search, sortKey, sortDir, columns])

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(row =>
      Object.fromEntries(columns.map(c => [c.header, (row as any)[c.key]]))
    ))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${exportFileName}.xlsx`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Filtrar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={exportExcel} className="btn-secondary btn-sm"><Download className="w-4 h-4" /> Excel</button>
        {onRefresh && <button onClick={onRefresh} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4" /></button>}
        {toolbar}
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} style={col.width ? { width: col.width } : {}}
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}>
                  <span className="flex items-center gap-1">
                    {col.header}
                    {sortKey === String(col.key) ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
                  </span>
                </th>
              ))}
              {actions && <th className="w-24">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12">
                <div className="inline-flex items-center gap-2 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin" /> Cargando...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-gray-400">{emptyMessage}</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={(row as any).id ?? i} className={rowClassName?.(row) ?? ''}>
                  {columns.map(col => (
                    <td key={String(col.key)}>{col.render ? col.render(row) : String((row as any)[col.key] ?? '')}</td>
                  ))}
                  {actions && <td><div className="flex items-center gap-1">{actions(row)}</div></td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} registros</div>
    </div>
  )
}
