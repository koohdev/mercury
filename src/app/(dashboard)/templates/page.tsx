import { createServerClient } from '@/lib/supabase/server'
import TemplatesClient from './TemplatesClient'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Response Templates | Mercury Marketing',
  description: 'Quick-access bank for pre-approved text templates.',
}

export default async function TemplatesPage() {
  const supabase = await createServerClient()
  
  // Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role || 'moderator'
  const isAdmin = role === 'admin'

  // Fetch categories (sort_order ascending)
  const { data: categories, error: catError } = await supabase
    .from('template_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (catError) {
    console.error('Error fetching template categories:', catError)
  }

  // Fetch templates (sort_order ascending)
  const { data: templates, error: tempError } = await supabase
    .from('response_templates')
    .select('*')
    .order('sort_order', { ascending: true })

  if (tempError) {
    console.error('Error fetching response templates:', tempError)
  }

  return (
    <TemplatesClient
      initialCategories={categories || []}
      initialTemplates={templates || []}
      isAdmin={isAdmin}
    />
  )
}
