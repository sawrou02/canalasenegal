import { Button } from '../ui/Button'
import { BrandStar } from '../ui/BrandStar'
import { formatFCFA, formatDate, cn } from '../../lib/utils'
import type { Encaissement } from '../../lib/api'

const MODE_LABELS: Record<string, string> = {
  ESPECE: 'Espèce',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  CHEQUE: 'Chèque',
  VIREMENT: 'Virement',
}

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  encaissement: Encaissement | null
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-app-muted" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="font-medium text-app-text text-right" style={{ color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  )
}

export function ReceiptModal({ isOpen, onClose, encaissement }: ReceiptModalProps) {
  if (!isOpen || !encaissement) return null

  const e = encaissement
  const monnaie = e.monnaieRendue

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div id="receipt-print" className="p-6">
          {/* Success badge */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mb-3">
              <span className="text-primary-dark text-3xl font-bold leading-none">✓</span>
            </div>
            <div className="flex items-center gap-2">
              <BrandStar size={28} />
              <span className="font-black text-lg tracking-wide text-app-text">SENDISTRI</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-app-text">
              Reçu N° {e.recuNumero}
            </p>
          </div>

          {/* Detail lines */}
          <div className="space-y-2">
            <DetailLine label="PDV" value={e.pdv.raisonSociale} />
            <DetailLine
              label="Client"
              value={`${e.abonne.prenom} ${e.abonne.nom} (${e.abonne.numAbonne})`}
            />
            <DetailLine
              label="Formule"
              value={`${e.formule.code} — ${e.formule.nomCommercial}`}
            />
            <DetailLine label="Mode de paiement" value={MODE_LABELS[e.modePaiement] ?? e.modePaiement} />
            <DetailLine label="Nombre de mois" value={String(e.nbMois)} />
            <DetailLine label="Date" value={formatDate(e.date)} />
          </div>

          {/* Dashed divider */}
          <div className="my-4 border-t border-dashed border-app-border" />

          {/* Amounts */}
          <div className="space-y-2">
            <DetailLine label="Montant total" value={formatFCFA(e.montantTotal)} />
            <DetailLine label="Montant reçu" value={formatFCFA(e.montantRecu)} />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-app-text">Monnaie rendue</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  monnaie >= 0 ? 'text-primary' : 'text-danger',
                )}
              >
                {formatFCFA(monnaie)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-app-border">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            Imprimer le reçu
          </Button>
        </div>
      </div>
    </div>
  )
}
