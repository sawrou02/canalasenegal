import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { useResource } from '../../hooks/useResource'
import { useAuthStore } from '../../store/authStore'
import { formatFCFA, formatDate } from '../../lib/utils'
import {
  listVentesAccessoire,
  listAccessoires,
  vendreAccessoire,
  type VenteAccessoireRow,
  type AccessoireRow,
} from '../../lib/api'
import { Card, PageHeader, FieldLabel, inputCls, type Row } from '../../components/ui/Section'

const MUT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'LOGISTICIEN']
interface PdvLite { id: string; raisonSociale: string }

export default function VentesPage({ title }: { title?: string }) {
  const toast = useToast()
  const role = useAuthStore((s) => s.user?.role)
  const canMutate = role ? MUT_ROLES.includes(role) : false
  const { data: pdvs } = useResource<PdvLite>('/pdvs')

  const [rows, setRows] = useState<VenteAccessoireRow[]>([])
  const [accessoires, setAccessoires] = useState<AccessoireRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const [v, a] = await Promise.all([listVentesAccessoire(), listAccessoires()])
      setRows(v)
      setAccessoires(a)
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
  const [accessoireId, setAccessoireId] = useState('')
  const [pdvId, setPdvId] = useState('')
  const [quantite, setQuantite] = useState(0)

  const openModal = () => {
    setAccessoireId(accessoires[0]?.id ?? '')
    setPdvId(pdvs?.[0]?.id ?? '')
    setQuantite(0)
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessoireId || !pdvId || quantite <= 0) {
      toast.error('Accessoire, PDV et quantité requis')
      return
    }
    setSubmitting(true)
    try {
      await vendreAccessoire({ accessoireId, pdvId, quantite })
      toast.success('Vente enregistrée ✓')
      setOpen(false)
      void refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur lors de la vente')
    } finally {
      setSubmitting(false)
    }
  }

  const totalsRow = useMemo<Partial<Row>>(
    () => ({ date: 'TOTAL', montant: rows.reduce((a, r) => a + Number(r.montant ?? 0), 0) }),
    [rows],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title={title ?? "Suivi des ventes d'accessoires"} subtitle="Ventes d'accessoires par point de vente" />
        {canMutate && <Button variant="primary" onClick={openModal}>+ Enregistrer une vente</Button>}
      </div>

      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            totalsRow={totalsRow}
            searchable
            emptyMessage="Aucune vente"
            columns={[
              { key: 'date', label: 'Date', render: (v) => (String(v) === 'TOTAL' ? 'TOTAL' : v ? formatDate(String(v)) : '—') },
              { key: 'accessoire', label: 'Accessoire', render: (_v, row) => (row as unknown as VenteAccessoireRow).accessoire?.nom ?? '—' },
              { key: 'pdv', label: 'PDV', render: (_v, row) => (row as unknown as VenteAccessoireRow).pdv?.raisonSociale ?? '—' },
              { key: 'quantite', label: 'Quantité', align: 'right' },
              { key: 'montant', label: 'Montant', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
            ]}
          />
        </div>
      </Card>

      <Modal isOpen={open} onClose={() => !submitting && setOpen(false)} title="Enregistrer une vente">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel>Accessoire</FieldLabel>
            <select value={accessoireId} onChange={(e) => setAccessoireId(e.target.value)} className={inputCls}>
              {accessoires.map((a) => (
                <option key={a.id} value={a.id}>{a.nom} — {formatFCFA(a.prixUnitaire)}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>PDV</FieldLabel>
            <select value={pdvId} onChange={(e) => setPdvId(e.target.value)} className={inputCls}>
              {(pdvs ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.raisonSociale}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Quantité</FieldLabel>
            <input type="number" value={quantite === 0 ? '' : quantite} onChange={(e) => setQuantite(Number(e.target.value) || 0)} className={inputCls} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" variant="primary" loading={submitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
