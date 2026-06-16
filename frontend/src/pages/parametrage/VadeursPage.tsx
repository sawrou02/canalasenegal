import { CrudResourcePage } from '../../components/crud/CrudResourcePage'
import { Badge } from '../../components/ui/Badge'
import { formatFCFA } from '../../lib/utils'

type Row = Record<string, unknown>

const money = (v: unknown) => formatFCFA(Number(v ?? 0))

export default function VadeursPage() {
  return (
    <CrudResourcePage
      title="Vadeurs (VAD)"
      subtitle="Points de vente de type VAD"
      apiPath="/pdvs?type=VAD"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'raisonSociale', label: 'Raison sociale' },
        {
          key: 'secteur',
          label: 'Secteur',
          render: (_v, row: Row) => (row.secteur as { nom?: string } | undefined)?.nom ?? '-',
        },
        {
          key: 'localite',
          label: 'Localité',
          render: (_v, row: Row) => (row.localite as { nom?: string } | undefined)?.nom ?? '-',
        },
        { key: 'caution', label: 'Caution', align: 'right', render: money },
        {
          key: 'soldeActuel',
          label: 'Solde actuel',
          align: 'right',
          render: (v) => {
            const n = Number(v ?? 0)
            return <span className={n < 0 ? 'text-danger font-semibold' : ''}>{formatFCFA(n)}</span>
          },
        },
        {
          key: 'statut',
          label: 'Statut',
          render: (v) => (
            <Badge variant={v === 'ACTIF' ? 'success' : 'neutral'}>{String(v ?? '-')}</Badge>
          ),
        },
      ]}
      formFields={[
        { name: 'code', label: 'Code', type: 'text', required: true },
        { name: 'raisonSociale', label: 'Raison sociale', type: 'text', required: true },
        { name: 'secteurId', label: 'Secteur', type: 'select', optionsPath: '/secteurs', required: true },
        { name: 'localiteId', label: 'Localité', type: 'select', optionsPath: '/localites', required: true },
        { name: 'caution', label: 'Caution', type: 'number' },
      ]}
    />
  )
}
