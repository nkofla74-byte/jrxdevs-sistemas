import { getRouteDashboard } from '@/modules/offices/admin-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function AdminRouteDashboard({
  params,
}: {
  params: { id: string }
}) {
  const { data, error } = await getRouteDashboard(params.id)

  if (error || !data) redirect('/admin')

  const { route, currency, totalInStreet, collectedToday,
    collectedMonth, capitalInjected, totalClients,
    criticalClients, watchClients } = data

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white transition text-sm">
              ← Dashboard
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

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{route.name}</h1>
          <p className="text-gray-400 text-sm mt-1">Dashboard financiero de la ruta</p>
        </div>

        {/* Alertas */}
        {criticalClients > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🔴</span>
            <p className="text-red-400 text-sm font-semibold">
              {criticalClients} cliente{criticalClients > 1 ? 's' : ''} en estado crítico — 6+ días sin pagar
            </p>
          </div>
        )}

        {watchClients > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🟡</span>
            <p className="text-yellow-400 text-sm font-semibold">
              {watchClients} cliente{watchClients > 1 ? 's' : ''} con mora — requieren seguimiento
            </p>
          </div>
        )}

        {/* Métricas financieras */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Capital inyectado</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(capitalInjected, currency)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Total asignado a la ruta</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Dinero en calle</p>
            <p className="text-2xl font-bold text-indigo-400">
              {formatCurrency(totalInStreet, currency)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Capital prestado activo</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Cobrado hoy</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(collectedToday, currency)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Pagos del día</p>
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
            <p className="text-2xl font-bold text-white">{totalClients}</p>
            <p className="text-gray-500 text-xs mt-1">Con crédito vigente</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Por cobrar</p>
            <p className="text-2xl font-bold text-yellow-400">
              {formatCurrency(totalInStreet - collectedToday, currency)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Pendiente hoy</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Acciones de la ruta</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href={`/admin/clientes?ruta=${route.id}`}
              className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block"
            >
              <p className="text-2xl mb-2">👥</p>
              <p className="text-sm text-gray-300">Ver clientes</p>
            </Link>
            <Link
              href={`/admin/creditos?ruta=${route.id}`}
              className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block"
            >
              <p className="text-2xl mb-2">💳</p>
              <p className="text-sm text-gray-300">Ver créditos</p>
            </Link>
            <Link
              href={`/admin/capital?ruta=${route.id}`}
              className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block"
            >
              <p className="text-2xl mb-2">💰</p>
              <p className="text-sm text-gray-300">Capital</p>
            </Link>
            <Link
              href={`/admin/cierres?ruta=${route.id}`}
              className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block"
            >
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm text-gray-300">Cierres de caja</p>
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}