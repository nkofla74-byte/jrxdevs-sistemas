'use client'

import { useState } from 'react'

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

const countryFlags: Record<string, string> = {
  CO: '🇨🇴', PE: '🇵🇪', EC: '🇪🇨', BR: '🇧🇷',
}

export default function ReportesClient({
  tenants, monthPayments, credits, clients, routes,
}: {
  tenants: any[]
  monthPayments: any[]
  credits: any[]
  clients: any[]
  routes: any[]
}) {
  const [selectedTenant, setSelectedTenant] = useState<string>('all')

  // Calcular métricas por oficina
  const officeReports = tenants.map((tenant) => {
    const tenantPayments = monthPayments.filter((p) => p.tenant_id === tenant.id)
    const tenantCredits = credits.filter((c) => c.tenant_id === tenant.id)
    const tenantClients = clients.filter((c) => c.tenant_id === tenant.id)
    const tenantRoutes = routes.filter((r) => r.tenant_id === tenant.id)

    const collectedMonth = tenantPayments.reduce((s, p) => s + Number(p.amount), 0)
    const activeCredits = tenantCredits.filter((c) =>
      ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
    )
    const totalInStreet = activeCredits.reduce((s, c) => {
      return s + (c.installments - c.paid_installments) * Number(c.installment_amount ?? 0)
    }, 0)
    const activeClients = tenantClients.filter((c) => c.status === 'ACTIVE').length
    const criticalCredits = tenantCredits.filter((c) => c.status === 'CRITICAL').length
    const totalCapital = tenantRoutes.reduce((s, r) => s + Number(r.capital_injected), 0)

    return {
      ...tenant,
      collectedMonth,
      totalInStreet,
      activeClients,
      criticalCredits,
      totalCapital,
      totalCredits: tenantCredits.length,
      activeCreditsCount: activeCredits.length,
      routesCount: tenantRoutes.length,
    }
  })

  const filteredReports = selectedTenant === 'all'
    ? officeReports
    : officeReports.filter((o) => o.id === selectedTenant)

  // Totales globales
  const totals = filteredReports.reduce((acc, o) => ({
    collectedMonth: acc.collectedMonth + o.collectedMonth,
    totalInStreet: acc.totalInStreet + o.totalInStreet,
    activeClients: acc.activeClients + o.activeClients,
    criticalCredits: acc.criticalCredits + o.criticalCredits,
    totalCapital: acc.totalCapital + o.totalCapital,
  }), { collectedMonth: 0, totalInStreet: 0, activeClients: 0, criticalCredits: 0, totalCapital: 0 })

  // Exportar CSV
  function exportCSV() {
    const headers = ['Oficina', 'País', 'Estado', 'Rutas', 'Clientes activos', 'Capital total', 'Dinero en calle', 'Cobrado este mes', 'Créditos críticos']
    const rows = filteredReports.map((o) => [
      o.name, o.country, o.status,
      o.routesCount, o.activeClients,
      o.totalCapital, o.totalInStreet,
      o.collectedMonth, o.criticalCredits,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_jrxdevs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Exportar JSON
  function exportJSON() {
    const data = {
      generated_at: new Date().toISOString(),
      period: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      totals,
      offices: filteredReports,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_jrxdevs_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Filtros y exportar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20, padding: 16,
        display: 'flex', gap: 12, flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          style={{
            flex: 1, minWidth: 150,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 14px',
            color: 'var(--text-primary)', fontSize: 14,
            outline: 'none',
          }}
        >
          <option value="all">Todas las oficinas</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <button onClick={exportCSV} style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12, padding: '10px 16px',
          color: 'var(--success)', fontSize: 13,
          fontWeight: 700, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          📊 Exportar CSV
        </button>

        <button onClick={exportJSON} style={{
          background: 'rgba(139,92,246,0.1)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 12, padding: '10px 16px',
          color: 'var(--neon-bright)', fontSize: 13,
          fontWeight: 700, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          📁 Exportar JSON
        </button>
      </div>

      {/* Totales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {[
          { label: 'Cobrado este mes', value: fmt(totals.collectedMonth), color: 'var(--success)', icon: '📥' },
          { label: 'Dinero en calle', value: fmt(totals.totalInStreet), color: 'var(--neon-bright)', icon: '💰' },
          { label: 'Capital total', value: fmt(totals.totalCapital), color: 'var(--warning)', icon: '🏦' },
          { label: 'Clientes activos', value: fmt(totals.activeClients), color: 'var(--text-primary)', icon: '👥' },
          { label: 'Créditos críticos', value: fmt(totals.criticalCredits), color: totals.criticalCredits > 0 ? 'var(--danger)' : 'var(--text-muted)', icon: '🔴' },
        ].map((m) => (
          <div key={m.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: 14,
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{m.label}</p>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
            </div>
            <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 18, color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Detalle por oficina */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20, padding: 20,
      }}>
        <p style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 15,
          color: 'var(--text-primary)', marginBottom: 16,
        }}>
          Detalle por oficina
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredReports.map((office) => (
            <div key={office.id} style={{
              background: 'var(--bg-secondary)',
              borderRadius: 16, padding: 16,
              border: office.criticalCredits > 0
                ? '1px solid rgba(239,68,68,0.2)'
                : '1px solid transparent',
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                    {countryFlags[office.country]} {office.name}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {office.routesCount} rutas · {office.activeClients} clientes
                  </p>
                </div>
                <span style={{
                  background: office.status === 'active'
                    ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                  color: office.status === 'active' ? 'var(--success)' : 'var(--info)',
                  border: `1px solid ${office.status === 'active'
                    ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 99, padding: '3px 10px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {office.status === 'active' ? 'Activa' : 'Congelada'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Cobrado mes', value: fmt(office.collectedMonth), color: 'var(--success)' },
                  { label: 'En calle', value: fmt(office.totalInStreet), color: 'var(--neon-bright)' },
                  { label: 'Capital', value: fmt(office.totalCapital), color: 'var(--warning)' },
                  { label: 'Críticos', value: String(office.criticalCredits), color: office.criticalCredits > 0 ? 'var(--danger)' : 'var(--text-muted)' },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12, padding: '10px 12px',
                  }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 15, color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
