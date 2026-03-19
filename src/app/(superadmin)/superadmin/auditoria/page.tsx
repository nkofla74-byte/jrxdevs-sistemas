import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const actionColors: Record<string, string> = {
  LOGIN_EXITOSO: 'text-green-400 bg-green-500/10 border-green-500/20',
  LOGIN_FALLIDO: 'text-red-400 bg-red-500/10 border-red-500/20',
  LOGOUT: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  SESION_BLOQUEADA: 'text-red-400 bg-red-500/10 border-red-500/20',
  OFICINA_CREADA: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  OFICINA_CONGELADA: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  OFICINA_ACTIVADA: 'text-green-400 bg-green-500/10 border-green-500/20',
  OFICINA_ELIMINADA: 'text-red-400 bg-red-500/10 border-red-500/20',
  RUTA_CREADA: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  RUTA_ELIMINADA: 'text-red-400 bg-red-500/10 border-red-500/20',
  ADMIN_CREADO: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  PAGO_REGISTRADO: 'text-green-400 bg-green-500/10 border-green-500/20',
  PAGO_EDITADO: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  CREDITO_CREADO: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  CREDITO_ELIMINADO: 'text-red-400 bg-red-500/10 border-red-500/20',
  CAPITAL_INYECTADO: 'text-green-400 bg-green-500/10 border-green-500/20',
  CAPITAL_RETIRADO: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export default async function AuditoriaPage() {
  const supabase = createClient()

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user:users(id, full_name, email, role)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/superadmin" className="text-gray-400 hover:text-white transition text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold">Auditoría</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Auditoría</h1>
          <p className="text-gray-400 text-sm mt-1">
            Últimas 100 acciones del sistema
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {logs && logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">

                  {/* Acción */}
                  <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${
                    actionColors[log.action] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20'
                  }`}>
                    {log.action}
                  </span>

                  {/* Info */}
                  <div>
                    <p className="text-white text-sm">
                      {log.user?.full_name ?? 'Sistema'}
                      <span className="text-gray-500 text-xs ml-2">
                        {log.user?.email}
                      </span>
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {log.entity} · {log.entity_id?.substring(0, 8)}...
                    </p>
                    {log.data_after && (
                      <p className="text-gray-600 text-xs mt-1 font-mono">
                        {JSON.stringify(log.data_after).substring(0, 80)}
                        {JSON.stringify(log.data_after).length > 80 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fecha */}
                <p className="text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(log.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-400">No hay registros de auditoría todavía.</p>
          </div>
        )}

      </div>
    </main>
  )
}