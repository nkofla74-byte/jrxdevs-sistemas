import { createClient } from '@/lib/supabase/server'
import { getClientsByOffice } from '@/modules/clients/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RouteFilter from '@/components/shared/RouteFilter'

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  BLACKLISTED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const statusLabels: Record<string, string> = {
  NEW: 'Nuevo',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  BLACKLISTED: 'Incobrable',
}

const creditStatusColors: Record<string, string> = {
  ACTIVE: '🟢',
  CURRENT: '🟢',
  WATCH: '🟡',
  WARNING: '🟠',
  CRITICAL: '🔴',
  CLOSED: '⚫',
  REFINANCED: '🔵',
  WRITTEN_OFF: '⚫',
}

export default async function ClientesPage({
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

  const { data: clients, error } = await getClientsByOffice(
    userData.tenant_id,
    searchParams.ruta
  )

  // Obtener rutas para el filtro
  const { data: routes } = await supabase
    .from('routes')
    .select('id, name')
    .eq('tenant_id', userData.tenant_id)
    .is('deleted_at', null)
    .eq('status', 'active')

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white transition text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">Clientes</span>
          </div>
          <Link
            href="/admin/clientes/nuevo"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + Nuevo cliente
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-gray-400 text-sm mt-1">
              {clients?.length ?? 0} clientes encontrados
            </p>
          </div>

          {/* Filtro por ruta */}
          <div className="flex items-center gap-3">
 <RouteFilter
  routes={routes ?? []}
  currentRoute={searchParams.ruta}
  basePath="/admin/clientes"
/>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {clients && clients.length > 0 ? (
          <div className="space-y-3">
            {clients.map((client: any) => {
              const activeCredit = client.credits?.find((c: any) =>
                ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
              )

              return (
                <Link
                  key={client.id}
                  href={`/admin/clientes/${client.id}`}
                  className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-indigo-500/50 transition flex items-center justify-between gap-4 block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-400 font-bold text-sm">
                        {client.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{client.full_name}</p>
                        {activeCredit && (
                          <span className="text-sm">
                            {creditStatusColors[activeCredit.status]}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        Doc: {client.document_number} · {client.phone}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        📍 {client.route?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[client.status]}`}>
                      {statusLabels[client.status]}
                    </span>
                    {client.status === 'BLACKLISTED' && (
                      <span className="text-xs text-red-400">⚠️ Incobrable</span>
                    )}
                    <span className="text-gray-500 text-xs">Ver →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-gray-400">No hay clientes registrados todavía.</p>
            <Link
              href="/admin/clientes/nuevo"
              className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Crear primer cliente
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}