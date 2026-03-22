'use client'

import { useState } from 'react'
import { resetRouteDevice } from '@/modules/routes/actions'
import { useRouter } from 'next/navigation'

export default function ResetDeviceButton({
  routeId,
  routeName,
}: {
  routeId: string
  routeName: string
}) {
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleConfirm() {
    setIsLoading(true)
    const result = await resetRouteDevice(routeId)
    if (result?.success) {
      setSuccess(true)
      setShow(false)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <>
      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12, padding: '10px 14px',
          marginBottom: 8,
        }}>
          <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
            ✅ Dispositivo autorizado — el cobrador puede entrar desde cualquier celular
          </p>
        </div>
      )}

      <button
        onClick={() => setShow(true)}
        style={{
          width: '100%',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 14, padding: '12px 0',
          color: 'var(--warning)', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}
      >
        📱 Autorizar inicio desde nuevo dispositivo
      </button>

      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShow(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 24, padding: 24,
              maxWidth: 360, width: '100%',
              boxShadow: '0 0 40px rgba(245,158,11,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28,
              margin: '0 auto 16px',
            }}>
              📱
            </div>

            <h3 style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 18,
              color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8,
            }}>
              Autorizar nuevo dispositivo
            </h3>

            <p style={{
              color: 'var(--text-muted)', fontSize: 14,
              textAlign: 'center', lineHeight: 1.6, marginBottom: 8,
            }}>
              El cobrador de la ruta <strong style={{ color: 'var(--text-primary)' }}>"{routeName}"</strong> podrá iniciar sesión desde cualquier dispositivo nuevo.
            </p>

            <p style={{
              color: 'var(--warning)', fontSize: 12,
              textAlign: 'center', marginBottom: 24,
              background: 'rgba(245,158,11,0.1)',
              borderRadius: 10, padding: '8px 12px',
            }}>
              ⚠️ Úsalo solo cuando el cobrador cambie de celular o tenga problemas de acceso.
            </p>

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
                  background: '#d97706',
                  border: 'none',
                  borderRadius: 14, padding: '12px 0',
                  color: 'white', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
                }}
              >
                {isLoading ? 'Procesando...' : '📱 Sí, autorizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
