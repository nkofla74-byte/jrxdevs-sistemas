'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmAction from '@/components/shared/ConfirmAction'
import { toggleRouteStatus, deleteRoute, resetRouteDevice } from '@/modules/routes/actions'
import { createClient } from '@/lib/supabase/client'

export default function RutaActions({ route }: { route: any }) {
  const router = useRouter()
  const [activeCredits, setActiveCredits] = useState<number>(0)
  const [activeClients, setActiveClients] = useState<number>(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('check_active_credits_before_delete', { route_id_param: route.id })
      .then(({ data }) => {
        if (data) {
          setActiveCredits(data.active_credits)
          setActiveClients(data.active_clients)
        }
      })
  }, [route.id])

  const hasActiveData = activeCredits > 0 || activeClients > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Advertencia si tiene datos activos */}
      {hasActiveData && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span>
          <p style={{ color: 'var(--warning)', fontSize: 12 }}>
            Esta ruta tiene {activeCredits} crédito{activeCredits !== 1 ? 's' : ''} activo{activeCredits !== 1 ? 's' : ''} y {activeClients} cliente{activeClients !== 1 ? 's' : ''} activo{activeClients !== 1 ? 's' : ''}.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <ConfirmAction
          confirmColor={route.status === 'active' ? 'warning' : 'success'}
          title={route.status === 'active' ? 'Desactivar ruta' : 'Activar ruta'}
          description={route.status === 'active'
            ? `¿Confirmas que deseas desactivar "${route.name}"? El cobrador perderá acceso inmediatamente.${hasActiveData ? ` ⚠️ Esta ruta tiene ${activeCredits} créditos activos que no podrán ser cobrados.` : ''}`
            : `¿Confirmas que deseas activar "${route.name}"? El cobrador podrá volver a acceder.`
          }
          confirmLabel={route.status === 'active' ? '⏸️ Sí, desactivar' : '▶️ Sí, activar'}
          trigger={
            <button style={{
              flex: 1,
              background: route.status === 'active'
                ? 'var(--bg-secondary)'
                : 'rgba(16,185,129,0.1)',
              border: `1px solid ${route.status === 'active'
                ? 'var(--border)'
                : 'rgba(16,185,129,0.2)'}`,
              borderRadius: 12, padding: '10px 16px',
              color: route.status === 'active'
                ? 'var(--text-muted)'
                : 'var(--success)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {route.status === 'active' ? '⏸️ Desactivar' : '▶️ Activar'}
            </button>
          }
          onConfirm={async () => {
            await toggleRouteStatus(route.id, route.status)
            router.refresh()
          }}
        />

        <ConfirmAction
          confirmColor="danger"
          title="Eliminar ruta"
          description={hasActiveData
            ? `⚠️ ATENCIÓN: Esta ruta tiene ${activeCredits} créditos activos y ${activeClients} clientes activos. Al eliminarla el cobrador perderá acceso pero los datos se conservan. ¿Confirmas?`
            : `¿Confirmas que deseas eliminar "${route.name}"? Los datos se conservan permanentemente.`
          }
          confirmLabel="🗑️ Sí, eliminar"
          trigger={
            <button style={{
              background: 'var(--danger-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '10px 16px',
              color: 'var(--danger)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              🗑️ Eliminar
            </button>
          }
          onConfirm={async () => {
            await deleteRoute(route.id)
            router.refresh()
          }}
        />
      </div>

      {/* Autorizar dispositivo */}
      <ConfirmAction
        confirmColor="warning"
        title="Autorizar nuevo dispositivo"
        description={`Al confirmar, el cobrador de "${route.name}" podrá iniciar sesión desde cualquier dispositivo nuevo.`}
        confirmLabel="📱 Sí, autorizar"
        trigger={
          <button style={{
            width: '100%',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: '10px 0',
            color: 'var(--warning)', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}>
            📱 Autorizar inicio desde nuevo dispositivo
          </button>
        }
        onConfirm={async () => {
          await resetRouteDevice(route.id)
          router.refresh()
        }}
      />
    </div>
  )
}
