'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ProfileSchema = z.object({
  legal_full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  payment_method: z.string().optional().nullable(),
  whop_username: z.string().optional().nullable(),
  discord_username: z.string().optional().nullable(),
  timezone: z.string().min(1, 'Timezone is required'),
})

const PasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export async function saveProfile(rawInput: unknown) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const validated = ProfileSchema.parse(rawInput)

  const { error } = await (supabase as any)
    .from('profiles')
    .update(validated)
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function updatePassword(rawInput: unknown) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const validated = PasswordSchema.parse(rawInput)

  const { error } = await supabase.auth.updateUser({
    password: validated.newPassword,
  })

  if (error) return { error: error.message }

  return { success: true }
}
