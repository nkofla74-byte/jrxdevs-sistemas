'use client'

import { useState } from 'react'
import { injectCapital, withdrawCapital, transferCapital } from '@/modules/capital/actions'
import { useRouter } from 'next/navigation'

type RouteOption = {
  id: string
  name: string
  capital_injected: number
}

type OperationType = 'INJECTION' | 'WITHDRAWAL' | 'TRANSFER'

export default function CapitalForm({ routes }: { routes: RouteOption[] }) {
  const [operation, setOperation] = useState<OperationType>('INJECTION')
  const [routeId, setRouteId] = useState('')
  const [destRouteId, setDestRouteId] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!routeId) { setError('Selecciona una ruta.'); return }
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Ingresa un monto válido.'); return }
    if (operation === 'TRANSFER' && !destRouteId) { setError('Selecciona la ruta destino.'); return }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = {
      route_id: routeId,
      amount: numAmount,
      type: operation,
      notes: notes || undefined,
      destination_route_id: destRouteId || undefined,
    }

    let result
    if (operation === 'INJECTION') result = await injectCapital(formData)
    else if (operation === 'WITHDRAWAL') result = await withdrawCapital(formData)
    else result = await transferCapital(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      const messages = {
        INJECTION: '✅ Capital inyectado correctamente',
        WITHDRAWAL: '✅ Capital retirado correctamente',
        TRANSFER: '✅ Transferencia realizada correctamente',
      }
      setSuccess(messages[operation])
      setAmount('')
      setNotes('')
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Nueva operación</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Tipo de operación */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {([
          { type: 'INJECTION', label: '💰 Inyectar', color: 'peer-checked:border-green-500 peer-checked:bg-green-500/10' },
          { type: 'WITHDRAWAL', label: '💸 Retirar', color: 'peer-checked:border-red-500 peer-checked:bg-red-500/10' },
          { type: 'TRANSFER', label: '↔️ Transferir', color: 'peer-checked:border-blue-500 peer-checked:bg-blue-500/10' },
        ] as const).map((op) => (
          <label key={op.type} className="cursor-pointer">
            <input
              type="radio"
              name="operation"
              value={op.type}
              checked={operation === op.type}
              onChange={() => setOperation(op.type)}
              className="sr-only peer"
            />
            <div className={`border border-gray-700 rounded-xl p-3 text-center text-xs font-semibold transition ${op.color}`}>
              {op.label}
            </div>
          </label>
        ))}
      </div>

      {/* Ruta origen */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          {operation === 'TRANSFER' ? 'Ruta origen' : 'Ruta'}
        </label>
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="">Seleccionar ruta</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {Number(r.capital_injected).toLocaleString()} disponible
            </option>
          ))}
        </select>
      </div>

      {/* Ruta destino (solo transferencia) */}
      {operation === 'TRANSFER' && (
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-1.5">
            Ruta destino
          </label>
          <select
            value={destRouteId}
            onChange={(e) => setDestRouteId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Seleccionar ruta destino</option>
            {routes.filter((r) => r.id !== routeId).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {Number(r.capital_injected).toLocaleString()} disponible
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Monto */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Monto
        </label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Notas */}
      <div className="mb-5">
        <label className="block text-gray-300 text-sm font-medium mb-1.5">
          Notas (opcional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Motivo del movimiento"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full font-bold py-3 rounded-xl transition text-sm ${
          operation === 'INJECTION'
            ? 'bg-green-600 hover:bg-green-500'
            : operation === 'WITHDRAWAL'
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-blue-600 hover:bg-blue-500'
        } disabled:bg-gray-700 disabled:cursor-not-allowed text-white`}
      >
        {isLoading ? 'Procesando...' : (
          operation === 'INJECTION' ? '💰 Inyectar capital'
          : operation === 'WITHDRAWAL' ? '💸 Retirar capital'
          : '↔️ Transferir capital'
        )}
      </button>
    </div>
  )
}