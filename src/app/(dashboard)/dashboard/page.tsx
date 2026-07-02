import { createServerClient, getAuthUser } from "@/lib/supabase/server"
import ClockWidget from "@/components/dashboard/ClockWidget"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import PayWidget from "@/components/dashboard/PayWidget"

function parseIntervalToHours(intervalStr: string | null): number {
  if (!intervalStr) return 0
  const parts = intervalStr.split(":")
  if (parts.length < 3) return 0
  const hours = parseFloat(parts[0]) || 0
  const minutes = parseFloat(parts[1]) || 0
  const seconds = parseFloat(parts[2]) || 0
  return hours + minutes / 60 + seconds / 3600
}

export default async function DashboardPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) return null

  const supabase = await createServerClient()

  const role = user.app_metadata?.role || 'moderator'
  const isAdmin = role === 'admin'

  const campaignCountPromise = isAdmin
    ? supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
    : supabase
        .from('campaign_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('moderator_id', user.id)

  // Fetch profile, active shifts, and all shifts in parallel
  const [profileRes, activeShiftsRes, shiftsRes, campaignCountRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("legal_full_name, pay_rate")
      .eq("id", user.id)
      .single(),
    supabase
      .from("shifts")
      .select("*, breaks(*)")
      .eq("user_id", user.id)
      .in("status", ["active", "on_break"])
      .order("clock_in", { ascending: false })
      .limit(1),
    supabase
      .from("shifts")
      .select("id, clock_in, clock_out, total_active_time, total_break_time, status, summary")
      .eq("user_id", user.id)
      .order("clock_in", { ascending: false }),
    campaignCountPromise
  ])

  const profile = profileRes.data
  const activeShifts = activeShiftsRes.data
  const shifts = shiftsRes.data
  const campaignsCount = campaignCountRes.count || 0
  const activeShift = activeShifts && activeShifts.length > 0 ? activeShifts[0] : null

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const last30DaysCompletedShifts = (shifts as any[] || []).filter(
    (s) => s.status === "completed" && new Date(s.clock_in) >= thirtyDaysAgo
  )

  const payRate = Number((profile as any)?.pay_rate || 0)

  // Aggregated Stats
  const totalHours = last30DaysCompletedShifts.reduce((acc, s) => {
    return acc + parseIntervalToHours(s.total_active_time)
  }, 0)
  
  // Calculate hourly rate based on a standard 160-hour work month,
  // and ensure projected monthly pay does not exceed the profile's monthly rate
  const hourlyRate = payRate / 160
  const estimatedPay = Math.min(totalHours * hourlyRate, payRate)

  return (
    <div className="relative flex flex-1 flex-col gap-6 w-full pb-8">
      {/* Subtle purple gradient background blobs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-purple-500/20 dark:bg-purple-600/25 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] bg-purple-500/15 dark:bg-purple-700/20 rounded-full blur-[140px]" />
      </div>

      {/* Row 1: SectionCards and ClockWidget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* order-2 lg:order-1 ensures that on mobile it stacks BELOW the ClockWidget */}
        <div className="@container/main lg:col-span-2 order-2 lg:order-1 flex flex-col">
          <SectionCards
            totalHours={totalHours}
            completedShiftsCount={last30DaysCompletedShifts.length}
            campaignsCount={campaignsCount}
            role={role}
          />
        </div>
        <div className="lg:col-span-1 order-1 lg:order-2">
          <ClockWidget activeShift={activeShift as any} />
        </div>
      </div>

      {/* Row 2: ChartAreaInteractive and PayWidget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="@container/main lg:col-span-2 flex flex-col">
          <ChartAreaInteractive shiftsData={shifts as any[] || []} />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <PayWidget monthlyRate={estimatedPay} />
        </div>
      </div>

      {/* Recent Shift Logs: full width column */}
      <div className="bg-surface-1 border border-hairline rounded-2xl py-6 shadow-sm">
        <div className="px-4 lg:px-6 pb-2">
          <h3 className="text-lg font-semibold text-ink">Recent Shift Logs</h3>
          <p className="text-sm text-ink-muted mt-0.5">List of recent logged shifts and summaries</p>
        </div>
        <DataTable data={shifts as any[] || []} />
      </div>
    </div>
  )
}
