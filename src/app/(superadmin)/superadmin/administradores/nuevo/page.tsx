'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAdminSchema, CreateAdminInput } from '@/lib/validations/users'
import { createAdmin } from '@/modules/auth/admin-actions'
import { getOffices } from '@/modules/offices/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NuevoAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offices, setOffices] = useState<any[]>([])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
  })

  useEffect(() => {
    getOffices().then(({ data }) => {
      if (data) setOffices(data.filter((o: any) => o.status === 'active'))
    })
  }, [])

  async function onSubmit(data: CreateAdminInput) {
    setIsLoading(true)
    setError(null)

    const result = await createAdmin(data)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push('/superadmin/administradores')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/superadmin/administradores" className="text-gray-400 hover:text-white transition text-sm">
            ← Administradores
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold">Nuevo administrador</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nuevo administrador</h1>
          <p className="text-gray-400 text-sm mt-1">
            Asigna un administrador a una oficina
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
              <label htmlFor="full_name" className="block text-gray-300 text-sm font-medium mb-1.5">
                Nombre completo
              </label>
              <input
                id="full_name"
                {...register('full_name')}
                type="text"
                placeholder="Ej: Carlos Ramírez"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                placeholder="correo@ejemplo.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                {...register('password')}
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
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
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/superadmin/administradores"
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition text-sm text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {isLoading ? 'Creando...' : 'Crear administrador'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}