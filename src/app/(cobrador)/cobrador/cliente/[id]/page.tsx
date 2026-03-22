import { createClient } from '@/lib/supabase/server'
import { getClientById } from '@/modules/clients/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PaymentForm from '@/components/shared/PaymentForm'
import RefinanceForm from '@/components/cobrador/RefinanceForm'

const statusColor: Record<string, string> = {
  ACTIVE:'rgba(16,185,129,0.15)',CURRENT:'rgba(16,185,129,0.15)',
  WATCH:'rgba(245,158,11,0.15)',WARNING:'rgba(249,115,22,0.15)',
  CRITICAL:'rgba(239,68,68,0.15)',CLOSED:'rgba(100,116,139,0.15)',
  REFINANCED:'rgba(99,102,241,0.15)',WRITTEN_OFF:'rgba(100,116,139,0.1)',
}
const statusBorder: Record<string, string> = {
  ACTIVE:'rgba(16,185,129,0.3)',CURRENT:'rgba(16,185,129,0.3)',
  WATCH:'rgba(245,158,11,0.3)',WARNING:'rgba(249,115,22,0.3)',
  CRITICAL:'rgba(239,68,68,0.3)',CLOSED:'rgba(100,116,139,0.3)',
  REFINANCED:'rgba(99,102,241,0.3)',WRITTEN_OFF:'rgba(100,116,139,0.2)',
}
const statusText: Record<string, string> = {
  ACTIVE:'#10b981',CURRENT:'#10b981',WATCH:'#f59e0b',WARNING:'#f97316',
  CRITICAL:'#ef4444',CLOSED:'#94a3b8',REFINANCED:'#6366f1',WRITTEN_OFF:'#64748b',
}
const statusLabel: Record<string, string> = {
  ACTIVE:'🟢 Activo',CURRENT:'🟢 Al día',WATCH:'🟡 Atención',
  WARNING:'🟠 Advertencia',CRITICAL:'🔴 Crítico',CLOSED:'✅ Cerrado',
  REFINANCED:'🔄 Refinanciado',WRITTEN_OFF:'⚫ Incobrable',
}
const freqLabel: Record<string, string> = {
  DAILY:'Diario',WEEKLY:'Semanal',MONTHLY:'Mensual',
}

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

