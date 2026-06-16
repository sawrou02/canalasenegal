import { CrudResourcePage } from '../../components/crud/CrudResourcePage'
import { Badge } from '../../components/ui/Badge'
import { formatFCFA } from '../../lib/utils'
import type { KpiCardData } from '../../types'

type Row = Record<string, unknown>

const money = (v: unknown) => formatFCFA(Number(v ?? 0))

const PDV_TYPE_OPTIONS = [
  { value: 'BOUTIQUE_PROPRE', label: 'Boutique propre' },
  { value: 'SOUS_RESEAU', label: 'Sous-réseau' },
  { value: 'AGENCE_PRINCIPALE', label: 'Agence principale' },
  { value: 'VAD', label: 'VAD' },
  { value: 'APPORTEUR', label: 'Apporteur' },
]

export default function PdvListePage() {
  return (
    <CrudResourcePage
      title="Liste PDV"
      subtitle="Points de vente du réseau"
      apiPath="/pdvs"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'raisonSociale', label: 'Raison sociale' },
        { key: 'type', label: 'Type' },
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
      kpis={(rows: Row[]): KpiCardData[] => {
        const total = rows.length
        const actifs = rows.filter((r) => r.statut === 'ACTIF').length
        const negatifs = rows.filter((r) => Number(r.soldeActuel ?? 0) < 0).length
        return [
          { label: 'Total PDV', value: String(total), delta: 0, deltaLabel: 'enregistrés', color: 'blue' },
          { label: 'PDV actifs', value: String(actifs), delta: 0, deltaLabel: 'actifs', color: 'green' },
          { label: 'Soldes négatifs', value: String(negatifs), delta: 0, deltaLabel: 'à surveiller', color: 'red' },
        ]
      }}
      formFields={[
        { name: 'code', label: 'Code', type: 'text', required: true },
        { name: 'raisonSociale', label: 'Raison sociale', type: 'text', required: true },
        { name: 'type', label: 'Type', type: 'select', options: PDV_TYPE_OPTIONS },
        { name: 'secteurId', label: 'Secteur', type: 'select', optionsPath: '/secteurs', required: true },
        { name: 'localiteId', label: 'Localité', type: 'select', optionsPath: '/localites', required: true },
        { name: 'caution', label: 'Caution', type: 'number' },
      ]}
    />
  )
}
