'use client'

import { useEffect, useRef, useState } from 'react'
import { updateCobradorLocation } from '@/modules/cobrador/location-actions'

interface GpsGuardProps {
  children: React.ReactNode
}

// Opciones de máxima precisión para uso en campo
const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,  // Fuerza GPS real, no WiFi/torre celular
  timeout: 15000,            // Espera hasta 15 seg para obtener señal
  maximumAge: 10000,         // Acepta posición cacheada de máximo 10 seg
}

const UPDATE_INTERVAL = 30000      // Enviar a Supabase cada 30 seg
const ACCURACY_THRESHOLD = 50      // Rechazar lecturas con error > 50 metros
const MAX_RETRIES = 3              // Reintentos si falla la precisión

export default function GpsGuard({ children }: GpsGuardProps) {
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'granted' | 'denied'>('checking')
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const retriesRef = useRef(0)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied')
      return
    }

    requestLocation()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function requestLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePosition(pos, true),
      (err) => handleError(err),
      GPS_OPTIONS
    )
  }

  function handlePosition(pos: GeolocationPosition, isInitial = false) {
    const { latitude, longitude, accuracy: acc } = pos.coords

    // Si la precisión es muy mala, reintentar hasta MAX_RETRIES
    if (acc > ACCURACY_THRESHOLD && retriesRef.current < MAX_RETRIES) {
      retriesRef.current++
      setTimeout(requestLocation, 2000)
      return
    }

    retriesRef.current = 0
    setAccuracy(Math.round(acc))
    setGpsStatus('granted')
    sendLocation(latitude, longitude, acc)

    if (isInitial) startTracking()
  }

  function handleError(err: GeolocationPositionError) {
    // PERMISSION_DENIED = 1, POSITION_UNAVAILABLE = 2, TIMEOUT = 3
    if (err.code === 1) {
      setGpsStatus('denied')
    } else {
      // Timeout o señal perdida — reintentar
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++
        setTimeout(requestLocation, 3000)
      } else {
        setGpsStatus('denied')
      }
    }
  }

  function startTracking() {
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => handlePosition(pos),
        (err) => {
          // GPS se apagó durante la sesión — bloquear inmediatamente
          if (err.code === 1 || err.code === 2) {
            setGpsStatus('denied')
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
        },
        GPS_OPTIONS
      )
    }, UPDATE_INTERVAL)
  }

  async function sendLocation(lat: number, lng: number, acc: number) {
    // Solo enviar si la precisión es aceptable
    if (acc <= ACCURACY_THRESHOLD * 2) {
      await updateCobradorLocation(lat, lng)
    }
  }

  if (gpsStatus === 'denied') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 40,
          margin: '0 auto 24px',
        }}>
          📍
        </div>
        <h2 style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 22,
          color: 'var(--text-primary)', marginBottom: 12,
        }}>
          GPS requerido
        </h2>
        <p style={{
          color: 'var(--text-muted)', fontSize: 15,
          lineHeight: 1.7, maxWidth: 300, marginBottom: 12,
        }}>
          Para usar la aplicación debes tener el GPS activado y otorgar permiso de ubicación.
        </p>
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, padding: '10px 16px',
          marginBottom: 32, maxWidth: 300,
        }}>
          <p style={{ color: 'var(--warning)', fontSize: 13, lineHeight: 1.6 }}>
            💡 Activa el GPS en Configuración → Ubicación → Alta precisión
          </p>
        </div>
        <button
          onClick={() => { retriesRef.current = 0; setGpsStatus('checking'); requestLocation() }}
          style={{
            background: 'var(--gradient-primary)',
            border: 'none', borderRadius: 16,
            padding: '16px 32px',
            color: 'white', fontSize: 15,
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          🔄 Intentar de nuevo
        </button>
      </div>
    )
  }

  if (gpsStatus === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>📍</div>
        <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
          Obteniendo ubicación...
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Buscando señal GPS de alta precisión
        </p>
        {retriesRef.current > 0 && (
          <p style={{ color: 'var(--warning)', fontSize: 12 }}>
            Intento {retriesRef.current} de {MAX_RETRIES}...
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Indicador de precisión GPS — visible para el cobrador */}
      {accuracy !== null && accuracy > 30 && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(245,158,11,0.95)',
          borderRadius: 99, padding: '6px 14px',
          zIndex: 999, whiteSpace: 'nowrap',
        }}>
          <p style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>
            ⚠️ GPS impreciso: ±{accuracy}m
          </p>
        </div>
      )}
      {children}
    </>
  )
}
