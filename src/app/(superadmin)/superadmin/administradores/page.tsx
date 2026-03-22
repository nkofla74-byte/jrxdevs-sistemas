import { getAllAdmins } from '@/modules/auth/admin-actions'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import AdminActions from '@/components/superadmin/AdminActions'

const countryFlags: Record<string, string> = {
  CO: '🇨🇴', PE: '🇵🇪', EC: '🇪🇨', BR: '🇧🇷',
}

export default async function AdministradoresPage() {
  const { data: admins, error } = await getAllAdmins()

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Administradores"
        backHref="/superadmin"
        backLabel="← Inicio"
        action={{ label: '+ Nuevo', href: '/superadmin/administradores/nuevo' }}
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>
            Administradores
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {admins?.length ?? 0} administradores registrados
          </p>
        </div>

        {/* Leyenda */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16, padding: 14,
          marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <p style={{
            color: 'var(--text-muted)', fontSize: 11,
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 4,
          }}>
            Guía de estados
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            ✅ <strong style={{ color: 'var(--success)' }}>Activo</strong> — Puede acceder a su panel normalmente
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            🔒 <strong style={{ color: 'var(--danger)' }}>Bloqueado</strong> — No puede entrar al sistema. Sus datos se conservan.
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

        {admins && admins.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {admins.map((admin: any) => (
              <div key={admin.id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${admin.status === 'blocked' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                borderRadius: 20, padding: 16,
              }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: admin.status === 'blocked'
                      ? 'var(--danger-dim)'
                      : 'var(--gradient-primary)',
                    boxShadow: admin.status === 'blocked'
                      ? 'none'
                      : '0 0 10px var(--neon-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white' }}>
                      {admin.status === 'blocked' ? '🔒' : admin.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 700, fontSize: 15,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {admin.full_name}
                    </p>
                    <p style={{
                      color: 'var(--text-muted)', fontSize: 12,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {admin.email}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      {admin.tenant
                        ? `${countryFlags[admin.tenant.country]} ${admin.tenant.name}`
                        : '⚠️ Sin oficina'}
                    </p>
                  </div>
                  <span style={{
                    flexShrink: 0,
                    background: admin.status === 'active'
                      ? 'rgba(16,185,129,0.15)'
                      : 'var(--danger-dim)',
                    color: admin.status === 'active'
                      ? 'var(--success)'
                      : 'var(--danger)',
                    border: `1px solid ${admin.status === 'active'
                      ? 'rgba(16,185,129,0.3)'
                      : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {admin.status === 'active' ? '✅ Activo' : '🔒 Bloqueado'}
                  </span>
                </div>

                <AdminActions admin={admin} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>👨‍💼</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              No hay administradores registrados.
            </p>
            <Link href="/superadmin/administradores/nuevo" style={{
              background: 'var(--gradient-primary)',
              borderRadius: 14, padding: '12px 24px',
              color: 'white', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 12px var(--neon-glow)',
            }}>
              Crear primer administrador
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
