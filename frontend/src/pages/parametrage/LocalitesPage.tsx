import { CrudResourcePage } from '../../components/crud/CrudResourcePage'

type Row = Record<string, unknown>

export default function LocalitesPage() {
  return (
    <CrudResourcePage
      title="Localités"
      subtitle="Localités rattachées aux secteurs"
      apiPath="/localites"
      columns={[
        { key: 'nom', label: 'Nom' },
        {
          key: 'secteur',
          label: 'Secteur',
          render: (_v, row: Row) => {
            const secteur = row.secteur as { nom?: string } | undefined
            return secteur?.nom ?? '-'
          },
        },
      ]}
      formFields={[
        { name: 'nom', label: 'Nom', type: 'text', required: true },
        { name: 'secteurId', label: 'Secteur', type: 'select', optionsPath: '/secteurs', required: true },
      ]}
    />
  )
}
