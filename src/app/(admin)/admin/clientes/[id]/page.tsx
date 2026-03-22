import { getClientById } from '@/modules/clients/actions'
import { deleteClientAction } from '@/modules/clients/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteClientButton from '@/components/admin/DeleteClientButton'

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

export default async function ClienteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: client, error } = await getClientById(params.id)
  if (error || !client) redirect('/admin/clientes')
  const activeCredits = (client as any).credits?.filter((c: any) =>
    ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
  ) ?? []
  const closedCredits = (client as any).credits?.filter((c: any) =>
    ['CLOSED', 'WRITTEN_OFF', 'REFINANCED'].includes(c.status)
  ) ?? []
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/clientes" className="text-gray-400 hover:text-white transition text-sm">
              Atras
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">{(client as any).full_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/creditos/nuevo?cliente=${(client as any).id}`}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition"
            >
              + Nuevo credito
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {(client as any).status === 'BLACKLISTED' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">Cliente marcado como incobrable</p>
              <p className="text-red-400/70 text-xs">Requiere autorizacion manual para nuevo credito</p>
            </div>
          </div>
        )}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Informacion del cliente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Nombre completo</p>
              <p className="text-white font-medium">{(client as any).full_name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Documento</p>
              <p className="text-white font-medium">{(client as any).document_number}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Telefono</p>
              <a href={`https://wa.me/${(client as any).phone}`} target="_blank" className="text-green-400 font-medium hover:underline">
                {(client as any).phone}
              </a>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Direccion</p>
              <p className="text-white font-medium">{(client as any).address}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Ruta</p>
              <p className="text-white font-medium">{(client as any).route?.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Orden de visita</p>
              <p className="text-white font-medium">#{(client as any).visit_order}</p>
            </div>
          </div>
        </div>
        {((client as any).photo_doc_front || (client as any).photo_doc_back || (client as any).photo_place) && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Documentos y fotos</h2>
            <div className="grid grid-cols-3 gap-3">
              {(client as any).photo_doc_front && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Doc. Frente</p>
                  <a href={(client as any).photo_doc_front} target="_blank">
                    <img src={(client as any).photo_doc_front} alt="Documento frontal" className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition" />
                  </a>
                </div>
              )}
              {(client as any).photo_doc_back && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Doc. Reverso</p>
                  <a href={(client as any).photo_doc_back} target="_blank">
                    <img src={(client as any).photo_doc_back} alt="Documento reverso" className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition" />
                  </a>
                </div>
              )}
              {(client as any).photo_place && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Negocio/Casa</p>
                  <a href={(client as any).photo_place} target="_blank">
                    <img src={(client as any).photo_place} alt="Negocio o casa" className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Creditos activos ({activeCredits.length})</h2>
            <Link href={`/admin/creditos/nuevo?cliente=${(client as any).id}`} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition">
              + Nuevo credito
            </Link>
          </div>
          {activeCredits.length > 0 ? (
            <div className="space-y-3">
              {activeCredits.map((credit: any) => (
                <Link key={credit.id} href={`/admin/creditos/${credit.id}`} className="block bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${creditStatusColors[credit.status]}`}>
                      {creditStatusLabels[credit.status]}
                    </span>
                    <span className="text-gray-500 text-xs">{frequencyLabels[credit.frequency]}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-gray-500 text-xs">Capital</p>
                      <p className="text-white font-semibold text-sm">{Number(credit.principal).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Cuota</p>
                      <p className="text-white font-semibold text-sm">{Number(credit.installment_amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Progreso</p>
                      <p className="text-white font-semibold text-sm">{credit.paid_installments}/{credit.installments}</p>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-700 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min((credit.paid_installments / credit.installments) * 100, 100)}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No tiene creditos activos.</p>
          )}
        </div>
        {closedCredits.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Historial ({closedCredits.length})</h2>
            <div className="space-y-2">
              {closedCredits.map((credit: any) => (
                <Link key={credit.id} href={`/admin/creditos/${credit.id}`} className="block bg-gray-800 rounded-xl p-3 hover:bg-gray-700 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${creditStatusColors[credit.status]}`}>
                        {creditStatusLabels[credit.status]}
                      </span>
                      <span className="text-gray-400 text-xs ml-2">Capital: {Number(credit.principal).toLocaleString()}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(credit.created_at).toLocaleDateString('es-CO')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="bg-gray-900 rounded-2xl p-6 border border-red-500/10">
          <h2 className="text-lg font-semibold mb-2 text-red-400">Zona de peligro</h2>
          <p className="text-gray-400 text-sm mb-4">Al eliminar el cliente se conserva todo su historial pero no aparecera en las listas activas.</p>
          <form action={async () => {
            'use server'
            await deleteClientAction(params.id)
            redirect('/admin/clientes')
          }}>
            <button type="submit" className="text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl border border-red-500/20 transition">
              Eliminar cliente
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
