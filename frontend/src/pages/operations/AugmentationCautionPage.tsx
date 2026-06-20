import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { DataTable } from '../../components/ui/DataTable'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { apiClient, augmenterCaution } from '../../lib/api'
import { formatFCFA } from '../../lib/utils'
import { Card, PageHeader, FieldLabel, inputCls, type Row } from '../../components/ui/Section'

const MUT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMPTABLE']
interface PdvRow { id: string; code: string; raisonSociale: string; caution: number; secteur?: { nom: string } }

export default function AugmentationCautionPage() {
  const toast = useToast()
  const role = useAuthStore((s) => s.user?.role)
  const canMutate = role ? MUT_ROLES.includes(role) : false

  const [rows, setRows] = useState<PdvRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<PdvRow[]>('/pdvs')
      setRows(Array.isArray(res.data) ? res.data : [])
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
  const [target, setTarget] = useState<PdvRow | null>(null)
  const [montant, setMontant] = useState(0)

  const openModal = (p: PdvRow) => {
    setTarget(p)
    setMontant(0)
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!target || montant <= 0) {
      toast.error('Montant requis')
      return
    }
    setSubmitting(true)
    try {
      await augmenterCaution(target.id, montant)
      toast.success('Caution augmentée ✓')
      setOpen(false)
      void refetch()
    } catch {
      toast.error("Erreur lors de l'augmentation")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Augmentation de caution" subtitle="Augmenter la caution (plafond) d'un point de vente" />
      <Card>
        <div className="min-h-[420px]">
          <DataTable<Row>
            loading={loading}
            rows={rows as unknown as Row[]}
            searchable
            emptyMessage="Aucun PDV"
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'raisonSociale', label: 'PDV' },
              { key: 'secteur', label: 'Secteur', render: (_v, row) => (row as unknown as PdvRow).secteur?.nom ?? '—' },
              { key: 'caution', label: 'Caution actuelle', align: 'right', render: (v) => formatFCFA(Number(v ?? 0)) },
              ...(canMutate
                ? [{
                    key: 'actions',
                    label: '',
                    render: (_v: unknown, row: Row) => (
                      <Button variant="secondary" onClick={() => openModal(row as unknown as PdvRow)}>Augmenter</Button>
                    ),
                  }]
                : []),
            ]}
          />
        </div>
      </Card>
      <Modal isOpen={open} onClose={() => !submitting && setOpen(false)} title={`Augmenter la caution — ${target?.raisonSociale ?? ''}`}>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-app-muted">Caution actuelle : <strong>{target ? formatFCFA(target.caution) : '—'}</strong></p>
          <div>
            <FieldLabel>Montant à ajouter (FCFA)</FieldLabel>
            <input type="number" value={montant === 0 ? '' : montant} onChange={(e) => setMontant(Number(e.target.value) || 0)} className={inputCls} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" variant="primary" loading={submitting}>Confirmer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
