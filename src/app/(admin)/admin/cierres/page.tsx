import { createClient } from '@/lib/supabase/server'
import { getCashClosings } from '@/modules/cash-closing/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RouteFilter from '@/components/shared/RouteFilter'

function formatCurrency(amount: number) {
  return Number(amount).toLocaleString()
}

export default async function CierresPage({
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

  const tenantId = userData.tenant_id

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)

  const { data: closings, error } = await getCashClosings(tenantId, searchParams.ruta)

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white transition text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">Cierres de caja</span>
          </div>
          <RouteFilter
            routes={routes ?? []}
            currentRoute={searchParams.ruta}
            basePath="/admin/cierres"
          />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Cierres de caja</h1>
          <p className="text-gray-400 text-sm mt-1">
            Historial de los últimos 60 cierres
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {closings && closings.length > 0 ? (
          <div className="space-y-3">
            {closings.map((closing: any) => (
              <div
                key={closing.id}
                className="bg-gray-900 rounded-2xl p-5 border border-gray-800"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-white">
                      {new Date(closing.closing_date).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-gray-400 text-sm">📍 {closing.route?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total a entregar</p>
                    <p className={`text-xl font-bold ${
                      Number(closing.total_to_deliver) >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {formatCurrency(closing.total_to_deliver)}
                    </p>
                  </div>
                </div>

                {/* Detalle */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">Capital base</p>
                    <p className="text-white font-semibold text-sm">
                      {formatCurrency(closing.base_amount)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">Cobrado</p>
                    <p className="text-green-400 font-semibold text-sm">
                      +{formatCurrency(closing.collected_amount)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">Prestado</p>
                    <p className="text-red-400 font-semibold text-sm">
                      -{formatCurrency(closing.loaned_amount)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">Gastos</p>
                    <p className="text-yellow-400 font-semibold text-sm">
                      -{formatCurrency(closing.expenses_amount)}
                    </p>
                  </div>
                </div>

                {closing.notes && (
                  <p className="text-gray-500 text-xs mt-3">
                    📝 {closing.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-gray-400">No hay cierres de caja registrados todavía.</p>
            <p className="text-gray-500 text-sm mt-2">
              Los cierres los realiza el cobrador al finalizar su jornada.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}