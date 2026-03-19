'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateCashClosing, registerCashClosing } from '@/modules/cash-closing/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CierrePage() {
  const [routeId, setRouteId] = useState<string>('')
  const [closingData, setClosingData] = useState<any>(null)
  const [expenses, setExpenses] = useState<string>('0')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateLabel, setDateLabel] = useState('')
  const router = useRouter()

  const fmt = (n: number) => Number(n).toLocaleString('es-CO')

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString('es-CO'))
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('routes')
        .select('id')
        .eq('cobrador_id', user.id)
        .single()
        .then(async ({ data }) => {
          if (!data) return
          setRouteId(data.id)
          const result = await calculateCashClosing(data.id)
          if (result?.data) setClosingData(result.data)
          setIsCalculating(false)
        })
    })
  }, [])

  async function handleSubmit() {
    if (!routeId || !closingData) return
    setIsLoading(true)
    setError(null)
    const result = await registerCashClosing({
      routeId,
      baseAmount: closingData.baseAmount,
      collectedAmount: closingData.collectedAmount,
      loanedAmount: closingData.loanedAmount,
      expensesAmount: parseFloat(expenses) || 0,
      transfersReceived: closingData.transfersReceived,
      notes,
    })
    if (result?.error) { setError(result.error); setIsLoading(false); return }
    setSuccess(true)
    setIsLoading(false)
  }

  const totalToDeliver = closingData
    ? closingData.collectedAmount - closingData.loanedAmount - (parseFloat(expenses) || 0) + closingData.transfersReceived
    : 0

  if (isCalculating) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Calculando cierre...</p>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Cierre registrado</h1>
          <p className="text-gray-400 text-sm mb-2">Total a entregar</p>
          <p className="text-4xl font-bold text-green-400 mb-6">{fmt(totalToDeliver)}</p>
          <Link href="/cobrador" className="w-full block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition">
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/cobrador" className="text-gray-400 text-sm">← Atras</Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold text-sm">Cierre de caja</span>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4 pb-8">

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
            Resumen del dia — {dateLabel}
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Base entregada</span>
              <span className="text-white font-semibold">{fmt(closingData?.baseAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">+ Cobrado hoy</span>
              <span className="text-green-400 font-semibold">+{fmt(closingData?.collectedAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">- Prestado hoy</span>
              <span className="text-red-400 font-semibold">-{fmt(closingData?.loanedAmount ?? 0)}</span>
            </div>
            {closingData?.transfersReceived > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">+ Transferencias</span>
                <span className="text-blue-400 font-semibold">+{fmt(closingData.transfersReceived)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">- Gastos del dia</span>
              <span className="text-yellow-400 font-semibold">-{fmt(parseFloat(expenses) || 0)}</span>
            </div>
            <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
              <span className="text-white font-bold">Total a entregar</span>
              <span className={`text-2xl font-bold ${totalToDeliver >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(totalToDeliver)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1.5">Gastos del dia</label>
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            min="0"
            placeholder="0"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1.5">Notas (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones del dia..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {closingData?.existingClosing && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <p className="text-yellow-400 text-xs">Ya existe un cierre hoy — al confirmar lo actualizara.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition text-lg"
        >
          {isLoading ? 'Registrando...' : 'Confirmar cierre de caja'}
        </button>

      </div>
    </main>
  )
}
