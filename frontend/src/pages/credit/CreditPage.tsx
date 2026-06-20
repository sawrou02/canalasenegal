import { useCallback, useEffect, useState } from 'react'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { formatFCFA } from '../../lib/utils'
import { listCredits, rapportDette, type CreditRow } from '../../lib/api'
import { Card, PageHeader, type Row } from '../../components/ui/Section'

interface Props {
  onlyDette?: boolean
}

export default function CreditPage({ onlyDette = false }: Props) {
  const toast = useToast()
  const [rows, setRows] = useState<CreditRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await (onlyDette ? rapportDette() : listCredits()))
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyDette])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return (
    <div className="space-y-4">
      <PageHeader
        title={onlyDette ? 'Rapport dette' : 'Suivi crédit affectable'}
        subtitle={onlyDette ? 'Points de vente avec une dette en cours' : 'Plafonds, avoirs, dettes et crédit disponible par PDV'}
      />
      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            searchable
            emptyMessage="Aucune donnée de crédit"
            columns={[
              { key: 'pdv', label: 'PDV', render: (_v, row) => (row as unknown as CreditRow).pdv?.raisonSociale ?? '—' },
              { key: 'plafond', label: 'Plafond', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
              { key: 'avoir', label: 'Avoir', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
              { key: 'dette', label: 'Dette', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
              { key: 'encours', label: 'Encours', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
              {
                key: 'creditDispo',
                label: 'Crédit dispo.',
                align: 'right',
                render: (v) => {
                  const n = Number(v ?? 0)
                  return <span style={{ color: n < 0 ? 'var(--danger)' : 'var(--text)', fontWeight: 600 }}>{formatFCFA(n)}</span>
                },
              },
            ]}
          />
        </div>
      </Card>
    </div>
  )
}
