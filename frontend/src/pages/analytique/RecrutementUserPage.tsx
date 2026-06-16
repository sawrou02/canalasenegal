import { useCallback, useEffect, useState } from 'react'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { recrutementUser, type RecrutementUserRow } from '../../lib/api'
import { Card, PageHeader, PeriodeSelector, currentMonth, money, num, type Row } from './shared'

const fullName = (u?: { prenom?: string; nom?: string }) =>
  [u?.prenom, u?.nom].filter(Boolean).join(' ') || '-'

export default function RecrutementUserPage({ title }: { title?: string }) {
  const toast = useToast()
  const [periode, setPeriode] = useState(currentMonth())
  const [rows, setRows] = useState<RecrutementUserRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: string) => {
    setLoading(true)
    try {
      setRows(await recrutementUser(p))
    } catch {
      toast.error('Erreur lors du chargement du recrutement par utilisateur')
      setRows([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void fetchData(periode)
  }, [periode, fetchData])

  const columns = [
    {
      key: 'user',
      label: 'Utilisateur',
      render: (_v: unknown, row: Row) => fullName((row as unknown as RecrutementUserRow).user),
    },
    { key: 'nbRecru', label: 'Nb recrut.', align: 'right' as const, render: num },
    { key: 'caRecru', label: 'CA recrut.', align: 'right' as const, render: money },
    { key: 'nbReabo', label: 'Nb réabo', align: 'right' as const, render: num },
    {
      key: 'total',
      label: 'Total',
      align: 'right' as const,
      render: (v: unknown) => <span className="font-bold text-primary-dark">{money(v)}</span>,
    },
  ]

  const totalsRow: Partial<Row> | undefined = rows.length
    ? {
        user: { prenom: '', nom: 'TOTAL' },
        nbRecru: rows.reduce((s, r) => s + (Number(r.nbRecru) || 0), 0),
        caRecru: rows.reduce((s, r) => s + (Number(r.caRecru) || 0), 0),
        nbReabo: rows.reduce((s, r) => s + (Number(r.nbReabo) || 0), 0),
        total: rows.reduce((s, r) => s + (Number(r.total) || 0), 0),
      }
    : undefined

  return (
    <div className="space-y-4">
      <PageHeader title={title ?? 'Recrutement par Utilisateur'} subtitle="Performance de recrutement et réabonnement par utilisateur">
        <PeriodeSelector periode={periode} onChange={setPeriode} />
      </PageHeader>

      <Card>
        <h3 className="text-base font-bold text-app-text mb-4" style={{ color: 'var(--text)' }}>
          Détail par utilisateur — {periode}
        </h3>
        <div className="min-h-[420px]">
          <DataTable<Row>
            columns={columns}
            rows={rows as unknown as Row[]}
            loading={loading}
            emptyMessage="Aucune donnée pour cette période"
            totalsRow={totalsRow}
          />
        </div>
      </Card>
    </div>
  )
}
