import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verificar que la llamada viene de Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient()

  // Obtener todos los créditos activos
  const { data: credits, error } = await supabase
    .from('credits')
    .select('id, start_date, status')
    .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let updated = 0

  for (const credit of credits ?? []) {
    // Obtener último pago
    const { data: lastPayment } = await supabase
      .from('payments')
      .select('payment_date')
      .eq('credit_id', credit.id)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false })
      .limit(1)
      .single()

    const lastDate = lastPayment?.payment_date ?? credit.start_date
    const lastDateObj = new Date(lastDate)
    const today = new Date()

    // Contar días hábiles (Lunes a Sábado)
    let businessDays = 0
    const checkDate = new Date(lastDateObj)
    checkDate.setDate(checkDate.getDate() + 1)

    while (checkDate <= today) {
      if (checkDate.getDay() !== 0) businessDays++
      checkDate.setDate(checkDate.getDate() + 1)
    }

    // Determinar nuevo estado
    let newStatus = 'CURRENT'
    if (businessDays <= 1) newStatus = 'CURRENT'
    else if (businessDays <= 3) newStatus = 'WATCH'
    else if (businessDays <= 5) newStatus = 'WARNING'
    else newStatus = 'CRITICAL'

    // Actualizar solo si cambió
    if (credit.status !== newStatus) {
      await supabase
        .from('credits')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', credit.id)
      updated++
    }
  }

  return NextResponse.json({
    success: true,
    processed: credits?.length ?? 0,
    updated,
    timestamp: new Date().toISOString(),
  })
}