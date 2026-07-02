import { createServerClient as createSsrServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../types/database.types'
import { cache } from 'react'

export async function createServerClient() {
  const cookieStore = await cookies()
  return createSsrServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ponytail: ignored in Server Components where headers are read-only
          }
        },
      },
    }
  )
}

export const getAuthUser = cache(async () => {
  const supabase = await createServerClient()
  return await supabase.auth.getUser()
})

// ponytail: shared helpers to kill the 25x repeated auth boilerplate in server actions
export async function getAuthedClient() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (profile?.status === 'deactivated') {
    throw new Error('Unauthorized')
  }

  return { supabase, user }
}

export async function getAdminClient() {
  const { supabase, user } = await getAuthedClient()
  if (user.app_metadata?.role !== 'admin') throw new Error('Unauthorized')
  return { supabase, user }
}

export async function getAdminOrManagerClient() {
  const { supabase, user } = await getAuthedClient()
  const role = user.app_metadata?.role
  if (role !== 'admin' && role !== 'manager') throw new Error('Unauthorized')
  return { supabase, user }
}
