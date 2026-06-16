import { CrudResourcePage } from '../../components/crud/CrudResourcePage'
import { Badge } from '../../components/ui/Badge'
import { formatFCFA } from '../../lib/utils'
import type { KpiCardData } from '../../types'

type Row = Record<string, unknown>

const money = (v: unknown) => formatFCFA(Number(v ?? 0))

export default function FormulesPage() {
  return (
    <CrudResourcePage
      title="Formules"
      subtitle="Catalogue des formules commerciales"
      apiPath="/formules"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'nomCommercial', label: 'Nom commercial' },
        { key: 'prixMateriel', label: 'Prix matériel', align: 'right', render: money },
        { key: 'prixFormule', label: 'Prix formule', align: 'right', render: money },
        {
          key: 'statut',
          label: 'Statut',
          render: (v) => (
            <Badge variant={v === 'ACTIF' ? 'success' : 'neutral'}>{String(v ?? '-')}</Badge>
          ),
        },
      ]}
      kpis={(rows: Row[]): KpiCardData[] => {
        const total = rows.length
        const actives = rows.filter((r) => r.statut === 'ACTIF').length
        const moyenne =
          total > 0
            ? rows.reduce((acc, r) => acc + Number(r.prixFormule ?? 0), 0) / total
            : 0
        return [
          { label: 'Total formules', value: String(total), delta: 0, deltaLabel: 'enregistrées', color: 'blue' },
          { label: 'Prix moyen formule', value: formatFCFA(moyenne), delta: 0, deltaLabel: 'moyenne', color: 'gold' },
          { label: 'Formules actives', value: String(actives), delta: 0, deltaLabel: 'actives', color: 'green' },
        ]
      }}
      formFields={[
        { name: 'code', label: 'Code', type: 'text', required: true },
        { name: 'nomCommercial', label: 'Nom commercial', type: 'text', required: true },
        { name: 'prixMateriel', label: 'Prix matériel', type: 'number', required: true },
        { name: 'prixFormule', label: 'Prix formule', type: 'number', required: true },
      ]}
    />
  )
}
