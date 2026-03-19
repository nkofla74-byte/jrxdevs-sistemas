'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RefinanceForm({
  credit,
  clientId,
  routeId,
}: {
  credit: any
  clientId: string
  routeId: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [show, setShow] = useState(false)
  const router = useRouter()

  const pendingAmount = (credit.installments - credit.paid_installments) * Number(credit.installment_amount)
  const newTotal = pendingAmount * 1.20
  const newInstallment = newTotal / credit.installments

  async function handleRefinance() {
    setIsLoading(true)
    const supabase = createClient()

    // Marcar crédito actual como refinanciado
    await supabase
      .from('credits')
      .update({ status: 'REFINANCED' })
      .eq('id', credit.id)

    // Crear nuevo crédito
    const { data: route } = await supabase
      .from('routes')
      .select('tenant_id')
      .eq('id', routeId)
      .single()

    await supabase.from('credits').insert({
      tenant_id: route?.tenant_id,
      client_id: clientId,
      route_id: routeId,
      principal: pendingAmount,
      interest_rate: 20,
      total_amount: newTotal,
      installments: credit.installments,
      installment_amount: newInstallment,
      frequency: credit.frequency,
      start_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      paid_installments: 0,
      refinance_count: credit.refinance_count + 1,
    })

    setIsLoading(false)
    router.refresh()
  }

  async function handleWriteOff() {
    setIsLoading(true)
    const supabase = createClient()

    await supabase
      .from('credits')
      .update({ status: 'WRITTEN_OFF' })
      .eq('id', credit.id)

    await supabase
      .from('clients')
      .update({ status: 'BLACKLISTED' })
      .eq('id', clientId)

    setIsLoading(false)
    router.refresh()
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 font-semibold py-3 rounded-2xl transition text-sm"
      >
        🔄 Opciones de refinanciamiento
      </button>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-yellow-500/20">
      <p className="text-yellow-400 font-semibold text-sm mb-1">
        Refinanciamiento #{credit.refinance_count + 1} de 3
      </p>
      <p className="text-gray-400 text-xs mb-4">
        Saldo pendiente: {pendingAmount.toLocaleString()} → Nuevo total: {newTotal.toLocaleString()} (+20%)
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">Nueva cuota</p>
          <p className="text-white font-bold text-sm">{newInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">Cuotas</p>
          <p className="text-white font-bold text-sm">{credit.installments}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleWriteOff}
          disabled={isLoading}
          className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 font-semibold py-3 rounded-xl transition text-sm"
        >
          Incobrable
        </button>
        <button
          onClick={handleRefinance}
          disabled={isLoading}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl transition text-sm"
        >
          {isLoading ? 'Procesando...' : 'Refinanciar'}
        </button>
      </div>
    </div>
  )
}