'use client'

import { useRouter } from 'next/navigation'
import ConfirmAction from '@/components/shared/ConfirmAction'
import { freezeOffice, activateOffice, deleteOffice } from '@/modules/offices/actions'

export default function OficinaActions({ office }: { office: any }) {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {office.status === 'active' && (
        <ConfirmAction
          confirmColor="warning"
          title="Congelar oficina"
          description={`¿Confirmas que deseas congelar "${office.name}"? El administrador y todos los cobradores perderán acceso inmediatamente hasta que se reactive.`}
          confirmLabel="❄️ Sí, congelar"
          trigger={
            <button style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12, padding: '10px 16px',
              color: 'var(--info)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              ❄️ Congelar por falta de pago
            </button>
          }
          onConfirm={async () => {
            await freezeOffice(office.id)
            router.refresh()
          }}
        />
      )}

      {office.status === 'frozen' && (
        <ConfirmAction
          confirmColor="success"
          title="Reactivar oficina"
          description={`¿Confirmas que deseas reactivar "${office.name}"? El administrador y cobradores podrán acceder nuevamente.`}
          confirmLabel="✅ Sí, reactivar"
          trigger={
            <button style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12, padding: '10px 16px',
              color: 'var(--success)', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              ✅ Reactivar — pago recibido
            </button>
          }
          onConfirm={async () => {
            await activateOffice(office.id)
            router.refresh()
          }}
        />
      )}

      <ConfirmAction
        confirmColor="danger"
        title="Eliminar oficina"
        description={`¿Confirmas que deseas eliminar "${office.name}"? Esta acción desactivará la oficina permanentemente. Los datos se conservan pero nadie podrá acceder.`}
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
          await deleteOffice(office.id)
          router.refresh()
        }}
      />
    </div>
  )
}
