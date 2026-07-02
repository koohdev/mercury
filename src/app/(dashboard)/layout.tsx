import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
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
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const role = user.app_metadata?.role || "moderator"
  const isAdmin = role === "admin"

  // Fetch completed shifts to calculate streak
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: shifts } = await supabase
    .from("shifts")
    .select("clock_in")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("clock_in", thirtyDaysAgo.toISOString())
    .order("clock_in", { ascending: false })

  const completedDates = (shifts || []).map((s: any) => s.clock_in)
  const streakCount = calculateStreak(completedDates)

  // Fetch initial notifications (most recent 30)
  const { data: notifications } = await (supabase as any)
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  // Fetch active shift (status IS 'active' OR 'on_break')
  const { data: activeShifts } = await supabase
    .from("shifts")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "on_break"])
    .limit(1)
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
          <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-surface-1 sm:rounded-2xl rounded-none sm:m-4 m-0 sm:border border-0 border-hairline">
            <SiteHeader
              user={user}
              streakCount={streakCount}
              initialNotifications={notifications || []}
            />
            <main className="@container/main-viewport flex-1 overflow-y-auto pt-4 px-4 min-[440px]:px-8 pb-8 sm:p-lg md:p-xl">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
