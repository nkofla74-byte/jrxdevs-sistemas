import { getCreditById } from '@/modules/credits/actions'
import { getPaymentsByCredit } from '@/modules/payments/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PaymentForm from '@/components/shared/PaymentForm'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  CURRENT: 'bg-green-500/10 text-green-400 border-green-500/20',
  WATCH: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  WARNING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  REFINANCED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  WRITTEN_OFF: 'bg-gray-500/10 text-gray-500 border-gray-600/20',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  CURRENT: 'Al día',
  WATCH: 'Atención',
  WARNING: 'Advertencia',
  CRITICAL: 'Crítico',
  CLOSED: 'Cerrado',
  REFINANCED: 'Refinanciado',
  WRITTEN_OFF: 'Incobrable',
}

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
}

export default async function CreditoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: credit, error } = await getCreditById(params.id)
  if (error || !credit) redirect('/admin/creditos')

  const { data: payments } = await getPaymentsByCredit(params.id)

  const c = credit as any
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0
  const remaining = Number(c.total_amount) - totalPaid
  const progress = Math.min((c.paid_installments / c.installments) * 100, 100)
  const isActive = ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/creditos" className="text-gray-400 hover:text-white transition text-sm">
              ← Créditos
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">{c.client?.full_name}</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[c.status]}`}>
            {statusLabels[c.status]}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Info del crédito */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Detalle del crédito</h2>
            <Link
              href={`/admin/clientes/${c.client?.id}`}
              className="text-xs text-indigo-400 hover:underline"
            >
              Ver cliente →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Cliente</p>
              <p className="text-white font-medium">{c.client?.full_name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Frecuencia</p>
              <p className="text-white font-medium">{frequencyLabels[c.frequency]}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Capital prestado</p>
              <p className="text-white font-medium">{Number(c.principal).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Interés</p>
              <p className="text-white font-medium">{c.interest_rate}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Total a pagar</p>
              <p className="text-white font-medium">{Number(c.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Cuota</p>
              <p className="text-white font-medium">{Number(c.installment_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Fecha inicio</p>
              <p className="text-white font-medium">
                {new Date(c.start_date).toLocaleDateString('es-CO')}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Fecha fin</p>
              <p className="text-white font-medium">
                {c.end_date ? new Date(c.end_date).toLocaleDateString('es-CO') : '—'}
              </p>
            </div>
          </div>

          {/* Progreso */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs">Progreso</p>
              <p className="text-white text-xs font-semibold">
                {c.paid_installments}/{c.installments} cuotas ({Math.round(progress)}%)
              </p>
            </div>
            <div className="bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-gray-500 text-xs">Pagado: {totalPaid.toLocaleString()}</p>
              <p className="text-yellow-400 text-xs">Pendiente: {remaining.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Registrar pago */}
        {isActive && (
          <PaymentForm
            creditId={c.id}
            clientId={c.client?.id}
            routeId={c.client?.route_id}
            installmentAmount={Number(c.installment_amount)}
          />
        )}

        {/* Historial de pagos */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">
            Historial de pagos ({payments?.length ?? 0})
          </h2>

          {payments && payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {Number(payment.amount).toLocaleString()}
                    </p>
                    {payment.notes && (
                      <p className="text-gray-500 text-xs">{payment.notes}</p>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {new Date(payment.payment_date).toLocaleDateString('es-CO')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay pagos registrados todavía.</p>
          )}
        </div>

      </div>
    </main>
  )
}