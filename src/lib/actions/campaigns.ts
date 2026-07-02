'use server'

import { getAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
})

export async function createCampaign(rawInput: unknown) {
  const { supabase } = await getAdminClient()

  const result = CampaignSchema.safeParse(rawInput)
  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Invalid input' }
  }
  const validated = result.data

  const { error } = await supabase.from('campaigns').insert({
    name: validated.name,
    description: validated.description || null,
    status: validated.status,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/campaigns')
  return { success: true }
}

export async function updateCampaign(id: string, rawInput: unknown) {
  const { supabase } = await getAdminClient()

  const result = CampaignSchema.safeParse(rawInput)
  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Invalid input' }
  }
  const validated = result.data

  const { error } = await supabase
    .from('campaigns')
    .update({
      name: validated.name,
      description: validated.description || null,
      status: validated.status,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/campaigns')
  revalidatePath('/campaigns')
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const { supabase } = await getAdminClient()

  const { error } = await supabase.from('campaigns').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/campaigns')
  revalidatePath('/campaigns')
  return { success: true }
}

export async function assignModerator(campaignId: string, moderatorId: string) {
  const { supabase, user } = await getAdminClient()

  const { error } = await supabase.from('campaign_assignments').insert({
    campaign_id: campaignId,
    moderator_id: moderatorId,
    assigned_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/campaigns')
  revalidatePath('/campaigns')
  return { success: true }
}

export async function unassignModerator(campaignId: string, moderatorId: string) {
  const { supabase } = await getAdminClient()

  const { error } = await supabase
    .from('campaign_assignments')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('moderator_id', moderatorId)

  if (error) return { error: error.message }

  revalidatePath('/admin/campaigns')
  revalidatePath('/campaigns')
  return { success: true }
}
