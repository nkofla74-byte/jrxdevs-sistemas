'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

export default function PageHeader({
  title,
  backHref,
  backLabel = '← Inicio',
  action,
}: {
  title: string
  backHref?: string
  backLabel?: string
  action?: {
    label: string
    href: string
  }
}) {
  const router = useRouter()

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '14px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">

        {/* Izquierda — botón atrás + título */}
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '8px 14px',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {backLabel}
            </Link>
          ) : (
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '8px 14px',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              ← Atrás
            </button>
          )}

          <h1 style={{
            fontFamily: 'Syne',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--text-primary)',
          }}>
            {title}
          </h1>
        </div>

        {/* Derecha — acción + toggle */}
        <div className="flex items-center gap-2">
          {action && (
            <Link
              href={action.href}
              style={{
                background: 'var(--gradient-primary)',
                borderRadius: 12,
                padding: '8px 16px',
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 0 12px var(--neon-glow)',
                whiteSpace: 'nowrap',
              }}
            >
              {action.label}
            </Link>
          )}
          <ThemeToggle />
        </div>

      </div>
    </header>
  )
}