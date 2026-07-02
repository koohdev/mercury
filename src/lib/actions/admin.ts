'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  legal_full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'moderator']),
  pay_rate: z.number().min(0, 'Pay rate must be 0 or higher'),
})

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') throw new Error('Unauthorized')
  return user
}

export async function createUser(rawInput: unknown) {
  await assertAdmin()
  const validated = CreateUserSchema.parse(rawInput)
  const adminClient = createAdminClient()

  // 1. Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: validated.email,
    password: validated.password,
    email_confirm: true,
    app_metadata: { role: validated.role },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create user' }

  // 2. Create profile row
  const { error: profileError } = await (adminClient as any)
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: validated.email,
      legal_full_name: validated.legal_full_name,
      role: validated.role,
      pay_rate: validated.pay_rate,
    })

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function toggleUserStatus(userId: string, currentStatus: string) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const newStatus = currentStatus === 'active' ? 'deactivated' : 'active'

  const { error } = await (adminClient as any)
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true, newStatus }
}

export async function updateUserPayRate(userId: string, payRate: number) {
  await assertAdmin()
  const adminClient = createAdminClient()

  const { error } = await (adminClient as any)
    .from('profiles')
    .update({ pay_rate: payRate })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}
