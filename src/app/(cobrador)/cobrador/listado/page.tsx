import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const creditStatusEmoji: Record<string, string> = {
  ACTIVE: '🟢',
  CURRENT: '🟢',
  WATCH: '🟡',
  WARNING: '🟠',
  CRITICAL: '🔴',
  CLOSED: '⚫',
  REFINANCED: '🔵',
  WRITTEN_OFF: '⚫',
}

const creditStatusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  CURRENT: 'Al día',
  WATCH: 'Atención',
  WARNING: 'Advertencia',
  CRITICAL: 'Crítico',
  CLOSED: 'Cerrado',
  REFINANCED: 'Refinanciado',
  WRITTEN_OFF: 'Incobrable',
}

export default async function ListadoPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener ruta del cobrador
  const { data: route } = await supabase
    .from('routes')
    .select('id, name')
    .eq('cobrador_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!route) redirect('/cobrador')

  // Obtener TODOS los clientes de la ruta
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, full_name, document_number, phone,
      visit_order, status, address,
      credits(id, status, installment_amount, paid_installments, installments, principal)
    `)
    .eq('route_id', route.id)
    .is('deleted_at', null)
    .order('visit_order', { ascending: true })

  // Pagos de hoy
  const today = new Date().toISOString().split('T')[0]
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('client_id, amount')
    .eq('route_id', route.id)
    .eq('payment_date', today)
    .is('deleted_at', null)

  const paidClientIds = new Set(todayPayments?.map((p) => p.client_id) ?? [])

  const activeClients = clients?.filter((c) => c.status === 'ACTIVE') ?? []
  const inactiveClients = clients?.filter((c) => c.status !== 'ACTIVE') ?? []

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cobrador" className="text-gray-400 text-sm">← Atrás</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold text-sm">Listado general</span>
          </div>
          <span className="text-gray-400 text-xs">{route.name}</span>
        </div>
      </header>

      <div className="px-4 py-4 pb-8">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 rounded-2xl p-3 border border-gray-800 text-center">
            <p className="text-2xl font-bold text-white">{clients?.length ?? 0}</p>
            <p className="text-gray-500 text-xs">Total</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-3 border border-gray-800 text-center">
            <p className="text-2xl font-bold text-green-400">{paidClientIds.size}</p>
            <p className="text-gray-500 text-xs">Pagaron hoy</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-3 border border-gray-800 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {activeClients.length - paidClientIds.size}
            </p>
            <p className="text-gray-500 text-xs">Pendientes</p>
          </div>
        </div>

        {/* Clientes activos */}
        {activeClients.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
              Clientes activos ({activeClients.length})
            </p>
            <div className="space-y-2">
              {activeClients.map((client: any) => {
                const activeCredit = client.credits?.find((c: any) =>
                  ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
                )
                const paid = paidClientIds.has(client.id)
                const todayPayment = todayPayments?.find((p) => p.client_id === client.id)

                return (
                  <Link
                    key={client.id}
                    href={`/cobrador/cliente/${client.id}`}
                    className={`block rounded-2xl p-4 border transition active:scale-98 ${
                      paid
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          paid ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {client.visit_order}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold text-sm ${paid ? 'text-green-400' : 'text-white'}`}>
                              {client.full_name}
                            </p>
                            {activeCredit && (
                              <span className="text-xs">{creditStatusEmoji[activeCredit.status]}</span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs">
                            Doc: {client.document_number}
                          </p>
                          {activeCredit && (
                            <p className="text-gray-400 text-xs">
                              Cuota: {Number(activeCredit.installment_amount).toLocaleString()} ·{' '}
                              {activeCredit.paid_installments}/{activeCredit.installments}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {paid && todayPayment ? (
                          <div>
                            <p className="text-green-400 text-xs font-semibold">✓ Pagado</p>
                            <p className="text-green-400 text-xs">
                              {Number(todayPayment.amount).toLocaleString()}
                            </p>
                          </div>
                        ) : activeCredit ? (
                          <div>
                            <p className="text-white text-sm font-bold">
                              {Number(activeCredit.installment_amount).toLocaleString()}
                            </p>
                            <p className="text-gray-500 text-xs">por cobrar</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Clientes inactivos */}
        {inactiveClients.length > 0 && (
          <div>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">
              Sin crédito activo ({inactiveClients.length})
            </p>
            <div className="space-y-2">
              {inactiveClients.map((client: any) => (
                <Link
                  key={client.id}
                  href={`/cobrador/cliente/${client.id}`}
                  className="block bg-gray-900/50 rounded-2xl p-3 border border-gray-800/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-xs text-gray-600 font-bold flex-shrink-0">
                        {client.visit_order}
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">{client.full_name}</p>
                        <p className="text-gray-600 text-xs">Doc: {client.document_number}</p>
                      </div>
                    </div>
                    {client.status === 'BLACKLISTED' && (
                      <span className="text-red-400 text-xs">⚠️ Incobrable</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sin clientes */}
        {(!clients || clients.length === 0) && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-400 text-sm">No hay clientes en esta ruta todavía.</p>
            <Link
              href="/cobrador/nuevo-cliente"
              className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              + Crear primer cliente
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}