export default async function CobradorClientePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client, error } = await getClientById(params.id)
  if (error || !client) redirect('/cobrador')

  const c = client as any

  const activeCredits = c.credits?.filter((cr: any) =>
    ['ACTIVE','CURRENT','WATCH','WARNING','CRITICAL'].includes(cr.status)
  ) ?? []

  const closedCredits = c.credits?.filter((cr: any) =>
    ['CLOSED','WRITTEN_OFF','REFINANCED'].includes(cr.status)
  ) ?? []

  const today = new Date().toISOString().split('T')[0]
  const { data: todayPayment } = await supabase
    .from('payments')
    .select('id, amount')
    .eq('client_id', params.id)
    .eq('payment_date', today)
    .is('deleted_at', null)
    .single()

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header style={{
        background:'var(--bg-secondary)',borderBottom:'1px solid var(--border)',
        padding:'12px 16px',position:'sticky',top:0,zIndex:50,
      }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <Link href="/cobrador" style={{ color:'var(--text-muted)',fontSize:13,textDecoration:'none',fontWeight:600 }}>
              ← Atrás
            </Link>
            <span style={{ color:'var(--border)' }}>|</span>
            <span style={{ fontWeight:700,fontSize:14,color:'var(--text-primary)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {c.full_name}
            </span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            {todayPayment && (
              <span style={{ background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:99,padding:'3px 10px',color:'#10b981',fontSize:11,fontWeight:700 }}>
                ✓ Pago hoy
              </span>
            )}
            <Link href={`/cobrador/nuevo-credito?cliente=${c.id}`} style={{ background:'var(--gradient-primary)',borderRadius:10,padding:'7px 12px',color:'white',fontSize:12,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap' }}>
              + Crédito
            </Link>
          </div>
        </div>
      </header>

      <div style={{ padding:'16px 16px 80px',display:'flex',flexDirection:'column',gap:14,maxWidth:600,margin:'0 auto' }}>

        <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
            <div style={{ width:52,height:52,borderRadius:16,flexShrink:0,background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne',fontWeight:800,fontSize:20,color:'var(--neon-bright)' }}>
              {c.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontFamily:'Syne',fontWeight:700,fontSize:16,color:'var(--text-primary)' }}>{c.full_name}</p>
              <p style={{ color:'var(--text-muted)',fontSize:12 }}>Doc: {c.document_number}</p>
              {c.address && <p style={{ color:'var(--text-muted)',fontSize:11,marginTop:2 }}>📍 {c.address}</p>}
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <a href={`https://wa.me/${c.phone}`} target="_blank" style={{ background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:14,padding:'12px',textAlign:'center',textDecoration:'none',display:'block' }}>
              <p style={{ fontSize:20,marginBottom:4 }}>💬</p>
              <p style={{ color:'#10b981',fontSize:12,fontWeight:700 }}>WhatsApp</p>
              <p style={{ color:'#10b981',fontSize:11,opacity:0.8 }}>{c.phone}</p>
            </a>
            {c.latitude && c.longitude ? (
              <a href={`https://maps.google.com?q=${c.latitude},${c.longitude}`} target="_blank" style={{ background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:14,padding:'12px',textAlign:'center',textDecoration:'none',display:'block' }}>
                <p style={{ fontSize:20,marginBottom:4 }}>🗺️</p>
                <p style={{ color:'var(--info)',fontSize:12,fontWeight:700 }}>Ver ubicación</p>
                <p style={{ color:'var(--info)',fontSize:11,opacity:0.8 }}>Google Maps</p>
              </a>
            ) : (
              <div style={{ background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:14,padding:'12px',textAlign:'center' }}>
                <p style={{ fontSize:20,marginBottom:4 }}>📍</p>
                <p style={{ color:'var(--text-muted)',fontSize:12 }}>Sin ubicación</p>
              </div>
            )}
          </div>
        </div>

        {(c.photo_doc_front || c.photo_doc_back || c.photo_place) && (
          <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:16 }}>
            <p style={{ color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12 }}>Documentos</p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:8 }}>
              {c.photo_doc_front && <a href={c.photo_doc_front} target="_blank"><img src={c.photo_doc_front} alt="Doc frente" style={{ width:'100%',height:80,objectFit:'cover',borderRadius:12 }} /></a>}
              {c.photo_doc_back && <a href={c.photo_doc_back} target="_blank"><img src={c.photo_doc_back} alt="Doc reverso" style={{ width:'100%',height:80,objectFit:'cover',borderRadius:12 }} /></a>}
              {c.photo_place && <a href={c.photo_place} target="_blank"><img src={c.photo_place} alt="Negocio" style={{ width:'100%',height:80,objectFit:'cover',borderRadius:12 }} /></a>}
            </div>
          </div>
        )}

        {activeCredits.map((credit: any) => {
          const cuotasPendientes = credit.installments - credit.paid_installments
          const saldoPendiente = cuotasPendientes * Number(credit.installment_amount)
          const totalPagado = credit.paid_installments * Number(credit.installment_amount)
          const porcentaje = Math.min(Math.round((credit.paid_installments / credit.installments) * 100), 100)
          const barColor = porcentaje === 100 ? '#10b981' : porcentaje > 60 ? '#8b5cf6' : porcentaje > 30 ? '#f59e0b' : '#ef4444'

          return (
            <div key={credit.id} style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <div style={{ background:'var(--bg-card)',border:`1px solid ${statusBorder[credit.status] ?? 'var(--border)'}`,borderRadius:20,padding:16 }}>

                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
                  <p style={{ fontFamily:'Syne',fontWeight:700,fontSize:15,color:'var(--text-primary)' }}>💳 Crédito activo</p>
                  <span style={{ background:statusColor[credit.status],border:`1px solid ${statusBorder[credit.status]}`,borderRadius:99,padding:'4px 12px',color:statusText[credit.status],fontSize:12,fontWeight:700 }}>
                    {statusLabel[credit.status]}
                  </span>
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
                  {[
                    { label:'Capital prestado', value:fmt(Number(credit.principal)), color:'var(--text-primary)' },
                    { label:'Total a pagar', value:fmt(Number(credit.total_amount)), color:'var(--neon-bright)' },
                    { label:'Interés', value:`${credit.interest_rate}%`, color:'var(--warning)' },
                    { label:'Frecuencia', value:freqLabel[credit.frequency] ?? credit.frequency, color:'var(--text-primary)' },
                    { label:'Cuota', value:fmt(Number(credit.installment_amount)), color:'var(--info)' },
                    { label:'Ya pagado', value:fmt(totalPagado), color:'#10b981' },
                  ].map((item) => (
                    <div key={item.label} style={{ background:'var(--bg-secondary)',borderRadius:12,padding:'10px 12px' }}>
                      <p style={{ color:'var(--text-muted)',fontSize:10,marginBottom:3 }}>{item.label.toUpperCase()}</p>
                      <p style={{ fontFamily:'DM Mono',fontWeight:700,fontSize:15,color:item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background:'var(--bg-secondary)',borderRadius:14,padding:'12px 14px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14 }}>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ color:'var(--text-muted)',fontSize:10,marginBottom:4 }}>PAGADAS</p>
                    <p style={{ fontFamily:'DM Mono',fontWeight:800,fontSize:22,color:'#10b981' }}>{credit.paid_installments}</p>
                    <p style={{ color:'var(--text-muted)',fontSize:10 }}>de {credit.installments}</p>
                  </div>
                  <div style={{ textAlign:'center',borderLeft:'1px solid var(--border)',borderRight:'1px solid var(--border)' }}>
                    <p style={{ color:'var(--text-muted)',fontSize:10,marginBottom:4 }}>DEBEN</p>
                    <p style={{ fontFamily:'DM Mono',fontWeight:800,fontSize:22,color:cuotasPendientes > 0 ? '#f59e0b' : '#10b981' }}>{cuotasPendientes}</p>
                    <p style={{ color:'var(--text-muted)',fontSize:10 }}>cuotas</p>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ color:'var(--text-muted)',fontSize:10,marginBottom:4 }}>SALDO</p>
                    <p style={{ fontFamily:'DM Mono',fontWeight:800,fontSize:16,color:saldoPendiente > 0 ? '#ef4444' : '#10b981' }}>{fmt(saldoPendiente)}</p>
                    <p style={{ color:'var(--text-muted)',fontSize:10 }}>pendiente</p>
                  </div>
                </div>

                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <p style={{ color:'var(--text-muted)',fontSize:11 }}>Progreso del crédito</p>
                    <p style={{ color:'var(--text-primary)',fontSize:11,fontWeight:700 }}>{porcentaje}%</p>
                  </div>
                  <div style={{ background:'var(--bg-secondary)',borderRadius:99,height:8,overflow:'hidden' }}>
                    <div style={{ height:8,borderRadius:99,width:`${porcentaje}%`,background:barColor,transition:'width 0.5s ease',boxShadow:`0 0 8px ${barColor}80` }} />
                  </div>
                </div>

                {(credit.start_date || credit.end_date) && (
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12 }}>
                    {credit.start_date && (
                      <div style={{ background:'var(--bg-secondary)',borderRadius:10,padding:'8px 10px',textAlign:'center' }}>
                        <p style={{ color:'var(--text-muted)',fontSize:10 }}>INICIO</p>
                        <p style={{ color:'var(--text-primary)',fontSize:12,fontWeight:600,fontFamily:'DM Mono' }}>{new Date(credit.start_date).toLocaleDateString('es-CO')}</p>
                      </div>
                    )}
                    {credit.end_date && (
                      <div style={{ background:'var(--bg-secondary)',borderRadius:10,padding:'8px 10px',textAlign:'center' }}>
                        <p style={{ color:'var(--text-muted)',fontSize:10 }}>VENCE</p>
                        <p style={{ color:'var(--warning)',fontSize:12,fontWeight:600,fontFamily:'DM Mono' }}>{new Date(credit.end_date).toLocaleDateString('es-CO')}</p>
                      </div>
                    )}
                  </div>
                )}

                {todayPayment && (
                  <div style={{ marginTop:12,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:12,padding:'10px 14px',textAlign:'center' }}>
                    <p style={{ color:'#10b981',fontSize:13,fontWeight:700 }}>✓ Pago registrado hoy: {fmt(Number(todayPayment.amount))}</p>
                  </div>
                )}

                {credit.refinance_count > 0 && (
                  <div style={{ marginTop:10,background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:10,padding:'8px 12px' }}>
                    <p style={{ color:'var(--info)',fontSize:12,fontWeight:600 }}>🔄 Refinanciado {credit.refinance_count} vez{credit.refinance_count > 1 ? 'ces' : ''} — máximo 3</p>
                  </div>
                )}
              </div>

              <PaymentForm creditId={credit.id} clientId={c.id} routeId={c.route_id} installmentAmount={Number(credit.installment_amount)} />

              {credit.status === 'CRITICAL' && credit.refinance_count < 3 && (
                <RefinanceForm credit={credit} clientId={c.id} routeId={c.route_id} />
              )}
            </div>
          )
        })}

        {activeCredits.length === 0 && (
          <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:32,textAlign:'center' }}>
            <p style={{ fontSize:36,marginBottom:8 }}>💳</p>
            <p style={{ color:'var(--text-muted)',fontSize:14,marginBottom:16 }}>No tiene créditos activos.</p>
            <Link href={`/cobrador/nuevo-credito?cliente=${c.id}`} style={{ background:'var(--gradient-primary)',borderRadius:14,padding:'12px 24px',color:'white',fontSize:14,fontWeight:700,textDecoration:'none',display:'inline-block' }}>
              + Nuevo crédito
            </Link>
          </div>
        )}

        {closedCredits.length > 0 && (
          <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:16 }}>
            <p style={{ color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12 }}>
              Historial ({closedCredits.length} crédito{closedCredits.length > 1 ? 's' : ''})
            </p>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {closedCredits.map((credit: any) => (
                <div key={credit.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--bg-secondary)',borderRadius:12,padding:'10px 14px' }}>
                  <span style={{ background:statusColor[credit.status],border:`1px solid ${statusBorder[credit.status]}`,borderRadius:99,padding:'2px 10px',color:statusText[credit.status],fontSize:11,fontWeight:700 }}>
                    {statusLabel[credit.status]}
                  </span>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ color:'var(--text-primary)',fontSize:12,fontWeight:700,fontFamily:'DM Mono' }}>{fmt(Number(credit.principal))}</p>
                    <p style={{ color:'var(--text-muted)',fontSize:11 }}>{new Date(credit.created_at).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
