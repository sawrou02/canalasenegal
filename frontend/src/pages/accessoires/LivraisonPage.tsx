import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { useResource } from '../../hooks/useResource'
import { useAuthStore } from '../../store/authStore'
import {
  listStockReseau,
  listAccessoires,
  livrerAccessoire,
  type StockReseauRow,
  type AccessoireRow,
} from '../../lib/api'
import { Card, PageHeader, FieldLabel, inputCls, type Row } from '../../components/ui/Section'

const MUT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'LOGISTICIEN']
interface PdvLite { id: string; raisonSociale: string }

interface Props {
  readOnly?: boolean
  title?: string
}

export default function LivraisonPage({ readOnly = false, title }: Props) {
  const toast = useToast()
  const role = useAuthStore((s) => s.user?.role)
  const canMutate = !readOnly && (role ? MUT_ROLES.includes(role) : false)
  const { data: pdvs } = useResource<PdvLite>('/pdvs')

  const [rows, setRows] = useState<StockReseauRow[]>([])
  const [accessoires, setAccessoires] = useState<AccessoireRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const [s, a] = await Promise.all([listStockReseau(), listAccessoires()])
      setRows(s)
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
      await livrerAccessoire({ accessoireId, pdvId, quantite })
      toast.success('Livraison enregistrée ✓')
      setOpen(false)
      void refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur lors de la livraison')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title={title ?? (readOnly ? 'Consultation stock Réseau' : 'Livraison au réseau')} subtitle="Stock accessoires par point de vente" />
        {canMutate && <Button variant="primary" onClick={openModal}>+ Livrer au réseau</Button>}
      </div>

      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            searchable
            emptyMessage="Aucun stock réseau"
            columns={[
              { key: 'accessoire', label: 'Accessoire', render: (_v, row) => (row as unknown as StockReseauRow).accessoire?.nom ?? '—' },
              { key: 'pdv', label: 'PDV', render: (_v, row) => (row as unknown as StockReseauRow).pdv?.raisonSociale ?? '—' },
              { key: 'quantite', label: 'Quantité', align: 'right' },
            ]}
          />
        </div>
      </Card>

      <Modal isOpen={open} onClose={() => !submitting && setOpen(false)} title="Livraison au réseau">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel>Accessoire</FieldLabel>
            <select value={accessoireId} onChange={(e) => setAccessoireId(e.target.value)} className={inputCls}>
              {accessoires.map((a) => (
                <option key={a.id} value={a.id}>{a.nom} (stock: {a.stockEntrepot})</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>PDV destinataire</FieldLabel>
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
            <Button type="submit" variant="primary" loading={submitting}>Livrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
