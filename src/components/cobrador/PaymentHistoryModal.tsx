'use client'

import { useState } from 'react'

interface Payment {
  id: string
  payment_date: string
  amount: number
  notes?: string
}

interface Credit {
  id: string
  start_date: string
  end_date?: string
  installments: number
  paid_installments: number
  installment_amount: number
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  status: string
  principal: number
  total_amount: number
  interest_rate: number
}

interface Slot {
  idx: number
  date: string
  isPaid: boolean
  isFuture: boolean
  isMissed: boolean
  payment?: Payment
}

interface Props {
  credit: Credit
  payments: Payment[]
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAY_HEADERS = ['L','M','M','J','V','S']
const FREQ_LABEL: Record<string, string> = { DAILY:'Diario', WEEKLY:'Semanal', MONTHLY:'Mensual' }

function fmt(n: number) {
  return Number(n).toLocaleString('es-CO')
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function getTodayStr(): string {
  return toDateStr(new Date())
}

function generatePaymentSchedule(startDate: string, installments: number, frequency: 'DAILY'|'WEEKLY'|'MONTHLY'): string[] {
  const [y, m, d] = startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const dates: string[] = []

  if (frequency === 'DAILY') {
    const cur = new Date(start)
    while (dates.length < installments) {
      if (cur.getDay() !== 0) dates.push(toDateStr(cur))
      cur.setDate(cur.getDate() + 1)
    }
  } else if (frequency === 'WEEKLY') {
    const cur = new Date(start)
    for (let i = 0; i < installments; i++) {
      dates.push(toDateStr(cur))
      cur.setDate(cur.getDate() + 7)
    }
  } else {
    const cur = new Date(start)
    for (let i = 0; i < installments; i++) {
      dates.push(toDateStr(cur))
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return dates
}

// Groups daily slots into calendar weeks (Mon-Sat rows)
function buildDailyGrid(slots: Slot[]): (Slot | null)[][] {
  if (slots.length === 0) return []

  const slotByDate: Record<string, Slot> = {}
  slots.forEach(s => (slotByDate[s.date] = s))

  const [fy, fm, fd] = slots[0].date.split('-').map(Number)
  const firstDate = new Date(fy, fm - 1, fd)
  const dow = firstDate.getDay()
  const monday = new Date(firstDate)
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1))

  const [ly, lm, ld] = slots[slots.length - 1].date.split('-').map(Number)
  const lastDate = new Date(ly, lm - 1, ld)

  const weeks: (Slot | null)[][] = []
  const cur = new Date(monday)

  while (cur <= lastDate) {
    const week: (Slot | null)[] = []
    for (let i = 0; i < 6; i++) {
      week.push(slotByDate[toDateStr(cur)] ?? null)
      cur.setDate(cur.getDate() + 1)
    }
    cur.setDate(cur.getDate() + 1) // skip Sunday
    weeks.push(week)
  }

  return weeks
}

function DayCell({ slot }: { slot: Slot | null }) {
  if (!slot) return <div style={{ height: 50 }} />

  const bg = slot.isPaid
    ? 'rgba(16,185,129,0.18)'
    : slot.isMissed
    ? 'rgba(239,68,68,0.13)'
    : 'var(--bg-secondary)'

  const border = slot.isPaid
    ? '1px solid rgba(16,185,129,0.45)'
    : slot.isMissed
    ? '1px solid rgba(239,68,68,0.35)'
    : '1px solid var(--border)'

  const iconColor = slot.isPaid ? '#10b981' : slot.isMissed ? '#ef4444' : 'var(--text-muted)'
  const icon = slot.isPaid ? '✓' : slot.isMissed ? '✗' : '·'
  const dayNum = Number(slot.date.split('-')[2])

  return (
    <div
      style={{
        background: bg, border, borderRadius: 8, height: 50,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 800, color: iconColor, lineHeight: 1.2 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{dayNum}</span>
      <span style={{ fontSize: 8, color: 'var(--text-muted)', lineHeight: 1.2 }}>#{slot.idx}</span>
    </div>
  )
}

function SlotRow({ slot }: { slot: Slot }) {
  const bg = slot.isPaid
    ? 'rgba(16,185,129,0.07)'
    : slot.isMissed
    ? 'rgba(239,68,68,0.07)'
    : 'var(--bg-secondary)'

  const border = slot.isPaid
    ? '1px solid rgba(16,185,129,0.22)'
    : slot.isMissed
    ? '1px solid rgba(239,68,68,0.22)'
    : '1px solid var(--border)'

  const [y, m, d] = slot.date.split('-').map(Number)
  const dateLabel = `${d} ${MONTH_NAMES[m - 1]} ${y}`
  const statusIcon = slot.isPaid ? '✓' : slot.isMissed ? '✗' : '⏳'
  const statusColor = slot.isPaid ? '#10b981' : slot.isMissed ? '#ef4444' : 'var(--text-muted)'

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: bg, border, borderRadius: 10, padding: '9px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: statusColor, fontSize: 12, fontWeight: 800, width: 14, textAlign: 'center' }}>
          {statusIcon}
        </span>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 1 }}>CUOTA #{slot.idx}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: 'DM Mono', fontWeight: 600 }}>
            {dateLabel}
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {slot.isPaid && slot.payment ? (
          <p style={{ color: '#10b981', fontSize: 13, fontFamily: 'DM Mono', fontWeight: 700 }}>
            {fmt(Number(slot.payment.amount))}
          </p>
        ) : slot.isMissed ? (
          <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}>Vencida</p>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>Pendiente</p>
        )}
      </div>
    </div>
  )
}

