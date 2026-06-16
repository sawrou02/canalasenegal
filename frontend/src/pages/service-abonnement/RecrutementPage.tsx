import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { formatFCFA, formatDate } from '../../lib/utils'
import { listRecrutement, type RecrutementRow } from '../../lib/api'
import { Card, PageHeader } from './shared'

type Row = Record<string, unknown>

export default function RecrutementPage() {
  const toast = useToast()
  const [rows, setRows] = useState<RecrutementRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listRecrutement())
    } catch {
      toast.error('Erreur lors du chargement')
      setRows([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const totalsRow = useMemo<Partial<Row>>(() => {
    const total = rows.reduce((acc, r) => acc + Number(r.montantTotal ?? 0), 0)
    return { date: 'TOTAL', montantTotal: total }
  }, [rows])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Période de recrutement"
        subtitle="Recrutements de nouveaux abonnés sur la période"
      />

      <Card>
        <DataTable<Row>
          loading={loading}
          rows={rows as unknown as Row[]}
          totalsRow={totalsRow}
          emptyMessage="Aucun recrutement sur la période"
          columns={[
            {
              key: 'date',
              label: 'Date',
              render: (v) => {
                const s = String(v ?? '')
                return s === 'TOTAL' ? 'TOTAL' : s ? formatDate(s) : '-'
              },
            },
            {
              key: 'abonne',
              label: 'Abonné',
              render: (_v, row) => {
                const a = (row as unknown as RecrutementRow).abonne
                if (!a) return '-'
                return [a.numAbonne, a.nom].filter(Boolean).join(' — ') || '-'
              },
            },
            {
              key: 'formule',
              label: 'Formule',
              render: (_v, row) => (row as unknown as RecrutementRow).formule?.nomCommercial ?? '-',
            },
            {
              key: 'pdv',
              label: 'PDV',
              render: (_v, row) => (row as unknown as RecrutementRow).pdv?.raisonSociale ?? '-',
            },
            {
              key: 'montantTotal',
              label: 'Montant',
              align: 'right',
              render: (v) => formatFCFA(Number(v ?? 0)),
            },
          ]}
        />
      </Card>
    </div>
  )
}
