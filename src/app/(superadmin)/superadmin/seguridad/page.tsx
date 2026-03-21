import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { toggleAdminStatus } from '@/modules/auth/admin-actions'

export default async function SeguridadPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Usuarios bloqueados
  const { data: blockedUsers } = await supabase
    .from('users')
    .select('id, full_name, email, role, status, blocked_until, tenant:tenants(name)')
    .eq('status', 'blocked')
    .is('deleted_at', null)

  // Intentos fallidos recientes
  const { data: failedLogins } = await supabase
    .from('audit_logs')
    .select('user_id, created_at, data_after, user:users(full_name, email)')
    .eq('action', 'LOGIN_FALLIDO')
    .order('created_at', { ascending: false })
    .limit(20)

  // Sesiones bloqueadas
  const { data: blockedSessions } = await supabase
    .from('audit_logs')
    .select('user_id, created_at, data_after, user:users(full_name, email)')
    .eq('action', 'SESION_BLOQUEADA')
    .order('created_at', { ascending: false })
    .limit(10)

  // Usuarios con device_id registrado
  const { data: activeUsers } = await supabase
    .from('users')
    .select('id, full_name, email, role, device_id, tenant:tenants(name)')
    .eq('status', 'active')
    .not('device_id', 'is', null)
    .is('deleted_at', null)
    .order('role', { ascending: true })

  // Últimos logins exitosos
  const { data: recentLogins } = await supabase
    .from('audit_logs')
    .select('created_at, user:users(full_name, email, role)')
    .eq('action', 'LOGIN_EXITOSO')
    .order('created_at', { ascending: false })
    .limit(10)

  function formatDate(d: string) {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d))
  }

  const roleLabels: Record<string, string> = {
    superadmin: '👑 Super Admin',
    admin: '🖥️ Admin',
    cobrador: '📱 Cobrador',
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Seguridad"
        backHref="/superadmin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Seguridad</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Control de accesos y actividad sospechosa
          </p>
        </div>

        {/* Resumen */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
        }}>
          {[
            { label: 'Bloqueados', value: blockedUsers?.length ?? 0, color: 'var(--danger)', icon: '🔒' },
            { label: 'Fallos recientes', value: failedLogins?.length ?? 0, color: 'var(--warning)', icon: '⚠️' },
            { label: 'Dispositivos', value: activeUsers?.length ?? 0, color: 'var(--neon-bright)', icon: '📱' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: 14, textAlign: 'center',
            }}>
              <p style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</p>
              <p style={{ fontFamily: 'DM Mono', fontWeight: 800, fontSize: 26, color: s.color }}>
                {s.value}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Usuarios bloqueados */}
        {(blockedUsers?.length ?? 0) > 0 && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 20, padding: 20,
          }}>
            <p style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
              color: 'var(--danger)', marginBottom: 16,
            }}>
              🔒 Usuarios bloqueados ({blockedUsers?.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {blockedUsers?.map((u: any) => (
                <div key={u.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 14, padding: '12px 14px',
                }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {u.full_name}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {roleLabels[u.role]} · {u.tenant?.name ?? 'Sin oficina'}
                      </p>
                    </div>
                    <span style={{
                      background: 'var(--danger-dim)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 99, padding: '3px 10px',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      Bloqueado
                    </span>
                  </div>
                  <form action={async () => {
                    'use server'
                    await toggleAdminStatus(u.id, u.status)
                  }}>
                    <button type="submit" style={{
                      width: '100%',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 10, padding: '8px 0',
                      color: 'var(--success)', fontSize: 13,
                      fontWeight: 600, cursor: 'pointer',
                    }}>
                      ✅ Desbloquear usuario
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intentos fallidos */}
        {(failedLogins?.length ?? 0) > 0 && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 20,
          }}>
            <p style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
              color: 'var(--warning)', marginBottom: 16,
            }}>
              ⚠️ Intentos de login fallidos recientes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {failedLogins?.map((log: any, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 12, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {(log.user as any)?.full_name ?? 'Usuario desconocido'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {(log.user as any)?.email}
                    </p>
                  </div>
                  <p style={{ color: 'var(--warning)', fontSize: 11, flexShrink: 0 }}>
                    {formatDate(log.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sesiones bloqueadas */}
        {(blockedSessions?.length ?? 0) > 0 && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 20,
          }}>
            <p style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
              color: 'var(--danger)', marginBottom: 16,
            }}>
              🚫 Sesiones bloqueadas por dispositivo desconocido
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blockedSessions?.map((log: any, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 12, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {(log.user as any)?.full_name ?? 'Usuario desconocido'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {(log.user as any)?.email}
                    </p>
                  </div>
                  <p style={{ color: 'var(--danger)', fontSize: 11, flexShrink: 0 }}>
                    {formatDate(log.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dispositivos registrados */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <p style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            📱 Dispositivos registrados ({activeUsers?.length ?? 0})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeUsers?.map((u: any) => (
              <div key={u.id} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 12, padding: '10px 14px',
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {u.full_name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {roleLabels[u.role]} · {u.tenant?.name ?? 'Sin oficina'}
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(16,185,129,0.1)',
                    color: 'var(--success)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    ✓ Vinculado
                  </span>
                </div>
              </div>
            ))}
            {(activeUsers?.length ?? 0) === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
                No hay dispositivos registrados todavía.
              </p>
            )}
          </div>
        </div>

        {/* Últimos logins */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
        }}>
          <p style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            ✅ Últimos accesos exitosos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentLogins?.map((log: any, i) => (
              <div key={i} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 12, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                    {(log.user as any)?.full_name ?? 'Usuario'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {roleLabels[(log.user as any)?.role] ?? ''}
                  </p>
                </div>
                <p style={{ color: 'var(--success)', fontSize: 11, flexShrink: 0 }}>
                  {formatDate(log.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
