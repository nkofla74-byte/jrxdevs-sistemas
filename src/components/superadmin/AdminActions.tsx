'use client'

import { useRouter } from 'next/navigation'
import ConfirmAction from '@/components/shared/ConfirmAction'
import { toggleAdminStatus, deleteAdmin, resetDeviceBinding } from '@/modules/auth/admin-actions'

export default function AdminActions({ admin }: { admin: any }) {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <ConfirmAction
          confirmColor={admin.status === 'active' ? 'danger' : 'success'}
          title={admin.status === 'active' ? 'Bloquear administrador' : 'Activar administrador'}
          description={admin.status === 'active'
            ? `¿Confirmas que deseas bloquear a "${admin.full_name}"? No podrá acceder a su panel hasta que lo reactives.`
            : `¿Confirmas que deseas activar a "${admin.full_name}"? Podrá volver a acceder a su panel.`
          }
          confirmLabel={admin.status === 'active' ? '🔒 Sí, bloquear' : '🔓 Sí, activar'}
          trigger={
            <button style={{
              flex: 1,
              background: admin.status === 'active'
                ? 'var(--danger-dim)'
                : 'rgba(16,185,129,0.1)',
              border: `1px solid ${admin.status === 'active'
                ? 'rgba(239,68,68,0.2)'
                : 'rgba(16,185,129,0.2)'}`,
              borderRadius: 12, padding: '10px 0',
              color: admin.status === 'active'
                ? 'var(--danger)'
                : 'var(--success)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', width: '100%',
            }}>
              {admin.status === 'active' ? '🔒 Bloquear' : '🔓 Activar'}
            </button>
          }
          onConfirm={async () => {
            await toggleAdminStatus(admin.id, admin.status)
            router.refresh()
          }}
        />

        <ConfirmAction
          confirmColor="danger"
          title="Eliminar administrador"
          description={`¿Confirmas que deseas eliminar a "${admin.full_name}"? Perderá acceso permanentemente al sistema.`}
          confirmLabel="🗑️ Sí, eliminar"
          trigger={
            <button style={{
              background: 'var(--danger-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '10px 14px',
              color: 'var(--danger)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              🗑️ Eliminar
            </button>
          }
          onConfirm={async () => {
            await deleteAdmin(admin.id)
            router.refresh()
          }}
        />
      </div>

      {/* Resetear dispositivo */}
      <ConfirmAction
        confirmColor="warning"
        title="Autorizar nuevo dispositivo"
        description={`Al confirmar, "${admin.full_name}" podrá iniciar sesión desde cualquier dispositivo nuevo. Úsalo cuando cambie de equipo.`}
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
          await resetDeviceBinding(admin.id)
          router.refresh()
        }}
      />
    </div>
  )
}