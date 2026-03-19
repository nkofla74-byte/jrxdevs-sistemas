import { getAllRoutes } from '@/modules/routes/actions'
import { toggleRouteStatus, deleteRoute } from '@/modules/routes/actions'
import Link from 'next/link'

const countryFlags: Record<string, string> = {
  CO: '🇨🇴',
  PE: '🇵🇪',
  EC: '🇪🇨',
  BR: '🇧🇷',
}

export default async function RutasPage() {
  const { data: routes, error } = await getAllRoutes()

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/superadmin" className="text-gray-400 hover:text-white transition text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">Rutas</span>
          </div>
          <Link
            href="/superadmin/rutas/nueva"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + Nueva ruta
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Rutas</h1>
          <p className="text-gray-400 text-sm mt-1">
            {routes?.length ?? 0} rutas registradas en el sistema
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {routes && routes.length > 0 ? (
          <div className="space-y-3">
            {routes.map((route: any) => (
              <div
                key={route.id}
                className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center justify-between gap-4"
              >
                {/* Info */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                    <span className="text-indigo-400 text-lg">🗺️</span>
                  </div>
                  <div>
<Link href={`/superadmin/rutas/${route.id}`} className="font-semibold text-white hover:text-indigo-400 transition">
  {route.name}
</Link>                    <p className="text-gray-400 text-sm">
                      {countryFlags[route.tenant?.country]} {route.tenant?.name} · {route.tenant?.currency}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {route.cobrador
                        ? `👤 ${route.cobrador.full_name}`
                        : '⚠️ Sin cobrador asignado'}
                    </p>
                  </div>
                </div>

                {/* Estado y acciones */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    route.status === 'active'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {route.status === 'active' ? 'Activa' : 'Inactiva'}
                  </span>

                  <div className="flex items-center gap-2">
                    <form action={async () => {
                      'use server'
                      await toggleRouteStatus(route.id, route.status)
                    }}>
                      <button
                        type="submit"
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          route.status === 'active'
                            ? 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 border-gray-500/20'
                            : 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/20'
                        }`}
                      >
                        {route.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>

                    <form action={async () => {
                      'use server'
                      await deleteRoute(route.id)
                    }}>
                      <button
                        type="submit"
                        className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 transition"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-gray-400">No hay rutas registradas todavía.</p>
            <Link
              href="/superadmin/rutas/nueva"
              className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Crear primera ruta
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}