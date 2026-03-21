import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { freezeOffice, activateOffice } from '@/modules/offices/actions'

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

export default async function FacturacionPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Calcular métricas por oficina
  const officeData = await Promise.all(
    (tenants ?? []).map(async (tenant) => {
      const { count: routes } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .is('deleted_at', null)

      const monthlyPrice = (routes ?? 0) * 60
      const quarterlyPrice = (routes ?? 0) * 170

      return {
        ...tenant,
        routes: routes ?? 0,
        monthlyPrice,
        quarterlyPrice,
        currentPrice: tenant.plan === 'monthly' ? monthlyPrice : quarterlyPrice,
      }
    })
  )

  const totalMRR = officeData
    .filter((o) => o.status === 'active')
    .reduce((sum, o) => sum + o.monthlyPrice, 0)

  const countryFlags: Record<string, string> = {
    CO: '🇨🇴', PE: '🇵🇪', EC: '🇪🇨', BR: '🇧🇷',
  }

  const statusColors: Record<string, any> = {
    active: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)', label: 'Activa' },
    frozen: { bg: 'rgba(99,102,241,0.1)', color: 'var(--info)', border: 'rgba(99,102,241,0.2)', label: 'Congelada' },
    inactive: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', border: 'var(--border)', label: 'Inactiva' },
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Facturación"
        backHref="/superadmin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
            color: 'var(--text-primary)', marginBottom: 4,
          }}>Facturación</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Control de planes y pagos de oficinas
          </p>
        </div>

        {/* MRR */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--neon-primary)',
          borderRadius: 20, padding: 20,
          boxShadow: '0 0 20px var(--neon-glow)',
          marginBottom: 20,
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
            💰 Ingreso mensual recurrente (MRR)
          </p>
          <p style={{
            fontFamily: 'DM Mono', fontWeight: 800, fontSize: 36,
            color: 'var(--neon-bright)',
          }}>
            S/ {fmt(totalMRR)}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Basado en {officeData.filter((o) => o.status === 'active').length} oficinas activas
          </p>
        </div>

        {/* Resumen */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: 'Activas', value: officeData.filter((o) => o.status === 'active').length, color: 'var(--success)' },
            { label: 'Congeladas', value: officeData.filter((o) => o.status === 'frozen').length, color: 'var(--info)' },
            { label: 'Inactivas', value: officeData.filter((o) => o.status === 'inactive').length, color: 'var(--text-muted)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: 14, textAlign: 'center',
            }}>
              <p style={{ fontFamily: 'DM Mono', fontWeight: 800, fontSize: 28, color: s.color }}>
                {s.value}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Lista de oficinas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {officeData.map((office) => {
            const sc = statusColors[office.status]
            return (
              <div key={office.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20, padding: 16,
              }}>
                {/* Header */}
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 40, height: 40, borderRadius: 14, flexShrink: 0,
                      background: 'var(--gradient-primary)',
                      boxShadow: '0 0 10px var(--neon-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: 'white' }}>
                        {office.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {countryFlags[office.country]} {office.name}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {office.routes} rutas · Plan {office.plan === 'monthly' ? 'mensual' : 'trimestral'}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    background: sc.bg, color: sc.color,
                    border: `1px solid ${sc.border}`,
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {sc.label}
                  </span>
                </div>

                {/* Precio */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 14, padding: 12,
                  marginBottom: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>
                      Precio mensual
                    </p>
                    <p style={{
                      fontFamily: 'DM Mono', fontWeight: 700,
                      fontSize: 20, color: 'var(--neon-bright)',
                    }}>
                      S/ {fmt(office.monthlyPrice)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>
                      Por ruta
                    </p>
                    <p style={{
                      fontFamily: 'DM Mono', fontWeight: 700,
                      fontSize: 14, color: 'var(--text-secondary)',
                    }}>
                      S/ 60
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {office.status === 'active' ? (
                    <form action={async () => {
                      'use server'
                      await freezeOffice(office.id)
                    }} style={{ flex: 1 }}>
                      <button type="submit" style={{
                        width: '100%',
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 12, padding: '10px 0',
                        color: 'var(--info)', fontSize: 13,
                        fontWeight: 600, cursor: 'pointer',
                      }}>
                        ❄️ Congelar por falta de pago
                      </button>
                    </form>
                  ) : office.status === 'frozen' ? (
                    <form action={async () => {
                      'use server'
                      await activateOffice(office.id)
                    }} style={{ flex: 1 }}>
                      <button type="submit" style={{
                        width: '100%',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: 12, padding: '10px 0',
                        color: 'var(--success)', fontSize: 13,
                        fontWeight: 600, cursor: 'pointer',
                      }}>
                        ✅ Reactivar — pago recibido
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
