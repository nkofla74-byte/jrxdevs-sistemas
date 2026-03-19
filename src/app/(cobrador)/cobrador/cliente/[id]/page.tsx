import { createClient } from '@/lib/supabase/server'
import { getClientById } from '@/modules/clients/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PaymentForm from '@/components/shared/PaymentForm'
import RefinanceForm from '@/components/cobrador/RefinanceForm'

const creditStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  CURRENT: 'bg-green-500/10 text-green-400 border-green-500/20',
  WATCH: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  WARNING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  REFINANCED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  WRITTEN_OFF: 'bg-gray-500/10 text-gray-500 border-gray-600/20',
}

const creditStatusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  CURRENT: 'Al dia',
  WATCH: 'Atencion',
  WARNING: 'Advertencia',
  CRITICAL: 'Critico',
  CLOSED: 'Cerrado',
  REFINANCED: 'Refinanciado',
  WRITTEN_OFF: 'Incobrable',
}

export default async function CobradorClientePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client, error } = await getClientById(params.id)
  if (error || !client) redirect('/cobrador')

  const c = client as any

  const activeCredits = c.credits?.filter((cr: any) =>
    ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(cr.status)
  ) ?? []

  const closedCredits = c.credits?.filter((cr: any) =>
    ['CLOSED', 'WRITTEN_OFF', 'REFINANCED'].includes(cr.status)
  ) ?? []

  const today = new Date().toISOString().split('T')[0]
  const { data: todayPayment } = await supabase
    .from('payments')
    .select('id, amount')
    .eq('client_id', params.id)
    .eq('payment_date', today)
    .is('deleted_at', null)
    .single()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cobrador" className="text-gray-400 text-sm">← Atras</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold text-sm">{c.full_name}</span>
          </div>
          {todayPayment && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
              Pago hoy
            </span>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4 pb-8">

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-lg">
                {c.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-white">{c.full_name}</p>
              <p className="text-gray-400 text-sm">Doc: {c.document_number}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href={`https://wa.me/${c.phone}`} target="_blank" className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-green-400 text-xs font-semibold">WhatsApp</p>
              <p className="text-green-400 text-xs mt-0.5">{c.phone}</p>
            </a>
            {c.latitude && c.longitude && (
              <a href={`https://maps.google.com?q=${c.latitude},${c.longitude}`} target="_blank" className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center">
                <p className="text-indigo-400 text-xs font-semibold">Ver en mapa</p>
                <p className="text-indigo-400 text-xs mt-0.5">Google Maps</p>
              </a>
            )}
          </div>
        </div>

        {(c.photo_doc_front || c.photo_doc_back || c.photo_place) && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Documentos</p>
            <div className="grid grid-cols-3 gap-2">
              {c.photo_doc_front && (
                <a href={c.photo_doc_front} target="_blank">
                  <img src={c.photo_doc_front} alt="Doc frente" className="w-full h-20 object-cover rounded-xl" />
                </a>
              )}
              {c.photo_doc_back && (
                <a href={c.photo_doc_back} target="_blank">
                  <img src={c.photo_doc_back} alt="Doc reverso" className="w-full h-20 object-cover rounded-xl" />
                </a>
              )}
              {c.photo_place && (
                <a href={c.photo_place} target="_blank">
                  <img src={c.photo_place} alt="Negocio" className="w-full h-20 object-cover rounded-xl" />
                </a>
              )}
            </div>
          </div>
        )}

        {activeCredits.map((credit: any) => (
          <div key={credit.id} className="space-y-3">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-white text-sm">Credito activo</p>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${creditStatusColors[credit.status]}`}>
                  {creditStatusLabels[credit.status]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Capital</p>
                  <p className="text-white font-bold text-sm">{Number(credit.principal).toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Cuota</p>
                  <p className="text-indigo-400 font-bold text-sm">{Number(credit.installment_amount).toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Progreso</p>
                  <p className="text-white font-bold text-sm">{credit.paid_installments}/{credit.installments}</p>
                </div>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min((credit.paid_installments / credit.installments) * 100, 100)}%` }} />
              </div>
              {todayPayment && (
                <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-sm font-semibold">
                    Pago de hoy: {Number(todayPayment.amount).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <PaymentForm
              creditId={credit.id}
              clientId={c.id}
              routeId={c.route_id}
              installmentAmount={Number(credit.installment_amount)}
            />

            {credit.status === 'CRITICAL' && credit.refinance_count < 3 && (
              <RefinanceForm
                credit={credit}
                clientId={c.id}
                routeId={c.route_id}
              />
            )}
          </div>
        ))}

        {activeCredits.length === 0 && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-gray-400 text-sm mb-4">No tiene creditos activos.</p>
            <Link href={`/cobrador/nuevo-credito?cliente=${c.id}`} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
              + Nuevo credito
            </Link>
          </div>
        )}

        {closedCredits.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
              Historial ({closedCredits.length})
            </p>
            <div className="space-y-2">
              {closedCredits.map((credit: any) => (
                <div key={credit.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${creditStatusColors[credit.status]}`}>
                    {creditStatusLabels[credit.status]}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {Number(credit.principal).toLocaleString()} · {new Date(credit.created_at).toLocaleDateString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
