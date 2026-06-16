import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { formatFCFA, formatDate, cn } from '../../lib/utils'
import { getMatching, matcherRapport, type MatchingResult } from '../../lib/api'

const MUTATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMPTABLE']

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('bg-white rounded-xl border border-app-border p-5 shadow-sm', className)}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  )
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function MatchingPage() {
  const toast = useToast()
  const role = useAuthStore((s) => s.user?.role)
  const canMutate = role ? MUTATION_ROLES.includes(role) : false

  const [date, setDate] = useState(todayISO())
  const [result, setResult] = useState<MatchingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShow = async () => {
    if (!date) return
    setLoading(true)
    setError(null)
    try {
      const res = await getMatching(date)
      setResult(res)
    } catch {
      setError('Erreur lors du chargement du matching')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleMatcher = async () => {
    if (!result?.rapportId) return
    setMatching(true)
    try {
      await matcherRapport(result.rapportId)
      toast.success('Rapport marqué comme matché ✓')
      await handleShow()
    } catch {
      toast.error('Erreur lors du matching')
    } finally {
      setMatching(false)
    }
  }

  const ecartsCount = result?.lignes.filter((l) => l.ecart !== 0).length ?? 0
  const alreadyMatched = result?.statutMatching === 'MATCHE'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-app-text" style={{ color: 'var(--text)' }}>
          Matching
        </h2>
        <p className="text-sm text-app-muted mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Rapprochement entre le rapport d'activité et les encaissements
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium text-app-text block mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-app-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="primary" onClick={handleShow} loading={loading}>
            Afficher
          </Button>
        </div>
      </Card>

      {/* Stable result area */}
      <div className="min-h-[320px]">
        {loading ? (
          <Card>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          </Card>
        ) : !result ? (
          <Card>
            <p className="text-center text-app-muted py-12 text-sm">
              Choisissez une date puis cliquez sur « Afficher ».
            </p>
          </Card>
        ) : !result.found ? (
          <Card>
            <p className="text-center text-app-muted py-12 text-sm">
              Aucun rapport importé pour cette date ({formatDate(result.date)}).
            </p>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-app-text" style={{ color: 'var(--text)' }}>
                  Rapprochement du {formatDate(result.date)}
                </h3>
                {ecartsCount > 0 ? (
                  <Badge variant="danger">{ecartsCount} écart(s)</Badge>
                ) : (
                  <Badge variant="success">Aucun écart</Badge>
                )}
              </div>
              {canMutate && (
                <Button
                  variant="primary"
                  onClick={handleMatcher}
                  loading={matching}
                  disabled={alreadyMatched}
                >
                  {alreadyMatched ? 'Déjà matché' : 'Marquer comme matché'}
                </Button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-app-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-app-border">
                    <th className="px-4 py-3 text-left font-semibold text-app-muted uppercase tracking-wider text-xs whitespace-nowrap">
                      Libellé
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-app-muted uppercase tracking-wider text-xs whitespace-nowrap">
                      Rapport
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-app-muted uppercase tracking-wider text-xs whitespace-nowrap">
                      Encaissements
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-app-muted uppercase tracking-wider text-xs whitespace-nowrap">
                      Écart
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {result.lignes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-app-muted">
                        Aucune ligne
                      </td>
                    </tr>
                  ) : (
                    result.lignes.map((l, i) => {
                      const hasEcart = l.ecart !== 0
                      return (
                        <tr
                          key={i}
                          className={cn(hasEcart ? 'bg-red-50' : 'bg-white')}
                        >
                          <td className={cn('px-4 py-3', hasEcart ? 'text-danger-dark font-medium' : 'text-app-text')}>
                            {l.libelle}
                          </td>
                          <td className={cn('px-4 py-3 text-right font-mono', hasEcart ? 'text-danger-dark' : 'text-app-text')}>
                            {formatFCFA(l.rapport)}
                          </td>
                          <td className={cn('px-4 py-3 text-right font-mono', hasEcart ? 'text-danger-dark' : 'text-app-text')}>
                            {formatFCFA(l.encaisse)}
                          </td>
                          <td className={cn('px-4 py-3 text-right font-mono font-semibold', hasEcart ? 'text-danger' : 'text-app-text')}>
                            {formatFCFA(l.ecart)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
