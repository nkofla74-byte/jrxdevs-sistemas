import { createClient } from '@/lib/supabase/server'
import { getCreditsByOffice } from '@/modules/credits/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RouteFilter from '@/components/shared/RouteFilter'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  CURRENT: 'bg-green-500/10 text-green-400 border-green-500/20',
  WATCH: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  WARNING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  REFINANCED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  WRITTEN_OFF: 'bg-gray-500/10 text-gray-500 border-gray-600/20',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  CURRENT: 'Al día',
  WATCH: '🟡 Atención',
  WARNING: '🟠 Advertencia',
  CRITICAL: '🔴 Crítico',
  CLOSED: 'Cerrado',
  REFINANCED: 'Refinanciado',
  WRITTEN_OFF: 'Incobrable',
}

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
}

export default async function CreditosPage({
  searchParams,
}: {
  searchParams: { ruta?: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) redirect('/admin')

  const { data: credits, error } = await getCreditsByOffice(
    userData.tenant_id,
    searchParams.ruta
  )

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name')
    .eq('tenant_id', userData.tenant_id)
    .is('deleted_at', null)
    .eq('status', 'active')

  const criticalCount = credits?.filter((c: any) => c.status === 'CRITICAL').length ?? 0
  const activeCount = credits?.filter((c: any) =>
    ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
  ).length ?? 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white transition text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">Créditos</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Créditos</h1>
            <p className="text-gray-400 text-sm mt-1">
              {activeCount} activos · {criticalCount > 0 ? `🔴 ${criticalCount} críticos` : ''}
            </p>
          </div>
          <RouteFilter
  routes={routes ?? []}
  currentRoute={searchParams.ruta}
  basePath="/admin/creditos"
/>
        </div>

        {criticalCount > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🔴</span>
            <p className="text-red-400 text-sm font-semibold">
              {criticalCount} crédito{criticalCount > 1 ? 's' : ''} en estado crítico — 6+ días sin pagar
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {credits && credits.length > 0 ? (
          <div className="space-y-3">
            {credits.map((credit: any) => (
              <Link
                key={credit.id}
                href={`/admin/creditos/${credit.id}`}
                className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-indigo-500/50 transition flex items-center justify-between gap-4 block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 font-bold text-sm">
                      {credit.client?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{credit.client?.full_name}</p>
                    <p className="text-gray-400 text-sm">
                      Doc: {credit.client?.document_number}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      📍 {credit.route?.name} · {frequencyLabels[credit.frequency]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">
                      {Number(credit.installment_amount).toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {credit.paid_installments}/{credit.installments} cuotas
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[credit.status]}`}>
                    {statusLabels[credit.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <p className="text-4xl mb-4">💳</p>
            <p className="text-gray-400">No hay créditos registrados todavía.</p>
          </div>
        )}
      </div>
    </main>
  )
}