import { CrudResourcePage } from '../../components/crud/CrudResourcePage'
import { formatFCFA } from '../../lib/utils'

const money = (v: unknown) => formatFCFA(Number(v ?? 0))

export default function BanquesPage() {
  return (
    <CrudResourcePage
      title="Banques"
      subtitle="Comptes bancaires et mobile money"
      apiPath="/banques"
      columns={[
        { key: 'nom', label: 'Nom' },
        { key: 'numCompte', label: 'N° de compte' },
        { key: 'type', label: 'Type' },
        { key: 'soldeActuel', label: 'Solde actuel', align: 'right', render: money },
      ]}
      formFields={[
        { name: 'nom', label: 'Nom', type: 'text', required: true },
        { name: 'numCompte', label: 'N° de compte', type: 'text', required: true },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: [
            { value: 'BANQUE', label: 'Banque' },
            { value: 'MOBILE_MONEY', label: 'Mobile Money' },
            { value: 'WAVE', label: 'Wave' },
          ],
        },
        { name: 'soldeActuel', label: 'Solde actuel', type: 'number' },
      ]}
    />
  )
}
