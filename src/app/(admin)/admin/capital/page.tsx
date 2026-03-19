import { createClient } from '@/lib/supabase/server'
import { getCapitalMovements } from '@/modules/capital/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CapitalForm from '@/components/shared/CapitalForm'

const typeLabels: Record<string, string> = {
  INJECTION: '💰 Inyección',
  WITHDRAWAL: '💸 Retiro',
  TRANSFER: '↔️ Transferencia',
  REINFORCEMENT: '🔄 Refuerzo',
}

const typeColors: Record<string, string> = {
  INJECTION: 'text-green-400',
  WITHDRAWAL: 'text-red-400',
  TRANSFER: 'text-blue-400',
  REINFORCEMENT: 'text-yellow-400',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function CapitalPage({
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

  // Obtener rutas
  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, capital_injected, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  // Obtener movimientos
  const { data: movements } = await getCapitalMovements(tenantId, searchParams.ruta)

  // Total capital global
  const totalCapital = routes?.reduce((sum, r) => sum + Number(r.capital_injected), 0) ?? 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white transition text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold">Capital</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gestión de capital</h1>
          <p className="text-gray-400 text-sm mt-1">
            Capital total en circulación: <span className="text-white font-semibold">{totalCapital.toLocaleString()}</span>
          </p>
        </div>

        {/* Capital por ruta */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {routes?.map((route) => (
            <div key={route.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white">{route.name}</p>
                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  Activa
                </span>
              </div>
              <p className="text-3xl font-bold text-indigo-400">
                {Number(route.capital_injected).toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs mt-1">Capital inyectado</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Formulario de movimientos */}
          <CapitalForm routes={routes ?? []} />

          {/* Historial de movimientos */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">
              Historial de movimientos
            </h2>

            {movements && movements.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {movements.map((mov: any) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className={`font-semibold text-sm ${typeColors[mov.type]}`}>
                        {typeLabels[mov.type]}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {mov.route?.name}
                        {mov.notes ? ` · ${mov.notes}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-sm">
                        {Number(mov.amount).toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(mov.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay movimientos registrados.</p>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}