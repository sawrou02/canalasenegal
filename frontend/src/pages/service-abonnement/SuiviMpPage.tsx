import { useResource } from '../../hooks/useResource'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'
import { type AbonneRow } from '../../lib/api'
import { Card, PageHeader, fullName, asRows, type Row } from './shared'

export default function SuiviMpPage() {
  const { data, loading } = useResource<AbonneRow>('/service-abonnement/suivi-mp')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suivi MP"
        subtitle="Suivi du multi-points et des niveaux des abonnés"
      />

      <Card>
        <DataTable<Row>
          loading={loading}
          rows={asRows(data)}
          emptyMessage="Aucun abonné à suivre"
          columns={[
            { key: 'numAbonne', label: 'N° Abonné' },
            { key: 'nom', label: 'Nom', render: (_v, row) => fullName(row as unknown as AbonneRow) },
            {
              key: 'formule',
              label: 'Formule',
              render: (_v, row) => (row as unknown as AbonneRow).formule?.nomCommercial ?? '-',
            },
            {
              key: 'niveau',
              label: 'Niveau',
              render: (_v, row) => {
                const niveau = (row as unknown as AbonneRow).niveau
                return niveau ? <Badge variant="info">{niveau}</Badge> : '-'
              },
            },
            {
              key: 'dateEcheance',
              label: 'Date échéance',
              render: (v) => (v ? formatDate(String(v)) : '-'),
            },
            {
              key: 'pdv',
              label: 'PDV',
              render: (_v, row) => (row as unknown as AbonneRow).pdv?.raisonSociale ?? '-',
            },
          ]}
        />
      </Card>
    </div>
  )
}
