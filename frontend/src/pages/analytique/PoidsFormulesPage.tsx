import { useCallback, useEffect, useState } from 'react'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { caFormule, type CaFormuleRow } from '../../lib/api'
import { Card, PageHeader, PeriodeSelector, currentMonth, money, num, type Row } from './shared'

export default function PoidsFormulesPage({ title }: { title?: string }) {
  const toast = useToast()
  const [periode, setPeriode] = useState(currentMonth())
  const [rows, setRows] = useState<CaFormuleRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: string) => {
    setLoading(true)
    try {
      setRows(await caFormule(p))
    } catch {
      toast.error('Erreur lors du chargement des formules')
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
      key: 'formule',
      label: 'Formule',
      render: (_v: unknown, row: Row) => (row as unknown as CaFormuleRow).formule?.nomCommercial ?? '-',
    },
    { key: 'nb', label: 'Nb', align: 'right' as const, render: num },
    { key: 'ca', label: 'CA', align: 'right' as const, render: money },
    {
      key: 'part',
      label: 'Part %',
      align: 'right' as const,
      render: (v: unknown) => `${Number(v) || 0} %`,
    },
  ]

  const totalsRow: Partial<Row> | undefined = rows.length
    ? {
        formule: { code: '', nomCommercial: 'TOTAL' },
        nb: rows.reduce((s, r) => s + (Number(r.nb) || 0), 0),
        ca: rows.reduce((s, r) => s + (Number(r.ca) || 0), 0),
        part: rows.reduce((s, r) => s + (Number(r.part) || 0), 0),
      }
    : undefined

  return (
    <div className="space-y-4">
      <PageHeader title={title ?? 'Poids des Formules'} subtitle="Répartition du chiffre d'affaires par formule commerciale">
        <PeriodeSelector periode={periode} onChange={setPeriode} />
      </PageHeader>

      <Card>
        <h3 className="text-base font-bold text-app-text mb-4" style={{ color: 'var(--text)' }}>
          Détail par formule — {periode}
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
