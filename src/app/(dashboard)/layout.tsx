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
  const isAdmin = role === "admin" || role === "manager"

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
    supabase
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
  const completedDates = (shifts || []).map((s) => s.clock_in)
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
            {/* Ambient background gradients for a premium depth effect */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-none sm:rounded-2xl">
              {/* Top-Left: Purple & Indigo blend (pronounced purple) */}
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-600/12 rounded-full blur-[120px] animate-pulse-slow" />
              <div className="absolute -top-32 -left-20 w-80 h-80 bg-indigo-500/8 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-drift-slow" />

              {/* Middle-Right: Purple & Fuchsia blend */}
              <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/4 dark:bg-purple-700/6 rounded-full blur-[140px] animate-pulse-slow" />
              <div className="absolute top-1/4 -right-20 w-80 h-80 bg-fuchsia-500/3.5 dark:bg-fuchsia-700/5 rounded-full blur-[130px] animate-drift-slow" />

              {/* Bottom-Left & Bottom-Right: Sunny Yellow / Amber (seen where purple isn't) */}
              <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-amber-400/6 dark:bg-yellow-600/5 rounded-full blur-[140px] animate-drift-slow" />
              <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-yellow-400/4.5 dark:bg-amber-600/3.5 rounded-full blur-[130px] animate-pulse-slow" />
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
