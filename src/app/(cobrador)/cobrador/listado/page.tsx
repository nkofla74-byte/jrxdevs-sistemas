import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const creditStatusEmoji: Record<string, string> = {
  ACTIVE: '🟢', CURRENT: '🟢', WATCH: '🟡',
  WARNING: '🟠', CRITICAL: '🔴',
}

export default async function ListadoPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: route } = await supabase
    .from('routes')
    .select('id, name')
    .eq('cobrador_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!route) redirect('/cobrador')

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, full_name, document_number, phone,
      visit_order, status, address,
      credits(id, status, installment_amount, paid_installments, installments, principal)
    `)
    .eq('route_id', route.id)
    .is('deleted_at', null)
    .order('visit_order', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('client_id, amount')
    .eq('route_id', route.id)
    .eq('payment_date', today)
    .is('deleted_at', null)

  const paidClientIds = new Set(todayPayments?.map((p) => p.client_id) ?? [])
  const activeClients = clients?.filter((c) => c.status === 'ACTIVE') ?? []
  const inactiveClients = clients?.filter((c) => c.status !== 'ACTIVE') ?? []

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cobrador" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '8px 14px',
              color: 'var(--text-secondary)', fontSize: 13,
              fontWeight: 600, textDecoration: 'none',
            }}>
              ← Atrás
            </Link>
            <h1 style={{
              fontFamily: 'Syne', fontWeight: 700,
              fontSize: 16, color: 'var(--text-primary)',
            }}>
              Listado general
            </h1>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{route.name}</span>
        </div>
      </header>

      <div style={{ padding: '16px 16px 100px' }}>

        {/* Resumen */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: 'Total', value: clients?.length ?? 0, color: 'var(--text-primary)' },
            { label: 'Pagaron', value: paidClientIds.size, color: 'var(--success)' },
            { label: 'Pendientes', value: activeClients.length - paidClientIds.size, color: 'var(--warning)' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: 14, textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'DM Mono', fontWeight: 800,
                fontSize: 26, color: stat.color,
              }}>
                {stat.value}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Clientes activos */}
        {activeClients.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{
              color: 'var(--text-muted)', fontSize: 11,
              fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              Clientes activos ({activeClients.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeClients.map((client: any) => {
                const activeCredit = client.credits?.find((c: any) =>
                  ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
                )
                const paid = paidClientIds.has(client.id)
                const todayPayment = todayPayments?.find((p) => p.client_id === client.id)

                return (
                  <Link key={client.id} href={`/cobrador/cliente/${client.id}`}
                    style={{
                      background: paid ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
                      border: `1px solid ${paid ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                      borderRadius: 18, padding: '14px 16px',
                      textDecoration: 'none', display: 'block',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 36, height: 36, borderRadius: 12,
                          background: paid ? 'rgba(16,185,129,0.2)' : 'var(--bg-secondary)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 700,
                          fontSize: 14, color: paid ? 'var(--success)' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}>
                          {client.visit_order}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p style={{
                              fontWeight: 600, fontSize: 14,
                              color: paid ? 'var(--success)' : 'var(--text-primary)',
                            }}>
                              {client.full_name}
                            </p>
                            {activeCredit && (
                              <span style={{ fontSize: 12 }}>
                                {creditStatusEmoji[activeCredit.status]}
                              </span>
                            )}
                          </div>
                          {activeCredit && (
                            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              Cuota: {Number(activeCredit.installment_amount).toFixed(0)} · {activeCredit.paid_installments}/{activeCredit.installments}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {paid && todayPayment ? (
                          <div>
                            <p style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700 }}>✓ Pagado</p>
                            <p style={{ fontFamily: 'DM Mono', color: 'var(--success)', fontSize: 13, fontWeight: 700 }}>
                              {Number(todayPayment.amount).toFixed(0)}
                            </p>
                          </div>
                        ) : activeCredit ? (
                          <div>
                            <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 15, color: 'var(--neon-bright)' }}>
                              {Number(activeCredit.installment_amount).toFixed(0)}
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>por cobrar</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Clientes inactivos */}
        {inactiveClients.length > 0 && (
          <div>
            <p style={{
              color: 'var(--text-muted)', fontSize: 11,
              fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              Sin crédito activo ({inactiveClients.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inactiveClients.map((client: any) => (
                <Link key={client.id} href={`/cobrador/cliente/${client.id}`}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 16, padding: '12px 14px',
                    textDecoration: 'none', display: 'block',
                    opacity: 0.7,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 12,
                        color: 'var(--text-muted)', fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {client.visit_order}
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {client.full_name}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          Doc: {client.document_number}
                        </p>
                      </div>
                    </div>
                    {client.status === 'BLACKLISTED' && (
                      <span style={{ color: 'var(--danger)', fontSize: 12 }}>⚠️ Incobrable</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(!clients || clients.length === 0) && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20, padding: 48, textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              No hay clientes en esta ruta.
            </p>
            <Link href="/cobrador/nuevo-cliente" style={{
              background: 'var(--gradient-primary)',
              borderRadius: 14, padding: '12px 24px',
              color: 'white', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
            }}>
              + Crear primer cliente
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
