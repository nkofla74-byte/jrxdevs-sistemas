import { getAllAdmins } from '@/modules/auth/admin-actions'
import { toggleAdminStatus, deleteAdmin } from '@/modules/auth/admin-actions'
import Link from 'next/link'

const countryFlags: Record<string, string> = {
  CO: '🇨🇴',
  PE: '🇵🇪',
  EC: '🇪🇨',
  BR: '🇧🇷',
}

export default async function AdministradoresPage() {
  const { data: admins, error } = await getAllAdmins()

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/superadmin" className="text-gray-400 hover:text-white transition text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">Administradores</span>
          </div>
          <Link
            href="/superadmin/administradores/nuevo"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + Nuevo administrador
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Administradores</h1>
          <p className="text-gray-400 text-sm mt-1">
            {admins?.length ?? 0} administradores registrados
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {admins && admins.length > 0 ? (
          <div className="space-y-3">
            {admins.map((admin: any) => (
              <div
                key={admin.id}
                className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                    <span className="text-indigo-400 font-bold text-sm">
                      {admin.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{admin.full_name}</p>
                    <p className="text-gray-400 text-sm">{admin.email}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {admin.tenant
                        ? `${countryFlags[admin.tenant.country]} ${admin.tenant.name}`
                        : '⚠️ Sin oficina asignada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    admin.status === 'active'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {admin.status === 'active' ? 'Activo' : 'Bloqueado'}
                  </span>

                  <div className="flex items-center gap-2">
                    <form action={async () => {
                      'use server'
                      await toggleAdminStatus(admin.id, admin.status)
                    }}>
                      <button
                        type="submit"
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          admin.status === 'active'
                            ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/20'
                            : 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/20'
                        }`}
                      >
                        {admin.status === 'active' ? 'Bloquear' : 'Activar'}
                      </button>
                    </form>

                    <form action={async () => {
                      'use server'
                      await deleteAdmin(admin.id)
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
            <p className="text-4xl mb-4">👨‍💼</p>
            <p className="text-gray-400">No hay administradores registrados todavía.</p>
            <Link
              href="/superadmin/administradores/nuevo"
              className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Crear primer administrador
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}