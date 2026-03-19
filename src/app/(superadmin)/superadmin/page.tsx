import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
export default async function SuperAdminPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const { count: totalTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="font-bold text-white">JRXDevs Sistemas</span>
            <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{userData?.full_name}</span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-400 hover:text-white text-sm transition"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Bienvenido, {userData?.full_name} 👋
          </h1>
          <p className="text-gray-400 mt-1">
            Panel de control global — JRXDevs Sistemas
          </p>
        </div>

        {/* Métricas globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Oficinas activas</p>
            <p className="text-3xl font-bold text-white">{totalTenants ?? 0}</p>
            <p className="text-indigo-400 text-xs mt-2">Tenants en el sistema</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Usuarios totales</p>
            <p className="text-3xl font-bold text-white">{totalUsers ?? 0}</p>
            <p className="text-indigo-400 text-xs mt-2">Admins y cobradores</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Clientes totales</p>
            <p className="text-3xl font-bold text-white">{totalClients ?? 0}</p>
            <p className="text-indigo-400 text-xs mt-2">En todas las oficinas</p>
          </div>

        </div>

        {/* Acciones rápidas */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

           <Link href="/superadmin/oficinas" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
  <p className="text-2xl mb-2">🏢</p>
  <p className="text-sm text-gray-300">Oficinas</p>
</Link>

       
          <Link href="/superadmin/rutas" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
  <p className="text-2xl mb-2">🗺️</p>
  <p className="text-sm text-gray-300">Rutas</p>
</Link>


<Link href="/superadmin/administradores" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
  <p className="text-2xl mb-2">👨‍💼</p>
  <p className="text-sm text-gray-300">Administradores</p>
</Link>

         <Link href="/superadmin/auditoria" className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition block">
  <p className="text-2xl mb-2">📋</p>
  <p className="text-sm text-gray-300">Auditoría</p>
</Link>

          </div>
        </div>

      </div>
    </main>
  )
}