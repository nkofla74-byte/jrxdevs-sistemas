'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCreditSchema, CreateCreditInput } from '@/lib/validations/clients'
import { createCreditAction } from '@/modules/credits/actions'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function CobradorNuevoCreditoContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente')

  const creditForm = useForm<CreateCreditInput>({
    resolver: zodResolver(createCreditSchema),
    defaultValues: {
      frequency: 'DAILY',
      start_date: new Date().toISOString().split('T')[0],
      interest_rate: 20,
    },
  })

  const watchPrincipal = creditForm.watch('principal')
  const watchInterest = creditForm.watch('interest_rate')
  const watchInstallments = creditForm.watch('installments')
  const watchFrequency = creditForm.watch('frequency')
  const watchStartDate = creditForm.watch('start_date')

  const totalAmount = watchPrincipal && watchInterest
    ? watchPrincipal + (watchPrincipal * watchInterest / 100)
    : 0
  const installmentAmount = totalAmount && watchInstallments
    ? totalAmount / watchInstallments
    : 0

  function calculateEndDate() {
    if (!watchStartDate || !watchInstallments || !watchFrequency) return ''
    const date = new Date(watchStartDate)
    if (watchFrequency === 'DAILY') {
      let daysAdded = 0
      while (daysAdded < watchInstallments) {
        date.setDate(date.getDate() + 1)
        if (date.getDay() !== 0) daysAdded++
      }
    } else if (watchFrequency === 'WEEKLY') {
      date.setDate(date.getDate() + watchInstallments * 7)
    } else if (watchFrequency === 'MONTHLY') {
      date.setMonth(date.getMonth() + watchInstallments)
    }
    return date.toLocaleDateString('es-CO')
  }

  useEffect(() => {
    if (!clienteId) return
    const supabase = createClient()
    supabase
      .from('clients')
      .select('id, full_name, document_number, route_id')
      .eq('id', clienteId)
      .single()
      .then(({ data }) => {
        if (data) {
          setClient(data)
          creditForm.setValue('client_id', data.id)
          creditForm.setValue('route_id', data.route_id)
        }
      })
  }, [clienteId])

  async function onSubmit(data: CreateCreditInput) {
    setIsLoading(true)
    setError(null)
    const result = await createCreditAction(data)
    if (result?.error) { setError(result.error); setIsLoading(false); return }
    if (result?.success) router.push(`/cobrador/cliente/${clienteId}`)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={clienteId ? `/cobrador/cliente/${clienteId}` : '/cobrador'} className="text-gray-400 text-sm">
            Atras
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold text-sm">Nuevo credito</span>
        </div>
      </header>

      <div className="px-4 py-4">
        {client && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-4">
            <p className="text-gray-400 text-xs mb-1">Cliente</p>
            <p className="text-white font-bold">{client.full_name}</p>
            <p className="text-gray-400 text-sm">Doc: {client.document_number}</p>
          </div>
        )}

        {!clienteId && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
            <p className="text-yellow-400 text-sm">Selecciona un cliente primero desde Consultas.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={creditForm.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'DAILY', label: 'Diario' },
              { value: 'WEEKLY', label: 'Semanal' },
              { value: 'MONTHLY', label: 'Mensual' },
            ].map((f) => (
              <label key={f.value} className="cursor-pointer">
                <input {...creditForm.register('frequency')} type="radio" value={f.value} className="sr-only peer" />
                <div className="bg-gray-800 peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 border border-gray-700 rounded-xl p-3 text-center transition">
                  <p className="font-semibold text-sm">{f.label}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Inicio</label>
              <input {...creditForm.register('start_date')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Fin estimado</label>
              <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-indigo-400 text-sm">{calculateEndDate()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Capital</label>
              <input {...creditForm.register('principal', { valueAsNumber: true })} type="number" min="1" placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Interes (%)</label>
              <input {...creditForm.register('interest_rate', { valueAsNumber: true })} type="number" min="0" max="100" step="0.5" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Numero de cuotas</label>
            <input {...creditForm.register('installments', { valueAsNumber: true })} type="number" min="1" placeholder="24" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {totalAmount > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-2">
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wide mb-2">Resumen</p>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Total a pagar</span>
                <span className="text-indigo-400 font-bold text-sm">{totalAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Cuota {watchFrequency === 'DAILY' ? 'diaria' : watchFrequency === 'WEEKLY' ? 'semanal' : 'mensual'}</span>
                <span className="text-green-400 font-bold text-sm">{installmentAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Fecha fin</span>
                <span className="text-white text-sm">{calculateEndDate()}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !clienteId}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition"
          >
            {isLoading ? 'Creando...' : 'Crear credito'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function CobradorNuevoCreditoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </main>
    }>
      <CobradorNuevoCreditoContent />
    </Suspense>
  )
}
