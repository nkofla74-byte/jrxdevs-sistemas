import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import ReportesClient from '@/components/superadmin/ReportesClient'

export default async function ReportesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString().split('T')[0]

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, country, currency, status')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount, payment_date, tenant_id, route_id')
    .gte('payment_date', firstDayOfMonth)
    .is('deleted_at', null)
    .order('payment_date', { ascending: true })

  const { data: credits } = await supabase
    .from('credits')
    .select('tenant_id, status, principal, total_amount, paid_installments, installments')
    .is('deleted_at', null)

  const { data: clients } = await supabase
    .from('clients')
    .select('tenant_id, status')
    .is('deleted_at', null)

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, tenant_id, capital_injected')
    .is('deleted_at', null)
    .eq('status', 'active')

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Reportes"
        backHref="/superadmin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Reportes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Exporta y analiza los datos del sistema
          </p>
        </div>

        <ReportesClient
          tenants={tenants ?? []}
          monthPayments={monthPayments ?? []}
          credits={credits ?? []}
          clients={clients ?? []}
          routes={routes ?? []}
        />

      </div>
    </main>
  )
}
