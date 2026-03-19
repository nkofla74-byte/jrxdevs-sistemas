import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EnrutarClient from '@/components/cobrador/EnrutarClient'

export default async function EnrutarPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: route } = await supabase
    .from('routes')
    .select('id, name')
    .eq('cobrador_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!route) redirect('/cobrador')

  const today = new Date().toISOString().split('T')[0]

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, full_name, address, visit_order,
      latitude, longitude, status,
      credits(id, status, installment_amount)
    `)
    .eq('route_id', route.id)
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)
    .order('visit_order', { ascending: true })

  const { data: todayPayments } = await supabase
    .from('payments')
    .select('client_id')
    .eq('route_id', route.id)
    .eq('payment_date', today)
    .is('deleted_at', null)

  const paidClientIds = new Set(todayPayments?.map((p) => p.client_id) ?? [])

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cobrador" className="text-gray-400 text-sm">← Atrás</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold text-sm">Enrutar clientes</span>
          </div>
          <span className="text-gray-400 text-xs">{route.name}</span>
        </div>
      </header>

      <EnrutarClient
        clients={clients ?? []}
        paidClientIds={Array.from(paidClientIds)}
        routeId={route.id}
      />

    </main>
  )
}