import clsx from 'clsx'

interface BadgeProps { children: React.ReactNode; variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }

export default function Badge({ children, variant = 'gray' }: BadgeProps) {
  return <span className={`badge-${variant}`}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    draft: { label: 'Borrador', variant: 'gray' },
    confirmed: { label: 'Confirmado', variant: 'green' },
    cancelled: { label: 'Cancelado', variant: 'red' },
    partially_paid: { label: 'Pago parcial', variant: 'yellow' },
    paid: { label: 'Pagado', variant: 'green' },
  }
  const s = map[status] ?? { label: status, variant: 'gray' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}
