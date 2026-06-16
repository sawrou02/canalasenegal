import { cn, formatFCFA } from '../../lib/utils'

export function Card({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <div
      id={id}
      className={cn('bg-white rounded-xl border border-app-border p-5 shadow-sm', className)}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-black text-app-text" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <p className="text-sm text-app-muted mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      </div>
      {children && <div className="flex items-end gap-3 no-print">{children}</div>}
    </div>
  )
}

export function PeriodeSelector({
  periode,
  onChange,
}: {
  periode: string
  onChange: (p: string) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium text-app-text block mb-1.5">Période</label>
      <input
        type="month"
        value={periode}
        onChange={(e) => onChange(e.target.value)}
        className="border border-app-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

export const currentMonth = () => new Date().toISOString().slice(0, 7)

export type Row = Record<string, unknown>

export const money = (v: unknown) => formatFCFA(Number(v) || 0)
export const num = (v: unknown) => (Number(v) || 0).toLocaleString('fr-FR')
