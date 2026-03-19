import { getOffices } from '@/modules/offices/actions'
import Link from 'next/link'
import { freezeOffice, activateOffice, deleteOffice } from '@/modules/offices/actions'

const countryNames: Record<string, string> = {
  CO: '🇨🇴 Colombia',
  PE: '🇵🇪 Perú',
  EC: '🇪🇨 Ecuador',
  BR: '🇧🇷 Brasil',
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  frozen: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const statusLabels: Record<string, string> = {
  active: 'Activa',
  frozen: 'Congelada',
  inactive: 'Inactiva',
}

export default async function OficinasPage() {
  const { data: offices, error } = await getOffices()

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
            <span className="text-white font-semibold">Oficinas</span>
          </div>
          <Link
            href="/superadmin/oficinas/nueva"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + Nueva oficina
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Oficinas</h1>
          <p className="text-gray-400 text-sm mt-1">
            {offices?.length ?? 0} oficinas registradas en el sistema
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Lista de oficinas */}
        {offices && offices.length > 0 ? (
          <div className="space-y-3">
            {offices.map((office) => (
              <div
                key={office.id}
                className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center justify-between gap-4"
              >
                {/* Info */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                    <span className="text-indigo-400 font-bold text-sm">
                      {office.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{office.name}</p>
                    <p className="text-gray-400 text-sm">
                      {countryNames[office.country]} · {office.currency} · {office.plan === 'monthly' ? 'Mensual' : 'Trimestral'}
                    </p>
                  </div>
                </div>

                {/* Estado y acciones */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyles[office.status]}`}>
                    {statusLabels[office.status]}
                  </span>

                  <div className="flex items-center gap-2">
                    {office.status === 'active' ? (
                      <form action={async () => {
                        'use server'
                        await freezeOffice(office.id)
                      }}>
                        <button
                          type="submit"
                          className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 transition"
                        >
                          Congelar
                        </button>
                      </form>
                    ) : office.status === 'frozen' ? (
                      <form action={async () => {
                        'use server'
                        await activateOffice(office.id)
                      }}>
                        <button
                          type="submit"
                          className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20 transition"
                        >
                          Activar
                        </button>
                      </form>
                    ) : null}

                    <form action={async () => {
                      'use server'
                      await deleteOffice(office.id)
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
            <p className="text-4xl mb-4">🏢</p>
            <p className="text-gray-400">No hay oficinas registradas todavía.</p>
            <Link
              href="/superadmin/oficinas/nueva"
              className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Crear primera oficina
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}