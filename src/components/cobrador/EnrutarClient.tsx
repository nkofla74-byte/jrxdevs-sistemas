'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const creditStatusEmoji: Record<string, string> = {
  ACTIVE: '🟢', CURRENT: '🟢', WATCH: '🟡',
  WARNING: '🟠', CRITICAL: '🔴',
}

export default function EnrutarClient({
  clients,
  paidClientIds,
  routeId,
}: {
  clients: any[]
  paidClientIds: string[]
  routeId: string
}) {
  const [orderedClients, setOrderedClients] = useState(clients)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const paidSet = new Set(paidClientIds)

  function moveUp(index: number) {
    if (index === 0) return
    const newList = [...orderedClients]
    const temp = newList[index - 1]
    newList[index - 1] = newList[index]
    newList[index] = temp
    setOrderedClients(newList)
    setSaved(false)
  }

  function moveDown(index: number) {
    if (index === orderedClients.length - 1) return
    const newList = [...orderedClients]
    const temp = newList[index]
    newList[index] = newList[index + 1]
    newList[index + 1] = temp
    setOrderedClients(newList)
    setSaved(false)
  }

  async function saveOrder() {
    setIsSaving(true)
    const supabase = createClient()
    for (let i = 0; i < orderedClients.length; i++) {
      await supabase
        .from('clients')
        .update({ visit_order: i + 1 })
        .eq('id', orderedClients[i].id)
    }
    setSaved(true)
    setIsSaving(false)
    router.refresh()
  }

  return (
    <div className="px-4 py-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">{orderedClients.length} clientes</p>
        <button
          onClick={saveOrder}
          disabled={isSaving || saved}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar orden'}
        </button>
      </div>

      <div className="space-y-2">
        {orderedClients.map((client, index) => {
          const paid = paidSet.has(client.id)
          const activeCredit = client.credits?.find((c: any) =>
            ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
          )
          return (
            <div
              key={client.id}
              className={`rounded-2xl border transition ${
                paid ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="w-7 h-7 rounded-lg bg-gray-800 disabled:opacity-30 flex items-center justify-center text-gray-400 hover:bg-gray-700 transition text-xs"
                  >
                    u
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === orderedClients.length - 1}
                    className="w-7 h-7 rounded-lg bg-gray-800 disabled:opacity-30 flex items-center justify-center text-gray-400 hover:bg-gray-700 transition text-xs"
                  >
                    d
                  </button>
                </div>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  paid ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm truncate ${paid ? 'text-green-400' : 'text-white'}`}>
                      {client.full_name}
                    </p>
                    {activeCredit && (
                      <span className="text-xs flex-shrink-0">{creditStatusEmoji[activeCredit.status]}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs truncate">{client.address}</p>
                  {activeCredit && (
                    <p className="text-gray-400 text-xs">
                  Cuota: {Number(activeCredit.installment_amount).toFixed(0)}                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Link
                    href={`/cobrador/cliente/${client.id}`}
                    className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-lg border border-indigo-500/20 text-center"
                  >
                    Ver
                  </Link>
                  {client.latitude && client.longitude && (
                    <Link
                      href={`https://maps.google.com?q=${client.latitude},${client.longitude}`}
                      target="_blank"
                      className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg text-center"
                    >
                      mapa
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {orderedClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">mapa</p>
          <p className="text-gray-400 text-sm">No hay clientes activos en esta ruta.</p>
        </div>
      )}
    </div>
  )
}
