'use client'

import { useState } from 'react'
import { registerPayment } from '@/modules/payments/actions'
import { useRouter } from 'next/navigation'

export default function PaymentForm({
  creditId,
  clientId,
  routeId,
  installmentAmount,
}: {
  creditId: string
  clientId: string
  routeId: string
  installmentAmount: number
}) {
  const [amount, setAmount] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  function handleNumpad(value: string) {
    if (value === 'DEL') {
      setAmount((prev) => prev.slice(0, -1))
    } else if (value === 'OK') {
      handleSubmit()
    } else {
      setAmount((prev) => {
        if (prev.length >= 10) return prev
        return prev + value
      })
    }
  }

  async function handleSubmit() {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Ingresa un monto válido.')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await registerPayment({
      credit_id: creditId,
      client_id: clientId,
      route_id: routeId,
      amount: numAmount,
      notes: notes || undefined,
    })

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setAmount('')
    setNotes('')
    setIsLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Registrar pago</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
          <p className="text-green-400 text-sm">✅ Pago registrado correctamente</p>
        </div>
      )}

      {/* Display del monto */}
      <div className="bg-gray-800 rounded-xl p-4 text-center mb-4">
        <p className="text-gray-400 text-xs mb-1">Monto a pagar</p>
        <p className="text-4xl font-bold text-white font-mono">
          {amount ? Number(amount).toLocaleString() : '0'}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Cuota: {installmentAmount.toLocaleString()}
        </p>
      </div>

      {/* Botones rápidos */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0.5, 1, 2].map((mult) => (
          <button
            key={mult}
            onClick={() => setAmount(String(Math.round(installmentAmount * mult)))}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 rounded-xl py-2 text-indigo-400 text-xs font-semibold transition"
          >
            {mult === 0.5 ? '½ cuota' : mult === 1 ? '1 cuota' : '2 cuotas'}
          </button>
        ))}
      </div>

      {/* Numpad táctil */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {['1','2','3','4','5','6','7','8','9','000','0','DEL'].map((key) => (
          <button
            key={key}
            onClick={() => handleNumpad(key)}
            className={`rounded-xl py-4 text-lg font-bold transition ${
              key === 'DEL'
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20'
                : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
            }`}
          >
            {key === 'DEL' ? '⌫' : key}
          </button>
        ))}
      </div>

      {/* Notas */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Nota (opcional)"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-4"
      />

      {/* Botón confirmar */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !amount}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition text-lg"
      >
        {isLoading ? 'Registrando...' : '✓ Confirmar pago'}
      </button>
    </div>
  )
}