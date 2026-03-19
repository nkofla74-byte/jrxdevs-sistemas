'use client'

export default function TotalizarModal({
  data,
  onClose,
}: {
  data: any
  onClose: () => void
}) {
  const {
    collectedToday, totalInStreet, dailyGoal,
    pendingToCollect, clientsPaidToday, totalClients,
    currency, route,
  } = data

  const fmt = (n: number) => Number(n).toLocaleString('es-CO')
  const progressPercent = totalClients > 0
    ? Math.round((clientsPaidToday / totalClients) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-gray-900 rounded-t-3xl p-6 border-t border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold text-white mb-1">Resumen del día</h2>
        <p className="text-gray-400 text-sm mb-6">
          {route.name} · {new Date().toLocaleDateString('es-CO')}
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm">💰 Capital en calle</span>
            <span className="text-white font-semibold">{fmt(totalInStreet)} {currency}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm">🎯 Meta del día</span>
            <span className="text-indigo-400 font-semibold">{fmt(dailyGoal)} {currency}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm">📥 Cobrado hoy</span>
            <span className="text-green-400 font-bold">{fmt(collectedToday)} {currency}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm">📊 Pendiente por cobrar</span>
            <span className="text-yellow-400 font-semibold">
              {fmt(pendingToCollect > 0 ? pendingToCollect : 0)} {currency}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400 text-sm">👥 Clientes visitados</span>
            <span className="text-white font-semibold">{clientsPaidToday}/{totalClients}</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-xs">Progreso del día</span>
            <span className="text-white text-xs font-semibold">{progressPercent}%</span>
          </div>
          <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              }}
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}