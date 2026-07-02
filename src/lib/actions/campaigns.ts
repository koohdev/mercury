'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
})

// Create campaign (Admin only)
export async function createCampaign(rawInput: unknown) {
  try {
    const supabase = await createServerClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

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
  } catch (err: any) {
    return { error: err.message || 'Failed to create campaign' }
  }
}

// Update campaign (Admin only)
export async function updateCampaign(id: string, rawInput: unknown) {
  try {
    const supabase = await createServerClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

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
  } catch (err: any) {
    return { error: err.message || 'Failed to update campaign' }
  }
}

// Delete campaign (Admin only)
export async function deleteCampaign(id: string) {
  try {
    const supabase = await createServerClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase.from('campaigns').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/campaigns')
    revalidatePath('/campaigns')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete campaign' }
  }
}

// Assign moderator (Admin only)
export async function assignModerator(campaignId: string, moderatorId: string) {
  try {
    const supabase = await createServerClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase.from('campaign_assignments').insert({
      campaign_id: campaignId,
      moderator_id: moderatorId,
      assigned_by: user.id,
    })

    if (error) return { error: error.message }

    revalidatePath('/admin/campaigns')
    revalidatePath('/campaigns')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to assign moderator' }
  }
}

// Unassign moderator (Admin only)
export async function unassignModerator(campaignId: string, moderatorId: string) {
  try {
    const supabase = await createServerClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('campaign_assignments')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('moderator_id', moderatorId)

    if (error) return { error: error.message }

    revalidatePath('/admin/campaigns')
    revalidatePath('/campaigns')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to unassign moderator' }
  }
}
