'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ConsultasPage() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [routeId, setRouteId] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('routes')
        .select('id')
        .eq('cobrador_id', user.id)
        .single()
        .then(({ data }) => { if (data) setRouteId(data.id) })
    })
  }, [])

  useEffect(() => {
    if (!search || search.length < 2 || !routeId) { setResults([]); return }
    const timer = setTimeout(async () => {
      setIsLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('clients')
        .select(`
          id, full_name, document_number, phone, status, visit_order,
          credits(id, status, installment_amount, paid_installments, installments)
        `)
        .eq('route_id', routeId)
        .is('deleted_at', null)
        .or(`full_name.ilike.%${search}%,document_number.ilike.%${search}%`)
        .order('visit_order', { ascending: true })
      setResults(data ?? [])
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, routeId])

  const creditStatusEmoji: Record<string, string> = {
    ACTIVE: '🟢', CURRENT: '🟢', WATCH: '🟡',
    WARNING: '🟠', CRITICAL: '🔴', CLOSED: '⚫',
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
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
            Consultas
          </h1>
        </div>
      </header>

      <div style={{ padding: '16px' }}>

        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            autoFocus
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '14px 44px 14px 16px',
              color: 'var(--text-primary)',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{
            position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)', fontSize: 18,
          }}>
            {isLoading ? '⏳' : '🔍'}
          </span>
        </div>

        {search.length > 0 && search.length < 2 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Escribe al menos 2 caracteres
          </p>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((client) => {
              const activeCredit = client.credits?.find((c: any) =>
                ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'].includes(c.status)
              )
              return (
                <Link key={client.id} href={`/cobrador/cliente/${client.id}`}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 18, padding: 16,
                    textDecoration: 'none', display: 'block',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: 'var(--gradient-primary)',
                        boxShadow: '0 0 10px var(--neon-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white' }}>
                          {client.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                          {client.full_name}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          Doc: {client.document_number}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          #{client.visit_order}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {activeCredit && (
                        <>
                          <span style={{ fontSize: 16 }}>{creditStatusEmoji[activeCredit.status]}</span>
                          <p style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14, color: 'var(--neon-bright)' }}>
                            {Number(activeCredit.installment_amount).toFixed(0)}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            {activeCredit.paid_installments}/{activeCredit.installments}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {search.length >= 2 && !isLoading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              No se encontraron clientes.
            </p>
            <Link href="/cobrador/nuevo-cliente" style={{
              background: 'var(--gradient-primary)',
              borderRadius: 14, padding: '12px 24px',
              color: 'white', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 12px var(--neon-glow)',
            }}>
              + Crear nuevo cliente
            </Link>
          </div>
        )}

        {search.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 50, marginBottom: 12 }}>🔍</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Busca un cliente por nombre o número de documento
            </p>
          </div>
        )}

      </div>
    </main>
  )
}
