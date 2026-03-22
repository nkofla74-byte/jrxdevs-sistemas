import { getOffices } from '@/modules/offices/actions'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import OficinaActions from '@/components/superadmin/OficinaActions'

const countryNames: Record<string, string> = {
  CO: '🇨🇴 Colombia', PE: '🇵🇪 Perú',
  EC: '🇪🇨 Ecuador', BR: '🇧🇷 Brasil',
}

export default async function OficinasPage() {
  const { data: offices, error } = await getOffices()

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Oficinas"
        backHref="/superadmin"
        backLabel="← Inicio"
        action={{ label: '+ Nueva', href: '/superadmin/oficinas/nueva' }}
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Oficinas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {offices?.length ?? 0} oficinas registradas
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
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Guía de estados
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            ✅ <strong style={{ color: 'var(--success)' }}>Activa</strong> — Opera normalmente
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            ❄️ <strong style={{ color: 'var(--info)' }}>Congelada</strong> — Bloqueada por falta de pago. El admin y cobradores no pueden entrar.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            🗑️ <strong style={{ color: 'var(--danger)' }}>Eliminada</strong> — Desactivada permanentemente. Los datos se conservan.
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

        {offices && offices.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {offices.map((office) => (
              <div key={office.id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${office.status === 'frozen' ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                borderRadius: 20, padding: 16,
              }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: office.status === 'frozen'
                      ? 'rgba(99,102,241,0.2)'
                      : 'var(--gradient-primary)',
                    boxShadow: office.status === 'frozen'
                      ? 'none'
                      : '0 0 10px var(--neon-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white' }}>
                      {office.status === 'frozen' ? '❄️' : office.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 700, fontSize: 15, color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {office.name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {countryNames[office.country]} · {office.currency}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      Plan {office.plan === 'monthly' ? 'mensual' : 'trimestral'}
                    </p>
                  </div>
                  <span style={{
                    flexShrink: 0,
                    background: office.status === 'active'
                      ? 'rgba(16,185,129,0.15)'
                      : office.status === 'frozen'
                      ? 'rgba(99,102,241,0.15)'
                      : 'var(--bg-secondary)',
                    color: office.status === 'active'
                      ? 'var(--success)'
                      : office.status === 'frozen'
                      ? 'var(--info)'
                      : 'var(--text-muted)',
                    border: `1px solid ${office.status === 'active'
                      ? 'rgba(16,185,129,0.3)'
                      : office.status === 'frozen'
                      ? 'rgba(99,102,241,0.3)'
                      : 'var(--border)'}`,
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {office.status === 'active' ? '✅ Activa' : office.status === 'frozen' ? '❄️ Congelada' : '⚫ Inactiva'}
                  </span>
                </div>

                <OficinaActions office={office} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏢</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              No hay oficinas registradas.
            </p>
            <Link href="/superadmin/oficinas/nueva" style={{
              background: 'var(--gradient-primary)',
              borderRadius: 14, padding: '12px 24px',
              color: 'white', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 12px var(--neon-glow)',
            }}>
              Crear primera oficina
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
