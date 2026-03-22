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
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/cobrador" style={{
              color: 'var(--text-muted)', fontSize: 13,
              textDecoration: 'none', fontWeight: 600,
            }}>
              ← Atrás
            </Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              🗺️ Enrutar clientes
            </span>
          </div>
          <span style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 99, padding: '3px 10px',
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
          }}>
            {route.name}
          </span>
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
