'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const creditStatusEmoji: Record<string, string> = {
  ACTIVE: '🟢', CURRENT: '🟢', WATCH: '🟡',
  WARNING: '🟠', CRITICAL: '🔴',
}

export default function EnrutarClient({
  clients,
  paidClientIds,
  routeId,
}: {
  clients: any[]
  paidClientIds: string[]
  routeId: string
}) {
  const [orderedClients, setOrderedClients] = useState(clients)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const router = useRouter()
  const paidSet = new Set(paidClientIds)
  const hasChanges = JSON.stringify(orderedClients.map(c => c.id)) !== JSON.stringify(clients.map(c => c.id))

  function moveUp(index: number) {
    if (index === 0) return
    const newList = [...orderedClients]
    ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    setOrderedClients(newList)
    setSaved(false)
  }

  function moveDown(index: number) {
    if (index === orderedClients.length - 1) return
    const newList = [...orderedClients]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    setOrderedClients(newList)
    setSaved(false)
  }

  function moveToPosition(clientId: string, newPosition: number) {
    const total = orderedClients.length
    if (newPosition < 1 || newPosition > total) return
    const currentIndex = orderedClients.findIndex(c => c.id === clientId)
    if (currentIndex === -1) return
    const newList = [...orderedClients]
    const [removed] = newList.splice(currentIndex, 1)
    newList.splice(newPosition - 1, 0, removed)
    setOrderedClients(newList)
    setSaved(false)
    setEditingId(null)
    setInputValue('')
  }

  async function saveOrder() {
    setIsSaving(true)
    const supabase = createClient()
    for (let i = 0; i < orderedClients.length; i++) {
      await supabase
        .from('clients')
        .update({ visit_order: i + 1 })
        .eq('id', orderedClients[i].id)
    }
    setSaved(true)
    setIsSaving(false)
    router.refresh()
  }

  return (
    <div style={{ padding: '16px 16px 100px', background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Header info + botón guardar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {orderedClients.length} clientes
        </p>
        <button
          onClick={saveOrder}
          disabled={isSaving || saved || !hasChanges}
          style={{
            background: saved
              ? 'rgba(16,185,129,0.15)'
              : hasChanges
              ? 'var(--gradient-primary)'
              : 'var(--bg-card)',
            border: saved
              ? '1px solid rgba(16,185,129,0.3)'
              : hasChanges
              ? 'none'
              : '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 20px',
            color: saved ? 'var(--success)' : hasChanges ? 'white' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 700,
            cursor: isSaving || saved || !hasChanges ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isSaving ? '💾 Guardando...' : saved ? '✅ Guardado' : '💾 Guardar orden'}
        </button>
      </div>

      {/* Aviso si hay cambios sin guardar */}
      {hasChanges && !saved && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, padding: '10px 14px',
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <p style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 600 }}>
            Tienes cambios sin guardar
          </p>
        </div>
      )}

      {/* Lista de clientes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orderedClients.map((client, index) => {
          const paid = paidSet.has(client.id)
          const activeCredit = client.credits?.find((c: any) =>
            ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
          )
          const isEditing = editingId === client.id

          return (
            <div key={client.id} style={{
              background: paid ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
              border: `1px solid ${paid ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
              borderRadius: 18,
              overflow: 'hidden',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>

                {/* Flechas arriba/abajo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: index === 0 ? 'var(--bg-secondary)' : 'rgba(139,92,246,0.15)',
                      border: `1px solid ${index === 0 ? 'var(--border)' : 'rgba(139,92,246,0.3)'}`,
                      color: index === 0 ? 'var(--text-muted)' : 'var(--neon-bright)',
                      fontSize: 14, cursor: index === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: index === 0 ? 0.3 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === orderedClients.length - 1}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: index === orderedClients.length - 1 ? 'var(--bg-secondary)' : 'rgba(139,92,246,0.15)',
                      border: `1px solid ${index === orderedClients.length - 1 ? 'var(--border)' : 'rgba(139,92,246,0.3)'}`,
                      color: index === orderedClients.length - 1 ? 'var(--text-muted)' : 'var(--neon-bright)',
                      fontSize: 14, cursor: index === orderedClients.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: index === orderedClients.length - 1 ? 0.3 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    ↓
                  </button>
                </div>

                {/* Número de posición — click para editar */}
                <button
                  onClick={() => {
                    setEditingId(isEditing ? null : client.id)
                    setInputValue(String(index + 1))
                  }}
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isEditing
                      ? 'rgba(139,92,246,0.3)'
                      : paid ? 'rgba(16,185,129,0.2)' : 'var(--bg-secondary)',
                    border: isEditing
                      ? '1px solid rgba(139,92,246,0.6)'
                      : paid ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
                    color: paid ? 'var(--success)' : 'var(--neon-bright)',
                    fontFamily: 'DM Mono', fontWeight: 800, fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Toca para mover a posición específica"
                >
                  {index + 1}
                </button>

                {/* Info del cliente */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{
                      fontWeight: 600, fontSize: 14,
                      color: paid ? 'var(--success)' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {client.full_name}
                    </p>
                    {activeCredit && (
                      <span style={{ fontSize: 12, flexShrink: 0 }}>
                        {creditStatusEmoji[activeCredit.status]}
                      </span>
                    )}
                    {paid && (
                      <span style={{
                        background: 'rgba(16,185,129,0.15)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 99, padding: '1px 7px',
                        color: 'var(--success)', fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>✓</span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {client.address}
                  </p>
                </div>

                {/* Botones ver / mapa */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <Link href={`/cobrador/cliente/${client.id}`} style={{
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 8, padding: '4px 10px',
                    color: 'var(--info)', fontSize: 11, fontWeight: 700,
                    textDecoration: 'none', textAlign: 'center',
                  }}>
                    Ver
                  </Link>
                  {client.latitude && client.longitude && (
                    <a href={`https://maps.google.com?q=${client.latitude},${client.longitude}`} target="_blank" style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, padding: '4px 10px',
                      color: 'var(--text-muted)', fontSize: 11,
                      textDecoration: 'none', textAlign: 'center',
                    }}>
                      📍
                    </a>
                  )}
                </div>
              </div>

              {/* Input de posición manual — aparece al tocar el número */}
              {isEditing && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '12px 14px',
                  background: 'rgba(139,92,246,0.05)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>
                    Mover a posición:
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={orderedClients.length}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    style={{
                      width: 70, background: 'var(--bg-secondary)',
                      border: '1px solid rgba(139,92,246,0.4)',
                      borderRadius: 8, padding: '6px 10px',
                      color: 'var(--text-primary)', fontSize: 14,
                      fontFamily: 'DM Mono', fontWeight: 700,
                      textAlign: 'center',
                    }}
                  />
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    de {orderedClients.length}
                  </p>
                  <button
                    onClick={() => moveToPosition(client.id, parseInt(inputValue))}
                    disabled={!inputValue || parseInt(inputValue) < 1 || parseInt(inputValue) > orderedClients.length}
                    style={{
                      background: 'var(--gradient-primary)',
                      border: 'none', borderRadius: 8,
                      padding: '6px 14px',
                      color: 'white', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', marginLeft: 'auto',
                    }}
                  >
                    Mover
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setInputValue('') }}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, padding: '6px 10px',
                      color: 'var(--text-muted)', fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {orderedClients.length === 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 40, textAlign: 'center', marginTop: 20,
        }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>🗺️</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay clientes activos en esta ruta.</p>
        </div>
      )}
    </div>
  )
}
