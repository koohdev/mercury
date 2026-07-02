import { createServerClient as createSsrServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../types/database.types'

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
          } catch (error) {
            // ponytail: ignored in Server Components where headers are read-only
          }
        },
      },
    }
  )
}
