'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GastoModal from './GastoModal'
import TotalizarModal from './TotalizarModal'

const creditStatusEmoji: Record<string, string> = {
  ACTIVE: '🟢',
  CURRENT: '🟢',
  WATCH: '🟡',
  WARNING: '🟠',
  CRITICAL: '🔴',
}

export default function CobradorDashboard({ data }: { data: any }) {
  const [showGastos, setShowGastos] = useState(false)
  const [showTotalizar, setShowTotalizar] = useState(false)
  const [gpsActive, setGpsActive] = useState(false)
  const [gpsChecked, setGpsChecked] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  const {
    route, clients, totalClients, clientsPaidToday,
    collectedToday, totalInStreet, dailyGoal,
    pendingToCollect, currency, isWithinSchedule,
    todayPaidClientIds,
  } = data

  // Verificar GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      () => { setGpsActive(true); setGpsChecked(true) },
      () => { setGpsActive(false); setGpsChecked(true) }
    )
  }, [])

  // Reloj en tiempo real
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit'
      }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const progressPercent = totalClients > 0
    ? Math.round((clientsPaidToday / totalClients) * 100)
    : 0

  const fmt = (n: number) => Number(n).toLocaleString('es-CO')

  // Pantalla de bloqueo GPS
  if (gpsChecked && !gpsActive) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-3xl bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">📍</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">GPS requerido</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Debes activar el GPS de tu dispositivo para poder operar. Es obligatorio por seguridad.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition text-base"
          >
            Ya activé el GPS — Reintentar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base">{route.name}</p>
            <p className="text-gray-400 text-xs">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-mono font-bold text-lg">{currentTime}</p>
            <p className={`text-xs ${gpsActive ? 'text-green-400' : 'text-red-400'}`}>
              {gpsActive ? '📍 GPS activo' : '📍 GPS inactivo'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Botones superiores */}
        <div className="grid grid-cols-4 gap-2 px-4 pt-4 pb-2">
          {[
            { icon: '📊', label: 'Informes', href: '/cobrador/informes' },
            { icon: '🗺️', label: 'Enrutar', href: '/cobrador/enrutar' },
            { icon: '💸', label: 'Gastos', action: () => setShowGastos(true) },
            { icon: '🧾', label: 'Totalizar', action: () => setShowTotalizar(true) },
          ].map((btn) => (
            btn.href ? (
              <Link
                key={btn.label}
                href={btn.href}
                className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-3 text-center transition active:scale-95"
              >
                <p className="text-2xl mb-1">{btn.icon}</p>
                <p className="text-gray-300 text-xs font-medium">{btn.label}</p>
              </Link>
            ) : (
              <button
                key={btn.label}
                onClick={btn.action}
                className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-3 text-center transition active:scale-95"
              >
                <p className="text-2xl mb-1">{btn.icon}</p>
                <p className="text-gray-300 text-xs font-medium">{btn.label}</p>
              </button>
            )
          ))}
        </div>

        {/* Panel financiero */}
        <div className="mx-4 bg-gray-900 rounded-3xl border border-gray-800 p-4 mb-3">

          {/* Alerta fuera de horario */}
          {!isWithinSchedule && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 mb-3 flex items-center gap-2">
              <span>⏰</span>
              <p className="text-yellow-400 text-xs font-medium">Fuera del horario de operación — modo solo lectura</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-500 text-xs mb-1">💰 Prestado</p>
              <p className="text-white font-bold text-lg leading-tight">{fmt(totalInStreet)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-500 text-xs mb-1">📥 Cobrado</p>
              <p className="text-green-400 font-bold text-lg leading-tight">{fmt(collectedToday)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-500 text-xs mb-1">📊 Por cobrar</p>
              <p className="text-yellow-400 font-bold text-lg leading-tight">{fmt(pendingToCollect > 0 ? pendingToCollect : 0)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-gray-500 text-xs mb-1">🎯 Meta del día</p>
              <p className="text-indigo-400 font-bold text-lg leading-tight">{fmt(dailyGoal)}</p>
              <p className="text-gray-600 text-xs">{currency}</p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs">Clientes visitados</p>
              <p className="text-white text-xs font-semibold">
                {clientsPaidToday}/{totalClients} ({progressPercent}%)
              </p>
            </div>
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: progressPercent === 100
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-gray-600 text-xs">Pagados: {clientsPaidToday}</p>
              <p className="text-gray-600 text-xs">Pendientes: {totalClients - clientsPaidToday}</p>
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="px-4 mb-3">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
            Clientes de hoy
          </p>
          <div className="space-y-2">
            {clients.map((client: any) => {
              const activeCredit = client.credits?.find((c: any) =>
                ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
              )
              const paid = todayPaidClientIds.includes(client.id)

              return (
                <Link
                  key={client.id}
                  href={`/cobrador/cliente/${client.id}`}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 transition active:scale-98 ${
                    paid
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-gray-900 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      paid ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {client.visit_order}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${paid ? 'text-green-400' : 'text-white'}`}>
                        {client.full_name}
                      </p>
                      {activeCredit && (
                        <p className="text-gray-500 text-xs">
                          {creditStatusEmoji[activeCredit.status]} Cuota: {Number(activeCredit.installment_amount).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {paid && <span className="text-green-400 text-xs font-semibold">✓ Pagado</span>}
                    <span className="text-gray-600 text-xs">→</span>
                  </div>
                </Link>
              )
            })}

            {clients.length === 0 && (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-gray-400 text-sm">No hay clientes activos en esta ruta.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Botones inferiores — barra fija */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 safe-bottom">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '📋', label: 'Listado', href: '/cobrador/listado' },
            { icon: '👤', label: 'Nuevo cliente', href: '/cobrador/nuevo-cliente' },
            { icon: '💳', label: 'Nuevo crédito', href: '/cobrador/nuevo-credito' },
            { icon: '🔍', label: 'Consultas', href: '/cobrador/consultas' },
            { icon: '📦', label: 'Cierre', href: '/cobrador/cierre' },
          ].map((btn) => (
            <Link
              key={btn.label}
              href={btn.href}
              className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-3 text-center transition active:scale-95 block"
            >
              <p className="text-xl mb-1">{btn.icon}</p>
              <p className="text-gray-300 text-xs font-medium leading-tight">{btn.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Modales */}
      {showGastos && (
        <GastoModal
          routeId={route.id}
          onClose={() => setShowGastos(false)}
        />
      )}

      {showTotalizar && (
        <TotalizarModal
          data={data}
          onClose={() => setShowTotalizar(false)}
        />
      )}

    </main>
  )
}