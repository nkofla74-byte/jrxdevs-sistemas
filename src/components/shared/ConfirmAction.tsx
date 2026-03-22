'use client'

import { useState } from 'react'

export default function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  confirmColor = 'danger',
  onConfirm,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  confirmColor?: 'danger' | 'warning' | 'success'
  onConfirm: () => Promise<void>
}) {
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const colors = {
    danger: {
      bg: 'var(--danger-dim)',
      border: 'rgba(239,68,68,0.3)',
      btn: '#dc2626',
      text: 'var(--danger)',
    },
    warning: {
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.3)',
      btn: '#d97706',
      text: 'var(--warning)',
    },
    success: {
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.3)',
      btn: '#059669',
      text: 'var(--success)',
    },
  }

  const c = colors[confirmColor]

  async function handleConfirm() {
    setIsLoading(true)
    await onConfirm()
    setIsLoading(false)
    setShow(false)
  }

  return (
    <>
      <div onClick={() => setShow(true)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShow(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${c.border}`,
              borderRadius: 24,
              padding: 24,
              maxWidth: 360,
              width: '100%',
              boxShadow: `0 0 40px ${c.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            {/* Icono */}
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: c.bg, border: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28,
              margin: '0 auto 16px',
            }}>
              {confirmColor === 'danger' ? '⚠️' : confirmColor === 'warning' ? '❄️' : '✅'}
            </div>

            {/* Título */}
            <h3 style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 18,
              color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8,
            }}>
              {title}
            </h3>

            {/* Descripción */}
            <p style={{
              color: 'var(--text-muted)', fontSize: 14,
              textAlign: 'center', lineHeight: 1.6, marginBottom: 24,
            }}>
              {description}
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShow(false)}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 14, padding: '12px 0',
                  color: 'var(--text-muted)', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: c.btn,
                  border: 'none',
                  borderRadius: 14, padding: '12px 0',
                  color: 'white', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: `0 4px 15px ${c.border}`,
                }}
              >
                {isLoading ? 'Procesando...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
