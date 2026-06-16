import { CrudResourcePage } from '../../components/crud/CrudResourcePage'
import { Badge } from '../../components/ui/Badge'

type Row = Record<string, unknown>

export default function EntrepotsPage() {
  return (
    <CrudResourcePage
      title="Entrepôts"
      subtitle="Entrepôts de stockage des décodeurs"
      apiPath="/entrepots"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'nom', label: 'Nom' },
        { key: 'type', label: 'Type' },
        { key: 'capacite', label: 'Capacité', align: 'right' },
        {
          key: 'decodeurs',
          label: 'Décodeurs',
          align: 'right',
          render: (_v, row: Row) => {
            const count = row._count as { decodeurs?: number } | undefined
            return count?.decodeurs ?? 0
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
        { name: 'nom', label: 'Nom', type: 'text', required: true },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: [
            { value: 'PRINCIPAL', label: 'Principal' },
            { value: 'SECONDAIRE', label: 'Secondaire' },
          ],
        },
        { name: 'capacite', label: 'Capacité', type: 'number', required: true },
      ]}
    />
  )
}
