'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GastoModal from './GastoModal'
import TotalizarModal from './TotalizarModal'
import ThemeToggle from '@/components/shared/ThemeToggle'

const creditStatusEmoji: Record<string, string> = {
  ACTIVE: '🟢', CURRENT: '🟢', WATCH: '🟡',
  WARNING: '🟠', CRITICAL: '🔴',
}

const frequencyLabel: Record<string, string> = {
  DAILY: 'diaria', WEEKLY: 'semanal', MONTHLY: 'mensual',
}

export default function CobradorDashboard({ data }: { data: any }) {
  const [showGastos, setShowGastos] = useState(false)
  const [showTotalizar, setShowTotalizar] = useState(false)
  const [gpsActive, setGpsActive] = useState(false)
  const [gpsChecked, setGpsChecked] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  const {
    route, clients, totalClients, clientsPaidToday,
    collectedToday, totalInStreet, dailyGoal, lentToday, expensesToday,
    pendingToCollect, currency, isWithinSchedule,
    todayPaidClientIds,
  } = data

  useEffect(() => {
    const saved = localStorage.getItem('jrx_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
    navigator.geolocation.getCurrentPosition(
      () => { setGpsActive(true); setGpsChecked(true) },
      () => { setGpsActive(false); setGpsChecked(true) }
    )
  }, [])

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const progressPercent = totalClients > 0
    ? Math.round((clientsPaidToday / totalClients) * 100)
    : 0

  const fmt = (n: number) => Number(n).toLocaleString('es-CO')

  // Calcular saldo pendiente de un crédito
  function getSaldoPendiente(credit: any) {
    const cuotasPendientes = credit.installments - credit.paid_installments
    return cuotasPendientes * Number(credit.installment_amount)
  }

  if (gpsChecked && !gpsActive) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--danger-dim)', border: '2px solid rgba(239,68,68,0.3)' }}>
            <span className="text-5xl">📍</span>
          </div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', marginBottom: 12 }}>
            GPS requerido
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
            Debes activar el GPS de tu dispositivo para poder operar.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Ya activé el GPS — Reintentar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
      }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              {route.name}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 20, color: 'var(--neon-bright)' }}>
                {currentTime}
              </p>
              <p style={{ fontSize: 11, color: gpsActive ? 'var(--success)' : 'var(--danger)' }}>
                {gpsActive ? '📍 GPS activo' : '📍 GPS inactivo'}
              </p>
            </div>
            <ThemeToggle />
            <form action="/api/auth/logout" method="POST">
              <button style={{
                background: 'var(--danger-dim)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '6px 12px',
                color: 'var(--danger)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
              }}>
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Botones superiores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '12px 16px 8px' }}>
          {[
            { icon: '📊', label: 'Informes', href: '/cobrador/informes' },
            { icon: '🗺️', label: 'Enrutar', href: '/cobrador/enrutar' },
            { icon: '💸', label: 'Gastos', action: () => setShowGastos(true) },
            { icon: '🧾', label: 'Totalizar', action: () => setShowTotalizar(true) },
          ].map((btn) => (
            btn.href ? (
              <Link key={btn.label} href={btn.href} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '12px 8px', textAlign: 'center',
                textDecoration: 'none', transition: 'all 0.2s', display: 'block',
              }}>
                <p style={{ fontSize: 22, marginBottom: 4 }}>{btn.icon}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>{btn.label}</p>
              </Link>
            ) : (
              <button key={btn.label} onClick={btn.action} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '12px 8px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <p style={{ fontSize: 22, marginBottom: 4 }}>{btn.icon}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>{btn.label}</p>
              </button>
            )
          ))}
        </div>

        {/* Panel financiero */}
        <div style={{
          margin: '0 16px 12px', background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 24, padding: 16,
        }}>
          {!isWithinSchedule && (
            <div style={{
              background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 14, padding: '10px 14px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⏰</span>
              <p style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 500 }}>
                Fuera del horario — modo solo lectura
              </p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "12px 14px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>📥 Cobrado hoy</p>
                <p style={{ fontFamily: "DM Mono", fontWeight: 800, fontSize: 20, color: "var(--success)", lineHeight: 1 }}>{fmt(collectedToday)}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{currency}</p>
              </div>
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: "12px 14px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>📊 Por cobrar</p>
                <p style={{ fontFamily: "DM Mono", fontWeight: 800, fontSize: 20, color: "var(--warning)", lineHeight: 1 }}>{fmt(pendingToCollect > 0 ? pendingToCollect : 0)}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{currency}</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "12px 14px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>💳 Prestado hoy</p>
                <p style={{ fontFamily: "DM Mono", fontWeight: 800, fontSize: 20, color: "var(--info)", lineHeight: 1 }}>{fmt(lentToday ?? 0)}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{currency}</p>
              </div>
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "12px 14px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>💸 Gastos hoy</p>
                <p style={{ fontFamily: "DM Mono", fontWeight: 800, fontSize: 20, color: "var(--danger)", lineHeight: 1 }}>{fmt(expensesToday ?? 0)}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{currency}</p>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Clientes visitados</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>
                {clientsPaidToday}/{totalClients} ({progressPercent}%)
              </p>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: 10, borderRadius: 99, width: `${progressPercent}%`,
                background: progressPercent === 100
                  ? 'linear-gradient(90deg, #059669, #10b981)'
                  : 'var(--gradient-primary)',
                boxShadow: progressPercent > 0 ? '0 0 10px var(--neon-glow)' : 'none',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div className="flex justify-between" style={{ marginTop: 6 }}>
              <p style={{ color: 'var(--success)', fontSize: 11 }}>✓ {clientsPaidToday} pagados</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{totalClients - clientsPaidToday} pendientes</p>
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        <div style={{ padding: '0 16px 100px' }}>
          <p style={{
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Clientes de hoy
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clients.map((client: any) => {
              const activeCredit = client.credits?.find((c: any) =>
                ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
              )
              const paid = todayPaidClientIds.includes(client.id)
              const saldoPendiente = activeCredit ? getSaldoPendiente(activeCredit) : 0
              const cuotasPagadas = activeCredit?.paid_installments ?? 0
              const cuotasTotal = activeCredit?.installments ?? 0
              const cuotasPendientes = cuotasTotal - cuotasPagadas
              const porcentajePagado = cuotasTotal > 0
                ? Math.round((cuotasPagadas / cuotasTotal) * 100)
                : 0

              return (
                <Link key={client.id} href={`/cobrador/cliente/${client.id}`}
                  style={{
                    display: 'block',
                    background: paid ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${paid ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                    borderRadius: 18, padding: '14px 16px',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}
                >
                  {/* Fila superior: número + nombre + semáforo + estado pago */}
                  <div className="flex items-center justify-between" style={{ marginBottom: activeCredit ? 10 : 0 }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                        background: paid ? 'rgba(16,185,129,0.2)' : 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                        color: paid ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {client.visit_order}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p style={{
                            fontWeight: 600, fontSize: 14,
                            color: paid ? 'var(--success)' : 'var(--text-primary)',
                          }}>
                            {client.full_name}
                          </p>
                          {activeCredit && (
                            <span style={{ fontSize: 13 }}>
                              {creditStatusEmoji[activeCredit.status]}
                            </span>
                          )}
                        </div>
                        {activeCredit && (
                          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            Cuota {frequencyLabel[activeCredit.frequency] ?? ''}: {' '}
                            <span style={{ color: 'var(--neon-bright)', fontFamily: 'DM Mono', fontWeight: 700 }}>
                              {fmt(Number(activeCredit.installment_amount))} {currency}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {paid ? (
                        <span style={{
                          background: 'rgba(16,185,129,0.15)', color: 'var(--success)',
                          fontSize: 11, fontWeight: 700, padding: '3px 10px',
                          borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)',
                        }}>
                          ✓ Pagado
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
                      )}
                    </div>
                  </div>

                  {/* Fila inferior: cuotas + saldo — solo si tiene crédito activo */}
                  {activeCredit && (
                    <div style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 12, padding: '10px 12px',
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 8,
                    }}>
                      {/* Cuotas pagadas */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>
                          PAGADAS
                        </p>
                        <p style={{
                          fontFamily: 'DM Mono', fontWeight: 700, fontSize: 15,
                          color: 'var(--success)',
                        }}>
                          {cuotasPagadas}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 9 }}>cuotas</p>
                      </div>

                      {/* Cuotas pendientes */}
                      <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>
                          DEBEN
                        </p>
                        <p style={{
                          fontFamily: 'DM Mono', fontWeight: 700, fontSize: 15,
                          color: cuotasPendientes > 0 ? 'var(--warning)' : 'var(--success)',
                        }}>
                          {cuotasPendientes}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 9 }}>cuotas</p>
                      </div>

                      {/* Saldo pendiente */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>
                          SALDO
                        </p>
                        <p style={{
                          fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13,
                          color: saldoPendiente > 0 ? 'var(--danger)' : 'var(--success)',
                        }}>
                          {fmt(saldoPendiente)}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 9 }}>{currency}</p>
                      </div>
                    </div>
                  )}

                  {/* Mini barra de progreso del crédito */}
                  {activeCredit && cuotasTotal > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 99, height: 4, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: 4, borderRadius: 99,
                          width: `${porcentajePagado}%`,
                          background: porcentajePagado === 100
                            ? 'var(--success)'
                            : porcentajePagado > 60
                            ? 'var(--neon-primary)'
                            : porcentajePagado > 30
                            ? 'var(--warning)'
                            : 'var(--danger)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 3, textAlign: 'right' }}>
                        {porcentajePagado}% del crédito pagado
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}

            {clients.length === 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: 40, textAlign: 'center',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎉</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay clientes activos.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div style={{
        background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        position: 'sticky', bottom: 0,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { icon: '📋', label: 'Listado', href: '/cobrador/listado' },
            { icon: '👤', label: 'Cliente', href: '/cobrador/nuevo-cliente' },
            { icon: '🔍', label: 'Consultas', href: '/cobrador/consultas' },
            { icon: '📦', label: 'Cierre', href: '/cobrador/cierre' },
          ].map((btn) => (
            <Link key={btn.label} href={btn.href} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '10px 6px', textAlign: 'center',
              textDecoration: 'none', display: 'block', transition: 'all 0.2s',
            }}>
              <p style={{ fontSize: 20, marginBottom: 2 }}>{btn.icon}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}>{btn.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {showGastos && <GastoModal routeId={route.id} onClose={() => setShowGastos(false)} />}
      {showTotalizar && <TotalizarModal data={data} onClose={() => setShowTotalizar(false)} />}
    </main>
  )
}
