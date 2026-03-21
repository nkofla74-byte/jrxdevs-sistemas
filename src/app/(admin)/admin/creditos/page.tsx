import { createClient } from '@/lib/supabase/server'
import { getCreditsByOffice } from '@/modules/credits/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import RouteFilter from '@/components/shared/RouteFilter'

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  ACTIVE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  CURRENT: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  WATCH: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  WARNING: { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.2)' },
  CRITICAL: { bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'rgba(239,68,68,0.2)' },
  CLOSED: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', border: 'var(--border)' },
  REFINANCED: { bg: 'rgba(99,102,241,0.1)', color: 'var(--info)', border: 'rgba(99,102,241,0.2)' },
  WRITTEN_OFF: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', border: 'var(--border)' },
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo', CURRENT: 'Al día', WATCH: '🟡 Atención',
  WARNING: '🟠 Advertencia', CRITICAL: '🔴 Crítico',
  CLOSED: 'Cerrado', REFINANCED: 'Refinanciado', WRITTEN_OFF: 'Incobrable',
}

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diario', WEEKLY: 'Semanal', MONTHLY: 'Mensual',
}

export default async function CreditosPage({
  searchParams,
}: {
  searchParams: { ruta?: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) redirect('/admin')

  const { data: credits, error } = await getCreditsByOffice(
    userData.tenant_id,
    searchParams.ruta
  )

  const { data: routes } = await supabase
    .from('routes')
    .select('id, name')
    .eq('tenant_id', userData.tenant_id)
    .is('deleted_at', null)
    .eq('status', 'active')

  const criticalCount = credits?.filter((c: any) => c.status === 'CRITICAL').length ?? 0
  const activeCount = credits?.filter((c: any) =>
    ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
  ).length ?? 0

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <PageHeader
        title="Créditos"
        backHref="/admin"
        backLabel="← Inicio"
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
              color: 'var(--text-primary)', marginBottom: 4,
            }}>Créditos</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {activeCount} activos
              {criticalCount > 0 && (
                <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                  · 🔴 {criticalCount} críticos
                </span>
              )}
            </p>
          </div>
          <RouteFilter
            routes={routes ?? []}
            currentRoute={searchParams.ruta}
            basePath="/admin/creditos"
          />
        </div>

        {criticalCount > 0 && (
          <div style={{
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: '14px 18px',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>🔴</span>
            <p style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 14 }}>
              {criticalCount} crédito{criticalCount > 1 ? 's' : ''} en estado crítico — 6+ días sin pagar
            </p>
          </div>
        )}

        {credits && credits.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {credits.map((credit: any) => {
              const colors = statusColors[credit.status] ?? statusColors.CLOSED
              return (
                <Link key={credit.id} href={`/admin/creditos/${credit.id}`}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 18, padding: 16,
                    textDecoration: 'none', display: 'block',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: 'var(--gradient-primary)',
                        boxShadow: '0 0 8px var(--neon-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: 'white' }}>
                          {credit.client?.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontWeight: 700, fontSize: 14, color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {credit.client?.full_name}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {credit.route?.name} · {frequencyLabels[credit.frequency]}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      background: colors.bg, color: colors.color,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 99, padding: '3px 10px',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {statusLabels[credit.status]}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                  }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 10 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Capital</p>
                      <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {Number(credit.principal).toFixed(0)}
                      </p>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 10 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Cuota</p>
                      <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--neon-bright)' }}>
                        {Number(credit.installment_amount).toFixed(0)}
                      </p>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 10 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Progreso</p>
                      <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {credit.paid_installments}/{credit.installments}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 99, height: 6,
                    marginTop: 10, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: 6, borderRadius: 99,
                      width: `${Math.min((credit.paid_installments / credit.installments) * 100, 100)}%`,
                      background: 'var(--gradient-primary)',
                      boxShadow: '0 0 8px var(--neon-glow)',
                    }} />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>💳</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              No hay créditos registrados.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
