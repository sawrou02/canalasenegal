import { cn } from '../../lib/utils'

export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('bg-white rounded-xl border border-app-border p-5 shadow-sm', className)}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-black text-app-text" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-app-muted mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-app-text block mb-1.5">{children}</label>
}

export const inputCls =
  'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20'

export type Row = Record<string, unknown>
