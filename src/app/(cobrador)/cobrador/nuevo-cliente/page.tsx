'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClientStep1Schema, CreateClientStep1Input, createCreditSchema, CreateCreditInput } from '@/lib/validations/clients'
import { createClientAction } from '@/modules/clients/actions'
import { createCreditAction } from '@/modules/credits/actions'
import { createClient } from '@/lib/supabase/client'
import { uploadImage, compressImage } from '@/lib/utils/cloudinary'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STEPS = ['Datos', 'Fotos', 'Crédito']

export default function CobradorNuevoClientePage() {
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [routeClients, setRouteClients] = useState<any[]>([])
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)
  const [photoDocFront, setPhotoDocFront] = useState<string | null>(null)
  const [photoDocBack, setPhotoDocBack] = useState<string | null>(null)
  const [photoPlace, setPhotoPlace] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const router = useRouter()

  const clientForm = useForm<CreateClientStep1Input>({
    resolver: zodResolver(createClientStep1Schema),
    defaultValues: { visit_order: 1 },
  })

  const creditForm = useForm<CreateCreditInput>({
    resolver: zodResolver(createCreditSchema),
    defaultValues: {
      frequency: 'DAILY',
      start_date: new Date().toISOString().split('T')[0],
      interest_rate: 20,
    },
  })

  const watchPrincipal = creditForm.watch('principal')
  const watchInterest = creditForm.watch('interest_rate')
  const watchInstallments = creditForm.watch('installments')
  const watchFrequency = creditForm.watch('frequency')
  const watchStartDate = creditForm.watch('start_date')
  const watchRouteId = clientForm.watch('route_id')

  const totalAmount = watchPrincipal && watchInterest
    ? watchPrincipal + (watchPrincipal * watchInterest / 100)
    : 0
  const installmentAmount = totalAmount && watchInstallments
    ? totalAmount / watchInstallments
    : 0

  function calculateEndDate() {
    if (!watchStartDate || !watchInstallments || !watchFrequency) return '—'
    const date = new Date(watchStartDate)
    if (watchFrequency === 'DAILY') {
      let daysAdded = 0
      while (daysAdded < watchInstallments) {
        date.setDate(date.getDate() + 1)
        if (date.getDay() !== 0) daysAdded++
      }
    } else if (watchFrequency === 'WEEKLY') {
      date.setDate(date.getDate() + watchInstallments * 7)
    } else if (watchFrequency === 'MONTHLY') {
      date.setMonth(date.getMonth() + watchInstallments)
    }
    return date.toLocaleDateString('es-CO')
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('routes')
        .select('id, name')
        .eq('cobrador_id', user.id)
        .eq('status', 'active')
        .then(({ data }) => setRoutes(data ?? []))
    })
  }, [])

  useEffect(() => {
    if (!watchRouteId) return
    const supabase = createClient()
    supabase
      .from('clients')
      .select('id, full_name, visit_order')
      .eq('route_id', watchRouteId)
      .is('deleted_at', null)
      .order('visit_order', { ascending: true })
      .then(({ data }) => setRouteClients(data ?? []))
  }, [watchRouteId])

  function getLocation() {
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clientForm.setValue('latitude', pos.coords.latitude)
        clientForm.setValue('longitude', pos.coords.longitude)
        setGettingLocation(false)
      },
      () => setGettingLocation(false)
    )
  }

  async function handlePhotoUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back' | 'place'
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      const url = await uploadImage(compressed, 'clientes')
      if (type === 'front') setPhotoDocFront(url)
      else if (type === 'back') setPhotoDocBack(url)
      else setPhotoPlace(url)
    } catch {
      setError('Error al subir la imagen.')
    }
  }

  async function onSubmitClient(data: CreateClientStep1Input) {
    if (!photoDocFront || !photoDocBack || !photoPlace) {
      setStep(1)
      setError('Debes subir las 3 fotos.')
      return
    }
    setIsLoading(true)
    setError(null)
    const result = await createClientAction({
      ...data,
      photo_doc_front: photoDocFront,
      photo_doc_back: photoDocBack,
      photo_place: photoPlace,
    })
    if (result?.error) { setError(result.error); setIsLoading(false); return }
    if (result?.success) {
      setCreatedClientId(result.data.id)
      creditForm.setValue('client_id', result.data.id)
      creditForm.setValue('route_id', result.data.route_id)
      setStep(2)
    }
    setIsLoading(false)
  }

  async function onSubmitCredit(data: CreateCreditInput) {
    setIsLoading(true)
    setError(null)
    const result = await createCreditAction(data)
    if (result?.error) { setError(result.error); setIsLoading(false); return }
    if (result?.success) router.push(`/cobrador/cliente/${createdClientId}`)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/cobrador" className="text-gray-400 text-sm">← Atrás</Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-semibold text-sm">Nuevo cliente</span>
        </div>
      </header>

      <div className="px-4 py-4">

        {/* Pasos */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < step ? 'bg-indigo-600 border-indigo-600 text-white'
                : i === step ? 'border-indigo-500 text-indigo-400'
                : 'border-gray-700 text-gray-600'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-white' : 'text-gray-600'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-indigo-600' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Paso 1 */}
        {step === 0 && (
          <form onSubmit={clientForm.handleSubmit(() => { setError(null); setStep(1) })} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Nombre completo</label>
              <input {...clientForm.register('full_name')} type="text" placeholder="María García" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {clientForm.formState.errors.full_name && <p className="text-red-400 text-xs mt-1">{clientForm.formState.errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Documento</label>
              <input {...clientForm.register('document_number')} type="text" placeholder="Cédula / DNI" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {clientForm.formState.errors.document_number && <p className="text-red-400 text-xs mt-1">{clientForm.formState.errors.document_number.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Teléfono</label>
                <input {...clientForm.register('phone')} type="tel" placeholder="3001234567" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Ruta</label>
                <select {...clientForm.register('route_id')} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Seleccionar</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Dirección</label>
              <input {...clientForm.register('address')} type="text" placeholder="Calle 45 #12-34" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Orden de visita</label>
              <input {...clientForm.register('visit_order', { valueAsNumber: true })} type="number" min="1" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {routeClients.length > 0 && (
                <div className="mt-2 bg-gray-800 rounded-xl p-3 max-h-28 overflow-y-auto">
                  {routeClients.map((c) => (
                    <p key={c.id} className="text-gray-400 text-xs py-0.5">#{c.visit_order} — {c.full_name}</p>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={getLocation} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm transition">
              {gettingLocation ? <span className="text-gray-400">Obteniendo...</span>
                : clientForm.watch('latitude') ? <span className="text-green-400">✅ Ubicación capturada</span>
                : <span className="text-gray-400">📍 Capturar ubicación</span>}
            </button>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition">
              Continuar → Fotos
            </button>
          </form>
        )}

        {/* Paso 2 — Fotos */}
        {step === 1 && (
          <div className="space-y-4">
            {[
              { type: 'front' as const, label: 'Documento — Frente', state: photoDocFront, icon: '📄' },
              { type: 'back' as const, label: 'Documento — Reverso', state: photoDocBack, icon: '📄' },
              { type: 'place' as const, label: 'Negocio / Casa', state: photoPlace, icon: '🏠' },
            ].map((photo) => (
              <div key={photo.type}>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">{photo.label}</label>
                <label className={`block w-full rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition ${photo.state ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700'}`}>
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => handlePhotoUpload(e, photo.type)} />
                  {photo.state ? (
                    <div>
                      <img src={photo.state} alt={photo.label} className="w-full h-28 object-cover rounded-xl mb-2" />
                      <p className="text-green-400 text-xs">✅ Subida — toca para cambiar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl mb-2">{photo.icon}</p>
                      <p className="text-gray-400 text-sm">Toca para tomar foto</p>
                    </div>
                  )}
                </label>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(0)} className="flex-1 bg-gray-800 text-gray-300 font-semibold py-3 rounded-xl transition text-sm">← Atrás</button>
              <button
                onClick={() => {
                  if (!photoDocFront || !photoDocBack || !photoPlace) { setError('Debes subir las 3 fotos.'); return }
                  setError(null)
                  clientForm.handleSubmit(onSubmitClient)()
                }}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm"
              >
                {isLoading ? 'Guardando...' : 'Continuar → Crédito'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 — Crédito */}
        {step === 2 && (
          <form onSubmit={creditForm.handleSubmit(onSubmitCredit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'DAILY', label: 'Diario' },
                { value: 'WEEKLY', label: 'Semanal' },
                { value: 'MONTHLY', label: 'Mensual' },
              ].map((f) => (
                <label key={f.value} className="cursor-pointer">
                  <input {...creditForm.register('frequency')} type="radio" value={f.value} className="sr-only peer" />
                  <div className="bg-gray-800 peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 border border-gray-700 rounded-xl p-3 text-center transition">
                    <p className="font-semibold text-sm">{f.label}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Inicio</label>
                <input {...creditForm.register('start_date')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Fin estimado</label>
                <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-indigo-400 text-sm">{calculateEndDate()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Capital</label>
                <input {...creditForm.register('principal', { valueAsNumber: true })} type="number" min="1" placeholder="0" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Interés (%)</label>
                <input {...creditForm.register('interest_rate', { valueAsNumber: true })} type="number" min="0" max="100" step="0.5" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">Número de cuotas</label>
              <input {...creditForm.register('installments', { valueAsNumber: true })} type="number" min="1" placeholder="24" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {totalAmount > 0 && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wide mb-2">Resumen</p>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Total a pagar</span><span className="text-indigo-400 font-bold text-sm">{totalAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Cuota {watchFrequency === 'DAILY' ? 'diaria' : watchFrequency === 'WEEKLY' ? 'semanal' : 'mensual'}</span><span className="text-green-400 font-bold text-sm">{installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Fecha fin</span><span className="text-white text-sm">{calculateEndDate()}</span></div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push(`/cobrador/cliente/${createdClientId}`)} className="flex-1 bg-gray-800 text-gray-300 font-semibold py-3 rounded-xl text-sm">Omitir</button>
              <button type="submit" disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm">
                {isLoading ? 'Guardando...' : 'Crear crédito'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}