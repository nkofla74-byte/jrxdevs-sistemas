'use client'

import { useState } from 'react'
import { updateOfficeSchedule } from '@/modules/offices/admin-actions'
import { useRouter } from 'next/navigation'

export default function ScheduleForm({
  currentOpenTime,
  currentCloseTime,
}: {
  currentOpenTime: string
  currentCloseTime: string
}) {
  const [openTime, setOpenTime] = useState(currentOpenTime ?? '08:00')
  const [closeTime, setCloseTime] = useState(currentCloseTime ?? '18:00')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSave() {
    if (openTime >= closeTime) {
      setError('El horario de apertura debe ser antes del cierre.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateOfficeSchedule(openTime, closeTime)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {error && (
        <div style={{
          background: 'var(--danger-dim)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <p style={{ color: 'var(--success)', fontSize: 13 }}>
            ✅ Horario actualizado correctamente
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{
            display: 'block', color: 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, marginBottom: 8,
          }}>
            🌅 Apertura
          </label>
          <input
            type="time"
            value={openTime}
            onChange={(e) => { setOpenTime(e.target.value); setSuccess(false) }}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px',
              color: 'var(--text-primary)', fontSize: 16,
              fontFamily: 'DM Mono', fontWeight: 600,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{
            display: 'block', color: 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, marginBottom: 8,
          }}>
            🌙 Cierre
          </label>
          <input
            type="time"
            value={closeTime}
            onChange={(e) => { setCloseTime(e.target.value); setSuccess(false) }}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px',
              color: 'var(--text-primary)', fontSize: 16,
              fontFamily: 'DM Mono', fontWeight: 600,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Vista previa */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12, padding: '12px 14px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Horario de operación
        </span>
        <span style={{
          fontFamily: 'DM Mono', fontWeight: 700,
          fontSize: 15, color: 'var(--neon-bright)',
        }}>
          {openTime} — {closeTime}
        </span>
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading}
        style={{
          width: '100%',
          background: 'var(--gradient-primary)',
          border: 'none',
          borderRadius: 14, padding: '14px 0',
          color: 'white', fontSize: 14,
          fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 15px var(--neon-glow)',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? 'Guardando...' : '💾 Guardar horario'}
      </button>
    </div>
  )
}
