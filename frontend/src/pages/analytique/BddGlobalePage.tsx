import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { formatDate } from '../../lib/utils'
import { bddGlobale, type BddAbonneRow } from '../../lib/api'
import { Card, PageHeader, type Row } from '../../components/ui/Section'

const STATUT_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  ACTIF: 'success',
  ECHU: 'danger',
  SUSPENDU: 'warning',
  RESILIE: 'neutral',
}

export default function BddGlobalePage() {
  const toast = useToast()
  const [rows, setRows] = useState<BddAbonneRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await bddGlobale())
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

  return (
    <div className="space-y-4">
      <PageHeader title="Base de données globale" subtitle="Tous les abonnés du réseau" />
      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            searchable
            pageSize={25}
            emptyMessage="Aucun abonné"
            columns={[
              { key: 'numAbonne', label: 'N° Abonné' },
              { key: 'client', label: 'Nom & Prénom' },
              { key: 'tel1', label: 'Téléphone' },
              { key: 'formule', label: 'Formule' },
              { key: 'pdv', label: 'PDV' },
              { key: 'dateEcheance', label: 'Échéance', render: (v) => (v ? formatDate(String(v)) : '—') },
              { key: 'statut', label: 'Statut', render: (v) => <Badge variant={STATUT_VARIANT[String(v)] ?? 'neutral'}>{String(v)}</Badge> },
            ]}
          />
        </div>
      </Card>
    </div>
  )
}
