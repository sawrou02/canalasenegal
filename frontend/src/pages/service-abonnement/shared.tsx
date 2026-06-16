import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import type { AbonneRow, StatutAbonne } from '../../lib/api'

export const SMS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL']

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

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-black text-app-text" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      <p className="text-sm text-app-muted mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {subtitle}
      </p>
    </div>
  )
}

const STATUT_VARIANT: Record<StatutAbonne, 'success' | 'danger' | 'warning' | 'neutral'> = {
  ACTIF: 'success',
  ECHU: 'danger',
  SUSPENDU: 'warning',
  RESILIE: 'neutral',
}

export function statutBadge(statut: StatutAbonne) {
  return <Badge variant={STATUT_VARIANT[statut] ?? 'neutral'}>{statut}</Badge>
}

/** Full name "prenom nom" from an abonné row. */
export const fullName = (r: { prenom?: string; nom?: string }) =>
  [r.prenom, r.nom].filter(Boolean).join(' ') || '-'

export type Row = Record<string, unknown>

export const asRows = (data: AbonneRow[]): Row[] => data as unknown as Row[]
