'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const registerPaymentSchema = z.object({
  credit_id: z.string().uuid(),
  client_id: z.string().uuid(),
  route_id: z.string().uuid(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  notes: z.string().optional(),
})

// =============================================
// REGISTRAR PAGO
// =============================================
export async function registerPayment(formData: unknown) {
  const supabase = createClient()

  const parsed = registerPaymentSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { credit_id, client_id, route_id, amount, notes } = parsed.data

  // Obtener crédito
  const { data: credit } = await supabase
    .from('credits')
    .select('*')
    .eq('id', credit_id)
    .single()

  if (!credit) return { error: 'Crédito no encontrado.' }
  if (credit.status === 'CLOSED') return { error: 'Este crédito ya está cerrado.' }

  // Validar monto máximo (cuota × 3)
  if (amount > credit.installment_amount * 3) {
    return { error: `El monto no puede superar ${(credit.installment_amount * 3).toLocaleString()} (cuota × 3).` }
  }

  const today = new Date().toISOString().split('T')[0]

  // Verificar si ya hay pago hoy — si existe, reemplazar
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('credit_id', credit_id)
    .eq('payment_date', today)
    .is('deleted_at', null)
    .single()

  const { data: userData } = await supabase.auth.getUser()
  const cobrador_id = userData.user?.id

  if (existingPayment) {
    // Reemplazar pago existente
    const { error } = await supabase
      .from('payments')
      .update({ amount, notes, updated_at: new Date().toISOString() })
      .eq('id', existingPayment.id)

    if (error) return { error: 'Error al actualizar el pago.' }
  } else {
    // Crear nuevo pago
    const { error } = await supabase
      .from('payments')
      .insert({
        tenant_id: credit.tenant_id,
        credit_id,
        client_id,
        route_id,
        cobrador_id,
        amount,
        payment_date: today,
        notes,
      })

    if (error) return { error: 'Error al registrar el pago.' }

    // Incrementar cuotas pagadas
    const newPaidInstallments = credit.paid_installments + 1
    const newStatus = newPaidInstallments >= credit.installments ? 'CLOSED' : credit.status

    await supabase
      .from('credits')
      .update({
        paid_installments: newPaidInstallments,
        status: newStatus,
      })
      .eq('id', credit_id)

    // Si se cerró el crédito, actualizar cliente
    if (newStatus === 'CLOSED') {
      const { data: otherCredits } = await supabase
        .from('credits')
        .select('id')
        .eq('client_id', client_id)
        .in('status', ['ACTIVE', 'CURRENT', 'WATCH', 'WARNING', 'CRITICAL'])

      if (!otherCredits || otherCredits.length === 0) {
        await supabase
          .from('clients')
          .update({ status: 'INACTIVE' })
          .eq('id', client_id)
      }
    }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    tenant_id: credit.tenant_id,
    user_id: cobrador_id,
    action: existingPayment ? 'PAGO_EDITADO' : 'PAGO_REGISTRADO',
    entity: 'payments',
    entity_id: credit_id,
    data_after: { amount, credit_id, today },
  })

  revalidatePath(`/admin/creditos/${credit_id}`)
  return { success: true }
}

// =============================================
// OBTENER PAGOS DE UN CRÉDITO
// =============================================
export async function getPaymentsByCredit(creditId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('credit_id', creditId)
    .is('deleted_at', null)
    .order('payment_date', { ascending: false })

  if (error) return { error: 'Error al obtener pagos.' }
  return { data }
}