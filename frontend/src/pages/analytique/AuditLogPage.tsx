import { useCallback, useEffect, useState } from 'react'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { getRoleLabel } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { auditLog, type AuditLogRow } from '../../lib/api'
import { Card, PageHeader, type Row } from './shared'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN']

const fullName = (u?: { prenom?: string; nom?: string }) =>
  [u?.prenom, u?.nom].filter(Boolean).join(' ') || '-'

export default function AuditLogPage() {
  const toast = useToast()
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = !!role && ADMIN_ROLES.includes(role)

  const [rows, setRows] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(isAdmin)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await auditLog(200))
    } catch {
      toast.error("Erreur lors du chargement du journal d'audit")
      setRows([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isAdmin) void fetchData()
  }, [isAdmin, fetchData])

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader title="Récap Audit" subtitle="Journal des actions des utilisateurs" />
        <Card>
          <div className="py-12 text-center text-app-muted" style={{ color: 'var(--text-muted)' }}>
            Accès réservé aux administrateurs
          </div>
        </Card>
      </div>
    )
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Date/heure',
      render: (v: unknown) => (v ? new Date(String(v)).toLocaleString('fr-FR') : '-'),
    },
    {
      key: 'user',
      label: 'Utilisateur',
      render: (_v: unknown, row: Row) => fullName((row as unknown as AuditLogRow).user),
    },
    {
      key: 'role',
      label: 'Rôle',
      render: (_v: unknown, row: Row) => (
        <Badge variant="info">{getRoleLabel((row as unknown as AuditLogRow).user?.role ?? '')}</Badge>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (v: unknown) => <Badge variant="neutral">{String(v ?? '-')}</Badge>,
    },
    { key: 'module', label: 'Module' },
    {
      key: 'ip',
      label: 'IP',
      render: (v: unknown) => <span className="font-mono text-xs">{String(v ?? '-')}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Récap Audit" subtitle="Journal des actions des utilisateurs" />
      <Card>
        <h3 className="text-base font-bold text-app-text mb-4" style={{ color: 'var(--text)' }}>
          Journal d'audit (200 dernières actions)
        </h3>
        <div className="min-h-[420px]">
          <DataTable<Row>
            columns={columns}
            rows={rows as unknown as Row[]}
            loading={loading}
            emptyMessage="Aucune action enregistrée"
          />
        </div>
      </Card>
    </div>
  )
}
