'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '@/modules/auth/actions'
import { getDeviceId } from '@/lib/utils/device'
import ThemeToggle from '@/components/shared/ThemeToggle'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(8, 'Mínimo 8 caracteres'),
})

type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)

useEffect(() => {
  setDeviceId(getDeviceId())
  const saved = localStorage.getItem('jrx_theme') || 'dark'
  document.documentElement.setAttribute('data-theme', saved)

  const params = new URLSearchParams(window.location.search)
  const errorType = params.get('error')
  const oficina = params.get('oficina') ?? 'tu oficina'
  const ruta = params.get('ruta') ?? 'tu ruta'

  const errorMessages: Record<string, string> = {
    cuenta_bloqueada: '🔒 Tu cuenta ha sido bloqueada por el administrador. Contacta a JRXDevs para más información.',
    oficina_congelada: `❄️ La oficina "${oficina}" ha sido congelada por falta de pago. Contacta al administrador de JRXDevs para reactivarla.`,
    oficina_inactiva: `⚠️ La oficina "${oficina}" está inactiva. Contacta al administrador de JRXDevs.`,
    ruta_inactiva: `🗺️ La ruta "${ruta}" ha sido desactivada por el administrador. Contacta a tu oficina.`,
    ruta_no_encontrada: '❌ No tienes una ruta asignada. Contacta al administrador.',
    dispositivo_desconocido: '📱 Dispositivo no autorizado. Contacta al administrador.',
  }

  if (errorType && errorMessages[errorType]) {
    setError(errorMessages[errorType])
  }
}, [])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
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
      else window.location.href = '/login'
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Fondo con gradiente */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* Toggle de tema */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 animate-pulse-neon"
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: '0 0 30px var(--neon-glow-strong)',
            }}
          >
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: 'white' }}>J</span>
          </div>
          <h1 style={{
            fontFamily: 'Syne',
            fontWeight: 800,
            fontSize: 26,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}>
            JRXDevs Sistemas
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Gestión de microcréditos
          </p>
        </div>

        {/* Card del formulario */}
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 28,
          }}
        >
          {error && (
            <div
              className="animate-fade-in"
              style={{
                background: 'var(--danger-dim)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 20,
              }}
            >
              <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
              }}>
                Correo electrónico
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                placeholder="correo@ejemplo.com"
                className="input"
              />
              {errors.email && (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label style={{
                display: 'block',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ marginTop: 8, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? '⏳ Iniciando sesión...' : '🚀 Iniciar sesión'}
            </button>

          </form>
        </div>

        <p style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
          marginTop: 24,
        }}>
          © 2026 JRXDevs Sistemas · Todos los derechos reservados
        </p>

      </div>
    </main>
  )
}