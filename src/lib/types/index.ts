import { Database } from './database.types'

// ponytail: basic exports to prevent repeating Database['public']['Tables'][...] everywhere
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type ScheduleEntry = Database['public']['Tables']['schedule_entries']['Row']
export type Template = Database['public']['Tables']['response_templates']['Row']
export type PayRecord = Database['public']['Tables']['pay_records']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Break = Database['public']['Tables']['breaks']['Row']
export type Availability = Database['public']['Tables']['availability']['Row']
export type TemplateCategory = Database['public']['Tables']['template_categories']['Row']
export type PayChangeRequest = Database['public']['Tables']['pay_change_requests']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignAssignment = Database['public']['Tables']['campaign_assignments']['Row']
