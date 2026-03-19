'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOfficeSchema, CreateOfficeInput } from '@/lib/validations/offices'
import { createOffice } from '@/modules/offices/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NuevaOficinePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOfficeInput>({
    resolver: zodResolver(createOfficeSchema),
    defaultValues: {
      plan: 'monthly',
      open_time: '08:00',
      close_time: '18:00',
    },
  })

  async function onSubmit(data: CreateOfficeInput) {
    setIsLoading(true)
    setError(null)

    const result = await createOffice(data)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push('/superadmin/oficinas')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/superadmin/oficinas" className="text-gray-400 hover:text-white transition text-sm">
            ← Oficinas
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold">Nueva oficina</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nueva oficina</h1>
          <p className="text-gray-400 text-sm mt-1">
            Crea un nuevo tenant en el sistema
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-1.5">
                Nombre de la oficina
              </label>
              <input
                id="name"
                {...register('name')}
                type="text"
                placeholder="Ej: Créditos Bogotá Norte"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* País y moneda */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-gray-300 text-sm font-medium mb-1.5">
                  País
                </label>
                <select
                  id="country"
                  {...register('country')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">Seleccionar</option>
                  <option value="CO">🇨🇴 Colombia</option>
                  <option value="PE">🇵🇪 Perú</option>
                  <option value="EC">🇪🇨 Ecuador</option>
                  <option value="BR">🇧🇷 Brasil</option>
                </select>
                {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country.message}</p>}
              </div>

              <div>
                <label htmlFor="currency" className="block text-gray-300 text-sm font-medium mb-1.5">
                  Moneda
                </label>
                <select
                  id="currency"
                  {...register('currency')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">Seleccionar</option>
                  <option value="COP">COP — Peso colombiano</option>
                  <option value="PEN">PEN — Sol peruano</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="BRL">BRL — Real brasileño</option>
                </select>
                {errors.currency && <p className="text-red-400 text-xs mt-1">{errors.currency.message}</p>}
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input {...register('plan')} type="radio" value="monthly" className="sr-only peer" />
                  <div className="bg-gray-800 peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 border border-gray-700 rounded-xl p-4 text-center transition">
                    <p className="font-semibold text-sm">Mensual</p>
                    <p className="text-gray-400 text-xs mt-1">S/ 60 por ruta/mes</p>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input {...register('plan')} type="radio" value="quarterly" className="sr-only peer" />
                  <div className="bg-gray-800 peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 border border-gray-700 rounded-xl p-4 text-center transition">
                    <p className="font-semibold text-sm">Trimestral</p>
                    <p className="text-gray-400 text-xs mt-1">S/ 170 por ruta/trimestre</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Horario */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="open_time" className="block text-gray-300 text-sm font-medium mb-1.5">
                  Horario apertura
                </label>
                <input
                  id="open_time"
                  {...register('open_time')}
                  type="time"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                {errors.open_time && <p className="text-red-400 text-xs mt-1">{errors.open_time.message}</p>}
              </div>

              <div>
                <label htmlFor="close_time" className="block text-gray-300 text-sm font-medium mb-1.5">
                  Horario cierre
                </label>
                <input
                  id="close_time"
                  {...register('close_time')}
                  type="time"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                {errors.close_time && <p className="text-red-400 text-xs mt-1">{errors.close_time.message}</p>}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/superadmin/oficinas"
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition text-sm text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {isLoading ? 'Creando...' : 'Crear oficina'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  )
}

