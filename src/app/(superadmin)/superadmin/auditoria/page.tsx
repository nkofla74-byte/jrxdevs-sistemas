import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/shared/PageHeader'

const actionColors: Record<string, { bg: string; color: string; border: string }> = {
  LOGIN_EXITOSO: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  LOGIN_FALLIDO: { bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'rgba(239,68,68,0.2)' },
  LOGOUT: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', border: 'var(--border)' },
  SESION_BLOQUEADA: { bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'rgba(239,68,68,0.2)' },
  OFICINA_CREADA: { bg: 'rgba(139,92,246,0.1)', color: 'var(--neon-bright)', border: 'rgba(139,92,246,0.2)' },
  OFICINA_CONGELADA: { bg: 'rgba(99,102,241,0.1)', color: 'var(--info)', border: 'rgba(99,102,241,0.2)' },
  OFICINA_ACTIVADA: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)' },
  OFICINA_ELIMINADA: { bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'rgba(239,68,68,0.2)' },
  RUTA_CREADA: { bg: 'rgba(139,92,246,0.1)', color: 'var(--neon-bright)', border: 'rgba(139,92,246,0.2)' },
  RUTA_ELIMINADA: { bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'rgba(239,68,68,0.2)' },
  ADMIN_CREADO: { bg: 'rgba(139,92,246,0.1)', color: 'var(--neon-bright)', border: 'rgba(139,92,246,0.2)' },
  PAGO_REGISTRADO: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)' },
  PAGO_EDITADO: { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
  CREDITO_CREADO: { bg: 'rgba(139,92,246,0.1)', color: 'var(--neon-bright)', border: 'rgba(139,92,246,0.2)' },
  CREDITO_ELIMINADO: { bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'rgba(239,68,68,0.2)' },
  CAPITAL_INYECTADO: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)' },
  CAPITAL_RETIRADO: { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString))
}

export default async function AuditoriaPage() {
  const supabase = createClient()

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*, user:users(id, full_name, email, role)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Auditoría"
        backHref="/superadmin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Auditoría</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Últimas 100 acciones del sistema
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          }}>
            <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
          </div>
        )}

        {logs && logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log: any) => {
              const colors = actionColors[log.action] ?? {
                bg: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                border: 'var(--border)',
              }
              return (
                <div key={log.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16, padding: 14,
                }}>
                  <div className="flex items-start justify-between gap-3" style={{ marginBottom: 8 }}>
                    <span style={{
                      background: colors.bg,
                      color: colors.color,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 99, padding: '3px 10px',
                      fontSize: 11, fontWeight: 700,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {log.action}
                    </span>
                    <p style={{
                      color: 'var(--text-muted)', fontSize: 11,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                    {log.user?.full_name ?? 'Sistema'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {log.user?.email}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                    {log.entity} · {log.entity_id?.substring(0, 8)}...
                  </p>
                  {log.data_after && (
                    <p style={{
                      color: 'var(--text-muted)', fontSize: 11,
                      fontFamily: 'DM Mono', marginTop: 6,
                      background: 'var(--bg-secondary)',
                      borderRadius: 8, padding: '6px 10px',
                      wordBreak: 'break-all',
                    }}>
                      {JSON.stringify(log.data_after).substring(0, 100)}
                      {JSON.stringify(log.data_after).length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              No hay registros de auditoría todavía.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
