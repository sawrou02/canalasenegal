import { useResource } from '../../hooks/useResource'
import { DataTable } from '../../components/ui/DataTable'
import { type AbonneRow } from '../../lib/api'
import { Card, PageHeader, fullName, asRows, type Row } from './shared'

export default function NonQualifiesPage() {
  const { data, loading } = useResource<AbonneRow>('/service-abonnement/non-qualifies')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Abonnés non qualifiés"
        subtitle="Abonnés ne remplissant pas les critères de qualification"
      />

      <Card>
        <DataTable<Row>
          loading={loading}
          rows={asRows(data)}
          emptyMessage="Aucun abonné non qualifié"
          columns={[
            { key: 'numAbonne', label: 'N° Abonné' },
            { key: 'nom', label: 'Nom', render: (_v, row) => fullName(row as unknown as AbonneRow) },
            { key: 'motif', label: 'Motif', render: (v) => String(v ?? '-') },
            {
              key: 'formule',
              label: 'Formule',
              render: (_v, row) => (row as unknown as AbonneRow).formule?.nomCommercial ?? '-',
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
