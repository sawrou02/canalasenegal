import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { useResource } from '../../hooks/useResource'
import { useAuthStore } from '../../store/authStore'
import { formatFCFA, formatDate } from '../../lib/utils'
import { listArretes, createArrete, type ArreteRow } from '../../lib/api'
import { Card, PageHeader, FieldLabel, inputCls, type Row } from '../../components/ui/Section'

const MUT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COMPTABLE']
interface PdvLite { id: string; raisonSociale: string }
const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ArretesPage() {
  const toast = useToast()
  const role = useAuthStore((s) => s.user?.role)
  const canMutate = role ? MUT_ROLES.includes(role) : false
  const { data: pdvs } = useResource<PdvLite>('/pdvs')

  const [rows, setRows] = useState<ArreteRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listArretes())
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

  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pdvId, setPdvId] = useState('')
  const [periode, setPeriode] = useState(currentMonth())

  const openModal = () => {
    setPdvId(pdvs?.[0]?.id ?? '')
    setPeriode(currentMonth())
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdvId || !periode) {
      toast.error('PDV et période requis')
      return
    }
    setSubmitting(true)
    try {
      await createArrete({ pdvId, periode })
      toast.success('Arrêté de solde signé ✓')
      setOpen(false)
      void refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "Erreur lors de l'arrêté")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Arrêtés de soldes PDV" subtitle="Clôtures mensuelles (interdit si versements en attente)" />
        {canMutate && <Button variant="primary" onClick={openModal}>+ Nouvel arrêté</Button>}
      </div>
      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            searchable
            emptyMessage="Aucun arrêté"
            columns={[
              { key: 'pdv', label: 'PDV', render: (_v, row) => (row as unknown as ArreteRow).pdv?.raisonSociale ?? '—' },
              { key: 'periode', label: 'Période' },
              { key: 'soldeFige', label: 'Solde figé', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
              { key: 'dateArrete', label: 'Date arrêté', render: (v) => (v ? formatDate(String(v)) : '—') },
              { key: 'statut', label: 'Statut', render: (v) => <Badge variant="success">{String(v)}</Badge> },
            ]}
          />
        </div>
      </Card>
      <Modal isOpen={open} onClose={() => !submitting && setOpen(false)} title="Nouvel arrêté de solde">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel>PDV</FieldLabel>
            <select value={pdvId} onChange={(e) => setPdvId(e.target.value)} className={inputCls}>
              {(pdvs ?? []).map((p) => (<option key={p.id} value={p.id}>{p.raisonSociale}</option>))}
            </select>
          </div>
          <div>
            <FieldLabel>Période (AAAA-MM)</FieldLabel>
            <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} className={inputCls} />
          </div>
          <p className="text-xs text-app-muted">Le solde est figé automatiquement. L'opération est refusée s'il reste des versements en attente.</p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" variant="primary" loading={submitting}>Signer l'arrêté</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
