'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '@/modules/auth/actions'
import { getDeviceId } from '@/lib/utils/device'

// Schema simplificado sin device_id — lo manejamos aparte
const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(8, 'Mínimo 8 caracteres'),
})

type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    console.log('Formulario enviado:', data)
    setIsLoading(true)
    setError(null)

    const result = await login(data.email, data.password, deviceId)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result?.success) {
      const role = result.role
      if (role === 'superadmin') window.location.href = '/superadmin'
      else if (role === 'admin') window.location.href = '/admin'
      else if (role === 'cobrador') window.location.href = '/cobrador'
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-white text-2xl font-bold">J</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            JRXDevs Sistemas
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestión de microcréditos
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit, (errs) => console.log('Errores:', errs))} className="space-y-4">

            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                {...register('password')}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm mt-2"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 JRXDevs Sistemas · Todos los derechos reservados
        </p>

      </div>
    </main>
  )
}