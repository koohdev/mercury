'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function login(prevState: { error: string } | null | unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const result = LoginSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('SIGNIN ERROR:', error)
    console.error('SIGNIN ERROR DETAILS:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    if ('cause' in error) {
      console.error('SIGNIN ERROR CAUSE:', error.cause)
    }
    return { error: error.message || 'An unknown error occurred during sign in.' }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
