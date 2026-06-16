import { useMemo } from 'react'
import { DataTable } from '../../components/ui/DataTable'
import { KpiCard } from '../../components/dashboard/KpiCard'
import { Badge } from '../../components/ui/Badge'
import { useResource } from '../../hooks/useResource'
import { formatFCFA, cn } from '../../lib/utils'

interface SoldePdv {
  id: string
  code: string
  raisonSociale: string
  secteur: { nom: string } | null
  totalEncaissements: number
  totalVersements: number
  solde: number
  plafond: number
  depassement: boolean
  taux: number
}

type Row = Record<string, unknown>

const money = (v: unknown) => formatFCFA(Number(v ?? 0))

export default function SuiviSoldePage() {
  const { data, loading } = useResource<SoldePdv>('/pdvs/soldes')

  const kpis = useMemo(() => {
    const totalPdv = data.length
    const nbDepassements = data.filter((d) => d.depassement).length
    const soldeReseau = data.reduce((acc, d) => acc + Number(d.solde ?? 0), 0)
    const tauxMoyen =
      totalPdv > 0 ? data.reduce((acc, d) => acc + Number(d.taux ?? 0), 0) / totalPdv : 0
    return { totalPdv, nbDepassements, soldeReseau, tauxMoyen }
  }, [data])

  const totalsRow = useMemo<Partial<Row>>(() => {
    const totalEnc = data.reduce((acc, d) => acc + Number(d.totalEncaissements ?? 0), 0)
    const totalVers = data.reduce((acc, d) => acc + Number(d.totalVersements ?? 0), 0)
    const totalSolde = data.reduce((acc, d) => acc + Number(d.solde ?? 0), 0)
    const totalPlafond = data.reduce((acc, d) => acc + Number(d.plafond ?? 0), 0)
    return {
      code: 'TOTAL',
      totalEncaissements: totalEnc,
      totalVersements: totalVers,
      solde: totalSolde,
      plafond: totalPlafond,
    }
  }, [data])

  const rows = data as unknown as Row[]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-app-text" style={{ color: 'var(--text)' }}>
          Suivi Solde PDV
        </h2>
        <p className="text-sm text-app-muted mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Soldes, plafonds et dépassements du réseau de points de vente
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total PDV"
          value={String(kpis.totalPdv)}
          delta={0}
          deltaLabel="points de vente"
          color="blue"
        />
        <KpiCard
          label="Dépassements"
          value={String(kpis.nbDepassements)}
          delta={0}
          deltaLabel="PDV en dépassement"
          color="red"
        />
        <KpiCard
          label="Solde réseau total"
          value={formatFCFA(kpis.soldeReseau)}
          delta={0}
          deltaLabel="solde cumulé"
          color="green"
        />
        <KpiCard
          label="Taux moyen"
          value={`${kpis.tauxMoyen.toFixed(1)} %`}
          delta={0}
          deltaLabel="taux d'utilisation moyen"
          color="gold"
        />
      </div>

      <div
        className="bg-white rounded-xl border border-app-border p-5 shadow-sm"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h3 className="text-base font-bold text-app-text mb-4" style={{ color: 'var(--text)' }}>
          Soldes par PDV
        </h3>
        <DataTable<Row>
          loading={loading}
          rows={rows}
          totalsRow={totalsRow}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'raisonSociale', label: 'Raison sociale' },
            {
              key: 'secteur',
              label: 'Secteur',
              render: (_v, row) => {
                const secteur = (row as unknown as SoldePdv).secteur
                return secteur?.nom ?? '-'
              },
            },
            {
              key: 'totalEncaissements',
              label: 'Total encaissements',
              align: 'right',
              render: money,
            },
            {
              key: 'totalVersements',
              label: 'Versements validés',
              align: 'right',
              render: money,
            },
            {
              key: 'solde',
              label: 'Solde',
              align: 'right',
              render: (v, row) => {
                const r = row as unknown as SoldePdv
                const negative = r.depassement || Number(v ?? 0) < 0
                return (
                  <span className={cn('font-medium', negative && 'text-danger')}>
                    {formatFCFA(Number(v ?? 0))}
                  </span>
                )
              },
            },
            {
              key: 'plafond',
              label: 'Plafond (caution)',
              align: 'right',
              render: money,
            },
            {
              key: 'statut',
              label: 'Statut',
              render: (_v, row) => {
                const r = row as unknown as SoldePdv
                return r.depassement ? (
                  <Badge variant="danger">Dépassement</Badge>
                ) : (
                  <Badge variant="success">OK</Badge>
                )
              },
            },
          ]}
        />
      </div>
    </div>
  )
}
