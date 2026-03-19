'use client'

import { useState } from 'react'
import { registerExpense } from '@/modules/cobrador/actions'
import { useRouter } from 'next/navigation'

export default function GastoModal({
  routeId,
  onClose,
}: {
  routeId: string
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Ingresa un monto válido.'); return }
    if (!description.trim()) { setError('Describe el gasto.'); return }

    setIsLoading(true)
    const result = await registerExpense(routeId, num, description)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-gray-900 rounded-t-3xl p-6 border-t border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold text-white mb-4">Registrar gasto</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Transporte, papelería..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">
              Monto
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition"
          >
            {isLoading ? 'Guardando...' : '💸 Registrar gasto'}
          </button>
        </div>
      </div>
    </div>
  )
}