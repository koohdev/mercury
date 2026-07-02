'use server'

import { getAdminOrManagerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ponytail: validation schema matching database requirements
const TemplateSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body content is required'),
  sortOrder: z.number().int().default(0),
})

export async function createCategory(name: string) {
  const { supabase } = await getAdminOrManagerClient()

  if (!name.trim()) {
    return { error: 'Category name is required' }
  }

  const { error } = await supabase.from('template_categories').insert({
    name: name.trim(),
  })

  if (error) return { error: error.message }

  revalidatePath('/templates')
  return { success: true }
}

export async function createTemplate(rawInput: unknown) {
  const { supabase } = await getAdminOrManagerClient()
  const validated = TemplateSchema.parse(rawInput)

  const { error } = await supabase.from('response_templates').insert({
    category_id: validated.categoryId,
    title: validated.title,
    body: validated.body,
    sort_order: validated.sortOrder,
  })

  if (error) return { error: error.message }

  revalidatePath('/templates')
  return { success: true }
}

export async function updateTemplate(id: string, rawInput: unknown) {
  const { supabase } = await getAdminOrManagerClient()
  const validated = TemplateSchema.parse(rawInput)

  const { error } = await supabase
    .from('response_templates')
    .update({
      category_id: validated.categoryId,
      title: validated.title,
      body: validated.body,
      sort_order: validated.sortOrder,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/templates')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const { supabase } = await getAdminOrManagerClient()

  const { error } = await supabase
    .from('response_templates')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/templates')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const { supabase } = await getAdminOrManagerClient()

  const { error } = await supabase
    .from('template_categories')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/templates')
  return { success: true }
}
