import { useParams } from 'react-router-dom'

export default function GenericTablePage() {
  const { pageId } = useParams<{ pageId: string }>()

  const title = pageId
    ? pageId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Page'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-app-text" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
      </div>

      <div
        className="bg-white rounded-xl border border-app-border p-5 shadow-sm flex items-center justify-center text-center min-h-[20rem]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-sm">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
              <path d="M9 4v16" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-app-text" style={{ color: 'var(--text)' }}>
            {title}
          </h3>
          <p className="text-sm text-app-muted mt-1" style={{ color: 'var(--text-muted)' }}>
            Module en cours de préparation — aucune donnée à afficher.
          </p>
        </div>
      </div>
    </div>
  )
}
