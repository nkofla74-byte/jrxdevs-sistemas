'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRouteSchema, CreateRouteInput } from '@/lib/validations/routes'
import { createRoute } from '@/modules/routes/actions'
import { getOffices } from '@/modules/offices/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NuevaRutaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offices, setOffices] = useState<any[]>([])
  const [credentials, setCredentials] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRouteInput>({
    resolver: zodResolver(createRouteSchema),
  })

  useEffect(() => {
    getOffices().then(({ data }) => {
      if (data) setOffices(data.filter((o: any) => o.status === 'active'))
    })
  }, [])

  async function onSubmit(data: CreateRouteInput) {
    setIsLoading(true)
    setError(null)

    const result = await createRoute(data)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result?.success && result.data) {
      setCredentials({
        email: result.data.access_email,
        password: result.data.access_password,
        name: result.data.name,
      })
    }

    setIsLoading(false)
  }

  // Pantalla de credenciales generadas
  if (credentials) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 rounded-2xl p-6 border border-green-500/30">

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h1 className="text-xl font-bold text-white">Ruta creada exitosamente</h1>
              <p className="text-gray-400 text-sm mt-1">
                Guarda estas credenciales — solo se muestran una vez
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
              <div>
                <p className="text-gray-400 text-xs mb-1">Ruta</p>
                <p className="text-white font-semibold">{credentials.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Usuario (email)</p>
                <p className="text-indigo-400 font-mono text-sm">{credentials.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Contraseña</p>
                <p className="text-green-400 font-mono text-xl font-bold tracking-widest">
                  {credentials.password}
                </p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-6">
              <p className="text-yellow-400 text-xs">
                ⚠️ Anota esta contraseña ahora. Si la pierdes, deberás regenerarla desde el detalle de la ruta.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/superadmin/rutas/nueva')}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition text-sm"
              >
                Crear otra ruta
              </button>
              <button
                onClick={() => router.push('/superadmin/rutas')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                Ver rutas
              </button>
            </div>

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/superadmin/rutas" className="text-gray-400 hover:text-white transition text-sm">
            ← Rutas
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold">Nueva ruta</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nueva ruta</h1>
          <p className="text-gray-400 text-sm mt-1">
            Se generará un usuario y contraseña automáticamente
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div>
              <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-1.5">
                Nombre de la ruta
              </label>
              <input
                id="name"
                {...register('name')}
                type="text"
                placeholder="Ej: Zona Norte"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="tenant_id" className="block text-gray-300 text-sm font-medium mb-1.5">
                Oficina
              </label>
              <select
                id="tenant_id"
                {...register('tenant_id')}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="">Seleccionar oficina</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name} — {office.country}
                  </option>
                ))}
              </select>
              {errors.tenant_id && <p className="text-red-400 text-xs mt-1">{errors.tenant_id.message}</p>}
              {offices.length === 0 && (
                <p className="text-yellow-400 text-xs mt-1">
                  ⚠️ No hay oficinas activas. Crea una oficina primero.
                </p>
              )}
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-indigo-400 text-xs">
                💡 Al crear la ruta se generará automáticamente un usuario y contraseña únicos. El administrador de la oficina entregará estas credenciales al cobrador.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/superadmin/rutas"
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition text-sm text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading || offices.length === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {isLoading ? 'Creando...' : 'Crear ruta'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}