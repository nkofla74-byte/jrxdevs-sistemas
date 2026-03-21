import { createClient } from '@/lib/supabase/server'
import { toggleRouteStatus, deleteRoute, regenerateRoutePassword, resetRouteDevice } from '@/modules/routes/actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function RutaDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: route, error } = await supabase
    .from('routes')
    .select(`
      *,
      tenant:tenants(id, name, country, currency)
    `)
    .eq('id', params.id)
    .single()

  if (error || !route) redirect('/superadmin/rutas')

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/superadmin/rutas" className="text-gray-400 hover:text-white transition text-sm">
              ← Rutas
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">{route.name}</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${
            route.status === 'active'
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>
            {route.status === 'active' ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Info de la ruta */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Información</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Ruta</p>
              <p className="text-white font-medium">{route.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Oficina</p>
              <p className="text-white font-medium">{route.tenant?.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">País</p>
              <p className="text-white font-medium">{route.tenant?.country}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Moneda</p>
              <p className="text-white font-medium">{route.tenant?.currency}</p>
            </div>
          </div>
        </div>

        {/* Credenciales de acceso */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Credenciales de acceso</h2>
          <p className="text-gray-400 text-sm mb-4">
            Entrega estas credenciales al cobrador de esta ruta.
          </p>

          <div className="bg-gray-800 rounded-xl p-4 space-y-3 mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Usuario</p>
              <p className="text-indigo-400 font-mono text-sm">{route.access_email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Contraseña actual</p>
              <p className="text-green-400 font-mono text-xl font-bold tracking-widest">
                {route.access_password}
              </p>
            </div>
          </div>

          <form action={async () => {
            'use server'
            await regenerateRoutePassword(route.id)
          }}>
            <button
              type="submit"
              className="text-sm bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl border border-yellow-500/20 transition"
            >
              🔄 Regenerar contraseña
            </button>
          </form>
        </div>

        {/* Acciones */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Acciones</h2>
        <form action={async () => {
  'use server'
  await resetRouteDevice(route.id)
}}>
  <button
    type="submit"
    className="text-sm bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl border border-yellow-500/20 transition"
  >
    📱 Resetear dispositivo
  </button>
</form>
            </form>

            <form action={async () => {
              'use server'
              await deleteRoute(route.id)
              redirect('/superadmin/rutas')
            }}>
              <button
                type="submit"
                className="text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl border border-red-500/20 transition"
              >
                Eliminar ruta
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  )
}