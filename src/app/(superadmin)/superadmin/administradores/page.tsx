import { getAllAdmins } from '@/modules/auth/admin-actions'
import { toggleAdminStatus, deleteAdmin } from '@/modules/auth/admin-actions'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'

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
                border: '1px solid var(--border)',
                borderRadius: 20, padding: 16,
              }}>
                {/* Info del admin */}
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 0 10px var(--neon-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white' }}>
                      {admin.full_name.charAt(0).toUpperCase()}
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
                  {/* Badge estado */}
                  <span style={{
                    flexShrink: 0,
                    background: admin.status === 'active' ? 'rgba(16,185,129,0.15)' : 'var(--danger-dim)',
                    color: admin.status === 'active' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${admin.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {admin.status === 'active' ? 'Activo' : 'Bloqueado'}
                  </span>
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <form action={async () => {
                    'use server'
                    await toggleAdminStatus(admin.id, admin.status)
                  }} style={{ flex: 1 }}>
                    <button type="submit" style={{
                      width: '100%',
                      background: admin.status === 'active' ? 'var(--danger-dim)' : 'var(--success-dim)',
                      border: `1px solid ${admin.status === 'active' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                      borderRadius: 12, padding: '10px 0',
                      color: admin.status === 'active' ? 'var(--danger)' : 'var(--success)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                      {admin.status === 'active' ? 'Bloquear' : 'Activar'}
                    </button>
                  </form>

                  <form action={async () => {
                    'use server'
                    await deleteAdmin(admin.id)
                  }} style={{ flex: 1 }}>
                    <button type="submit" style={{
                      width: '100%',
                      background: 'var(--danger-dim)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 12, padding: '10px 0',
                      color: 'var(--danger)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                      Eliminar
                    </button>
                  </form>
                </div>
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