export default function PaymentHistoryModal({ credit, payments }: Props) {
  const [open, setOpen] = useState(false)

  const todayStr = getTodayStr()
  const paymentsByDate: Record<string, Payment> = {}
  payments.forEach(p => (paymentsByDate[p.payment_date] = p))

  const expectedDates = generatePaymentSchedule(credit.start_date, credit.installments, credit.frequency)

  const slots: Slot[] = expectedDates.map((date, i) => {
    const payment = paymentsByDate[date]
    const isPaid = !!payment
    const isFuture = date > todayStr
    const isMissed = !isPaid && !isFuture
    return { idx: i + 1, date, isPaid, isFuture, isMissed, payment }
  })

  const paidCount = slots.filter(s => s.isPaid).length
  const missedCount = slots.filter(s => s.isMissed).length
  const futureCount = slots.filter(s => s.isFuture).length
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const saldoPendiente = Math.max(0, Number(credit.total_amount) - totalCollected)

  const weeks = credit.frequency === 'DAILY' ? buildDailyGrid(slots) : []

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 14,
          padding: '11px 16px',
          color: 'var(--info)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: 'inherit',
        }}
      >
        <span>📊</span> Ver historial de pagos
      </button>

      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              width: '100%', maxWidth: 600,
              margin: '0 auto',
              maxHeight: '93vh',
              borderRadius: '20px 20px 0 0',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                  📊 Historial de pagos
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                  {FREQ_LABEL[credit.frequency]} · {credit.installments} cuotas de {fmt(Number(credit.installment_amount))}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '7px 14px',
                  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Credit summary */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Resumen del crédito
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Capital prestado', val: fmt(Number(credit.principal)), color: 'var(--text-primary)' },
                    { label: 'Total a pagar', val: fmt(Number(credit.total_amount)), color: 'var(--neon-bright)' },
                    { label: 'Ya cobrado', val: fmt(totalCollected), color: '#10b981' },
                    { label: 'Saldo pendiente', val: fmt(saldoPendiente), color: saldoPendiente > 0 ? '#ef4444' : '#10b981' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '8px 10px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 3 }}>{item.label.toUpperCase()}</p>
                      <p style={{ color: item.color, fontSize: 14, fontFamily: 'DM Mono', fontWeight: 700 }}>{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Dates */}
                {(credit.start_date || credit.end_date) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    {credit.start_date && (
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 9 }}>INICIO</p>
                        <p style={{ color: 'var(--text-primary)', fontSize: 11, fontFamily: 'DM Mono', fontWeight: 600 }}>
                          {(() => { const [y,m,d] = credit.start_date.split('-').map(Number); return `${d} ${MONTH_NAMES[m-1]} ${y}` })()}
                        </p>
                      </div>
                    )}
                    {credit.end_date && (
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 9 }}>VENCE</p>
                        <p style={{ color: 'var(--warning)', fontSize: 11, fontFamily: 'DM Mono', fontWeight: 600 }}>
                          {(() => { const [y,m,d] = credit.end_date!.split('-').map(Number); return `${d} ${MONTH_NAMES[m-1]} ${y}` })()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats: paid / missed / future */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'DM Mono', fontWeight: 800, fontSize: 28, color: '#10b981', lineHeight: 1 }}>{paidCount}</p>
                  <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, marginTop: 4 }}>✓ PAGADAS</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 2 }}>de {credit.installments}</p>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'DM Mono', fontWeight: 800, fontSize: 28, color: '#ef4444', lineHeight: 1 }}>{missedCount}</p>
                  <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginTop: 4 }}>✗ VENCIDAS</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 2 }}>sin pago</p>
                </div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'DM Mono', fontWeight: 800, fontSize: 28, color: 'var(--text-muted)', lineHeight: 1 }}>{futureCount}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginTop: 4 }}>⏳ FUTURAS</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 2 }}>pendientes</p>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { color: '#10b981', bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.45)', label: 'Pagado' },
                  { color: '#ef4444', bg: 'rgba(239,68,68,0.13)', border: 'rgba(239,68,68,0.35)', label: 'Vencido' },
                  { color: 'var(--text-muted)', bg: 'var(--bg-secondary)', border: 'var(--border)', label: 'Futuro' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: item.bg, border: `1px solid ${item.border}` }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Calendar grid — DAILY */}
              {credit.frequency === 'DAILY' && weeks.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Calendario de pagos
                  </p>
                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, marginBottom: 6 }}>
                    {DAY_HEADERS.map((h, i) => (
                      <div key={i} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, padding: '2px 0' }}>
                        {h}
                      </div>
                    ))}
                  </div>
                  {/* Week rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {weeks.map((week, wi) => {
                      const firstSlot = week.find(c => c !== null)
                      const monthLabel = (() => {
                        if (!firstSlot) return null
                        const [, m] = firstSlot.date.split('-').map(Number)
                        if (wi === 0) return MONTH_NAMES[m - 1]
                        const prevFirst = weeks[wi - 1].find(c => c !== null)
                        if (!prevFirst) return null
                        const [, pm] = prevFirst.date.split('-').map(Number)
                        return pm !== m ? MONTH_NAMES[m - 1] : null
                      })()

                      return (
                        <div key={wi}>
                          {monthLabel && (
                            <p style={{
                              color: 'var(--text-muted)', fontSize: 9, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.07em',
                              marginBottom: 4, marginTop: wi > 0 ? 10 : 0,
                              paddingLeft: 2,
                            }}>
                              — {monthLabel}
                            </p>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
                            {week.map((slot, di) => (
                              <DayCell key={di} slot={slot} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* List view — WEEKLY / MONTHLY */}
              {credit.frequency !== 'DAILY' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    {credit.frequency === 'WEEKLY' ? 'Cuotas semanales' : 'Cuotas mensuales'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {slots.map(slot => <SlotRow key={slot.idx} slot={slot} />)}
                  </div>
                </div>
              )}

              {/* Payments detail list */}
              {payments.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, marginBottom: 4 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Pagos registrados ({payments.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...payments]
                      .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
                      .map(p => {
                        const [py, pm, pd] = p.payment_date.split('-').map(Number)
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: 'rgba(16,185,129,0.06)',
                              border: '1px solid rgba(16,185,129,0.2)',
                              borderRadius: 10, padding: '8px 12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#10b981', fontSize: 11, fontWeight: 800 }}>✓</span>
                              <div>
                                <p style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: 'DM Mono', fontWeight: 600 }}>
                                  {pd} {MONTH_NAMES[pm - 1]} {py}
                                </p>
                                {p.notes && (
                                  <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 1 }}>{p.notes}</p>
                                )}
                              </div>
                            </div>
                            <p style={{ color: '#10b981', fontSize: 13, fontFamily: 'DM Mono', fontWeight: 700 }}>
                              {fmt(Number(p.amount))}
                            </p>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {payments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>💳</p>
                  <p>Aún no hay pagos registrados.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}
