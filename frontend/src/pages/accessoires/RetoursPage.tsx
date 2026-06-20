import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { useResource } from '../../hooks/useResource'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import {
  listRetours,
  listAccessoires,
  creerRetour,
  type RetourRow,
  type AccessoireRow,
} from '../../lib/api'
import { Card, PageHeader, FieldLabel, inputCls, type Row } from '../../components/ui/Section'

const MUT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'LOGISTICIEN']
interface PdvLite { id: string; raisonSociale: string }

export default function RetoursPage() {
  const toast = useToast()
  const role = useAuthStore((s) => s.user?.role)
  const canMutate = role ? MUT_ROLES.includes(role) : false
  const { data: pdvs } = useResource<PdvLite>('/pdvs')

  const [rows, setRows] = useState<RetourRow[]>([])
  const [accessoires, setAccessoires] = useState<AccessoireRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const [r, a] = await Promise.all([listRetours(), listAccessoires()])
      setRows(r)
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
  const [motif, setMotif] = useState('')

  const openModal = () => {
    setAccessoireId(accessoires[0]?.id ?? '')
    setPdvId(pdvs?.[0]?.id ?? '')
    setQuantite(0)
    setMotif('')
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessoireId || !pdvId || quantite <= 0 || !motif.trim()) {
      toast.error('Tous les champs sont requis')
      return
    }
    setSubmitting(true)
    try {
      await creerRetour({ accessoireId, pdvId, quantite, motif: motif.trim() })
      toast.success('Retour déclaré ✓')
      setOpen(false)
      void refetch()
    } catch {
      toast.error('Erreur lors de la déclaration')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Retour des défectueux en agence" subtitle="Accessoires défectueux retournés par le réseau" />
        {canMutate && <Button variant="primary" onClick={openModal}>+ Déclarer un retour</Button>}
      </div>

      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            searchable
            emptyMessage="Aucun retour"
            columns={[
              { key: 'date', label: 'Date', render: (v) => (v ? formatDate(String(v)) : '—') },
              { key: 'accessoire', label: 'Accessoire', render: (_v, row) => (row as unknown as RetourRow).accessoire?.nom ?? '—' },
              { key: 'pdv', label: 'PDV', render: (_v, row) => (row as unknown as RetourRow).pdv?.raisonSociale ?? '—' },
              { key: 'quantite', label: 'Quantité', align: 'right' },
              { key: 'motif', label: 'Motif' },
              { key: 'statut', label: 'Statut', render: (v) => <Badge variant={String(v) === 'TRAITE' ? 'success' : 'warning'}>{String(v ?? '—')}</Badge> },
            ]}
          />
        </div>
      </Card>

      <Modal isOpen={open} onClose={() => !submitting && setOpen(false)} title="Déclarer un retour défectueux">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel>Accessoire</FieldLabel>
            <select value={accessoireId} onChange={(e) => setAccessoireId(e.target.value)} className={inputCls}>
              {accessoires.map((a) => (<option key={a.id} value={a.id}>{a.nom}</option>))}
            </select>
          </div>
          <div>
            <FieldLabel>PDV</FieldLabel>
            <select value={pdvId} onChange={(e) => setPdvId(e.target.value)} className={inputCls}>
              {(pdvs ?? []).map((p) => (<option key={p.id} value={p.id}>{p.raisonSociale}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><FieldLabel>Quantité</FieldLabel><input type="number" value={quantite === 0 ? '' : quantite} onChange={(e) => setQuantite(Number(e.target.value) || 0)} className={inputCls} /></div>
            <div><FieldLabel>Motif</FieldLabel><input value={motif} onChange={(e) => setMotif(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" variant="primary" loading={submitting}>Déclarer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
