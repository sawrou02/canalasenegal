import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { formatFCFA, formatDate } from '../../lib/utils'
import { reaboMomo, type ReaboMomoRow } from '../../lib/api'
import { Card, PageHeader, type Row } from '../../components/ui/Section'

export default function ReaboMomoPage() {
  const toast = useToast()
  const [rows, setRows] = useState<ReaboMomoRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await reaboMomo())
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const totalsRow = useMemo<Partial<Row>>(
    () => ({ date: 'TOTAL', montant: rows.reduce((a, r) => a + Number(r.montant ?? 0), 0) }),
    [rows],
  )

  return (
    <div className="space-y-4">
      <PageHeader title="Liste des réabonnements MOMO" subtitle="Réabonnements réglés via Wave / Orange Money" />
      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            totalsRow={totalsRow}
            searchable
            emptyMessage="Aucun réabonnement MOMO"
            columns={[
              { key: 'date', label: 'Date', render: (v) => (String(v) === 'TOTAL' ? 'TOTAL' : v ? formatDate(String(v)) : '—') },
              { key: 'numAbonne', label: 'N° Abonné' },
              { key: 'client', label: 'Client' },
              { key: 'formule', label: 'Formule' },
              { key: 'pdv', label: 'PDV' },
              { key: 'canal', label: 'Canal', render: (v) => <Badge variant="info">{String(v)}</Badge> },
              { key: 'montant', label: 'Montant', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
            ]}
          />
        </div>
      </Card>
    </div>
  )
}
