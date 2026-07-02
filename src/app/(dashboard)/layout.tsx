import { redirect } from "next/navigation"
import { createServerClient, getAuthUser } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { calculateStreak } from "@/lib/utils/streak"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: { user } } = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createServerClient()
  const role = user.app_metadata?.role || "moderator"
  const isAdmin = role === "admin"

  // Fetch completed shifts to calculate streak
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch all layout requirements in parallel
  const [shiftsRes, notificationsRes, activeShiftsRes] = await Promise.all([
    supabase
      .from("shifts")
      .select("clock_in")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("clock_in", thirtyDaysAgo.toISOString())
      .order("clock_in", { ascending: false }),
    (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("shifts")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "on_break"])
      .limit(1)
  ])

  const shifts = shiftsRes.data
  const completedDates = (shifts || []).map((s: any) => s.clock_in)
  const streakCount = calculateStreak(completedDates)

  const notifications = notificationsRes.data
  const activeShifts = activeShiftsRes.data
  const hasActiveShift = !!(activeShifts && activeShifts.length > 0)

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--header-height": "4rem",
          } as React.CSSProperties
        }
      >
        <div className="flex min-h-screen w-full bg-canvas text-ink">
          <AppSidebar isAdmin={isAdmin} user={user} hasActiveShift={hasActiveShift} />
          <SidebarInset className="relative flex flex-1 flex-col overflow-hidden bg-surface-1 sm:rounded-2xl rounded-none sm:m-4 m-0 sm:border border-0 border-hairline">
            {/* Subtle purple gradient background blobs scoped only to SidebarInset */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-none sm:rounded-2xl">
              <div className="absolute -top-40 -left-40 w-[20rem] h-[20rem] bg-purple-500/[0.04] dark:bg-purple-600/[0.05] rounded-full blur-[120px]" />
              <div className="absolute top-1/3 -right-40 w-[24rem] h-[24rem] bg-purple-500/[0.015] dark:bg-purple-700/[0.025] rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
              <SiteHeader
                user={user}
                streakCount={streakCount}
                initialNotifications={notifications || []}
              />
              <main className="@container/main-viewport flex-1 overflow-y-auto pt-4 px-4 min-[440px]:px-8 pb-8 sm:p-lg md:p-xl">
                {children}
              </main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
