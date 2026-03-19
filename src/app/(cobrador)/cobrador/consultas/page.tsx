'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ConsultasPage() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [routeId, setRouteId] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('routes')
        .select('id')
        .eq('cobrador_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setRouteId(data.id)
        })
    })
  }, [])

  useEffect(() => {
    if (!search || search.length < 2 || !routeId) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('clients')
        .select(`
          id, full_name, document_number, phone, status, visit_order,
          credits(id, status, installment_amount, paid_installments, installments)
        `)
        .eq('route_id', routeId)
        .is('deleted_at', null)
        .or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%`)
        .order('visit_order', { ascending: true })

      setResults(data ?? [])
      setIsLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [search, routeId])

  const statusColors: Record<string, string> = {
    NEW: 'text-gray-400',
    ACTIVE: 'text-green-400',
    INACTIVE: 'text-gray-500',
    BLACKLISTED: 'text-red-400',
  }

  const creditStatusEmoji: Record<string, string> = {
    ACTIVE: '🟢', CURRENT: '🟢', WATCH: '🟡',
    WARNING: '🟠', CRITICAL: '🔴', CLOSED: '⚫',
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/cobrador" className="text-gray-400 text-sm">← Atrás</Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold text-sm">Consultas</span>
        </div>
      </header>

      <div className="px-4 py-4">

        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
          />
          {isLoading && (
            <div className="absolute right-3 top-3.5 text-gray-400 text-sm">⏳</div>
          )}
        </div>

        {search.length > 0 && search.length < 2 && (
          <p className="text-gray-500 text-sm text-center py-4">Escribe al menos 2 caracteres</p>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((client) => {
              const activeCredit = client.credits?.find((c: any) =>
                ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
              )
              return (
                <Link
                  key={client.id}
                  href={`/cobrador/cliente/${client.id}`}
                  className="block bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-indigo-500/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                        <span className="text-indigo-400 font-bold text-sm">
                          {client.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{client.full_name}</p>
                        <p className="text-gray-400 text-xs">Doc: {client.document_number}</p>
                        <p className={`text-xs ${statusColors[client.status]}`}>
                          #{client.visit_order} · {client.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activeCredit && (
                        <>
                          <p className="text-xs">{creditStatusEmoji[activeCredit.status]}</p>
                          <p className="text-white text-xs font-semibold">
                            {Number(activeCredit.installment_amount).toLocaleString()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {activeCredit.paid_installments}/{activeCredit.installments}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {search.length >= 2 && !isLoading && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-400 text-sm">No se encontraron clientes con ese criterio.</p>
            <Link
              href="/cobrador/nuevo-cliente"
              className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              + Crear nuevo cliente
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}