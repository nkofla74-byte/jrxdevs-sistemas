import { getOfficeDashboard } from '@/modules/offices/admin-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function AdminDashboard() {
  const { data, error } = await getOfficeDashboard()

  if (error || !data) redirect('/login')

  const { tenant, adminName, routes, totalRoutes, totalInStreet,
    collectedToday, collectedMonth, activeClients, criticalCredits } = data

  const currency = tenant?.currency ?? 'COP'

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {tenant?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">{tenant?.name}</p>
              <p className="text-gray-500 text-xs">{tenant?.country} · {currency}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{adminName}</span>
            <form action="/api/auth/logout" method="POST">
              <button className="text-gray-400 hover:text-white text-sm transition">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Vista global de {tenant?.name}
          </p>
        </div>

        {/* Alerta créditos críticos */}
        {criticalCredits > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🔴</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">
                {criticalCredits} crédito{criticalCredits > 1 ? 's' : ''} en estado crítico
              </p>
              <p className="text-red-400/70 text-xs">6+ días sin pagar — requiere atención inmediata</p>
            </div>
          </div>
        )}

        {/* Métricas globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Dinero en calle</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(totalInStreet, currency)}
            </p>
            <p className="text-indigo-400 text-xs mt-1">Capital prestado activo</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Cobrado hoy</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(collectedToday, currency)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Todas las rutas</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Cobrado este mes</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(collectedMonth, currency)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Acumulado del mes</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Clientes activos</p>
            <p className="text-2xl font-bold text-white">{activeClients}</p>
            <p className="text-gray-500 text-xs mt-1">Con crédito vigente</p>
          </div>
        </div>

        {/* Rutas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Rutas activas ({totalRoutes})
            </h2>
          </div>

          {routes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((route: any) => (
                <Link
                  key={route.id}
                  href={`/admin/rutas/${route.id}`}
                  className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-indigo-500/50 transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                        <span className="text-indigo-400 text-lg">🗺️</span>
                      </div>
                      <p className="font-semibold text-white group-hover:text-indigo-400 transition">
                        {route.name}
                      </p>
                    </div>
                    <span className="text-gray-500 text-xs">Ver detalle →</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-gray-500 text-xs">Capital inyectado</p>
                      <p className="text-white font-semibold text-sm mt-0.5">
                        {formatCurrency(Number(route.capital_injected), currency)}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-gray-500 text-xs">Estado</p>
                      <p className={`font-semibold text-sm mt-0.5 ${
                        route.status === 'active' ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {route.status === 'active' ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-gray-400 text-sm">No hay rutas activas en esta oficina.</p>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/clientes" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
              <p className="text-2xl mb-2">👥</p>
              <p className="text-sm text-gray-300">Clientes</p>
            </Link>
            <Link href="/admin/creditos" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-sm text-gray-300">Créditos</p>
            </Link>
            <Link href="/admin/capital" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
              <p className="text-2xl mb-2">💰</p>
              <p className="text-sm text-gray-300">Capital</p>
            </Link>
            <Link href="/admin/cierres" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm text-gray-300">Cierres de caja</p>
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}