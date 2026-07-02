'use server'

import { getAuthedClient, getAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ChangeRequestSchema = z.object({
  payRecordId: z.string().uuid('Invalid pay record'),
  requestedAmount: z.number().positive('Amount must be positive'),
  reason: z.string().min(10, 'Please provide at least 10 characters of justification'),
})

export async function submitPayChangeRequest(rawInput: unknown) {
  const { supabase, user } = await getAuthedClient()
  const validated = ChangeRequestSchema.parse(rawInput)

  const { error } = await supabase.from('pay_change_requests').insert({
    user_id: user.id,
    pay_record_id: validated.payRecordId,
    requested_amount: validated.requestedAmount,
    reason: validated.reason,
  })

  if (error) return { error: error.message }

  revalidatePath('/pay')
  return { success: true }
}

export async function resolvePayChangeRequest(
  requestId: string,
  decision: 'approved' | 'denied',
  adminNotes?: string
) {
  const { supabase, user } = await getAdminClient()

  const { error } = await supabase
    .from('pay_change_requests')
    .update({
      status: decision,
      admin_notes: adminNotes || null,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/pay')
  revalidatePath('/admin/pay')
  return { success: true }
}
