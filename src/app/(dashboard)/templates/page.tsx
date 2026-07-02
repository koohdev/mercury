import { createServerClient, getAuthUser } from '@/lib/supabase/server'
import TemplatesClient from './TemplatesClient'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Response Templates | Mercury Marketing',
  description: 'Quick-access bank for pre-approved text templates.',
}

export default async function TemplatesPage() {
  // Verify session
  const { data: { user } } = await getAuthUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerClient()
  const role = user.app_metadata?.role || 'moderator'
  const isAdmin = role === 'admin' || role === 'manager'

  // Fetch categories and templates in parallel
  const [categoriesRes, templatesRes] = await Promise.all([
    supabase
      .from('template_categories')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('response_templates')
      .select('*')
      .order('sort_order', { ascending: true })
  ])

  const categories = categoriesRes.data
  const templates = templatesRes.data

  if (categoriesRes.error) {
    console.error('Error fetching template categories:', categoriesRes.error)
  }
  if (templatesRes.error) {
    console.error('Error fetching response templates:', templatesRes.error)
  }

  return (
    <TemplatesClient
      initialCategories={categories || []}
      initialTemplates={templates || []}
      isAdmin={isAdmin}
    />
  )
}
