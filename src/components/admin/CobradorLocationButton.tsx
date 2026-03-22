'use client'

import { useState } from 'react'

interface Props {
  routeId: string
  routeName: string
}

export default function CobradorLocationButton({ routeId, routeName }: Props) {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number | null
    updated_at: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheck() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cobrador-location?routeId=${routeId}`)
      const json = await res.json()
      if (!json.data) {
        setError('El cobrador no ha iniciado sesión o tiene el GPS desactivado.')
      } else {
        setLocation(json.data)
      }
    } catch {
      setError('Error al obtener la ubicación.')
    } finally {
      setLoading(false)
    }
  }

  function getTimeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `hace ${diff} segundos`
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} minutos`
    return `hace ${Math.floor(diff / 3600)} horas`
  }

  function openGoogleMaps() {
    if (!location) return
    window.open(`https://maps.google.com?q=${location.latitude},${location.longitude}`, '_blank')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <button
        onClick={handleCheck}
        disabled={loading}
        style={{
          width:'100%', background:'rgba(99,102,241,0.1)',
          border:'1px solid rgba(99,102,241,0.3)', borderRadius:14,
          padding:'14px 16px', color:'var(--info)', fontSize:14,
          fontWeight:700, cursor:loading ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          gap:8, opacity:loading ? 0.7 : 1, transition:'all 0.2s',
        }}
      >
        {loading ? '🔍 Buscando...' : '📍 Ver ubicación del cobrador'}
      </button>

      {error && (
        <div style={{
          background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
          borderRadius:14, padding:'14px 16px', color:'var(--danger)',
          fontSize:13, fontWeight:600,
        }}>
          ❌ {error}
        </div>
      )}

      {location && (
        <div style={{
          background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)',
          borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:12,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700 }}>
              📍 {routeName}
            </p>
            <span style={{
              background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
              borderRadius:99, padding:'2px 8px', color:'var(--success)',
              fontSize:11, fontWeight:700,
            }}>● En línea</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 12px' }}>
              <p style={{ color:'var(--text-muted)', fontSize:10, marginBottom:2 }}>LATITUD</p>
              <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700, fontFamily:'DM Mono' }}>
                {location.latitude.toFixed(6)}
              </p>
            </div>
            <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 12px' }}>
              <p style={{ color:'var(--text-muted)', fontSize:10, marginBottom:2 }}>LONGITUD</p>
              <p style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700, fontFamily:'DM Mono' }}>
                {location.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {location.accuracy && (
            <p style={{ color:'var(--text-muted)', fontSize:12, textAlign:'center' }}>
              🎯 Precisión: ±{location.accuracy}m
            </p>
          )}

          <p style={{ color:'var(--text-muted)', fontSize:12, textAlign:'center' }}>
            🕐 Actualizado {getTimeAgo(location.updated_at)}
          </p>

          <button
            onClick={openGoogleMaps}
            style={{
              width:'100%', background:'var(--gradient-primary)',
              border:'none', borderRadius:14, padding:'14px 0',
              color:'white', fontSize:14, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}
          >
            🗺️ Abrir en Google Maps
          </button>
        </div>
      )}
    </div>
  )
}
