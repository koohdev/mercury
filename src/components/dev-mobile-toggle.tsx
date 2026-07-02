"use client"

import * as React from "react"
import { Smartphone, Monitor } from "lucide-react"

export function DevMobileToggle() {
  const [mounted, setMounted] = React.useState(false)
  const [overrideState, setOverrideState] = React.useState<"auto" | "mobile" | "desktop">("auto")

  React.useEffect(() => {
    setMounted(true)
    const val = localStorage.getItem("dev_force_mobile")
    if (val === "true") {
      setOverrideState("mobile")
    } else if (val === "false") {
      setOverrideState("desktop")
    } else {
      setOverrideState("auto")
    }
  }, [])

  if (!mounted || process.env.NODE_ENV !== "development") {
    return null
  }

  const handleToggle = () => {
    let nextState: "auto" | "mobile" | "desktop" = "auto"
    if (overrideState === "auto") {
      nextState = "mobile"
      localStorage.setItem("dev_force_mobile", "true")
    } else if (overrideState === "mobile") {
      nextState = "desktop"
      localStorage.setItem("dev_force_mobile", "false")
    } else {
      nextState = "auto"
      localStorage.removeItem("dev_force_mobile")
    }
    
    setOverrideState(nextState)
    window.dispatchEvent(new Event("dev-force-mobile-change"))
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-3 py-2 text-xs font-medium text-ink shadow-lg transition-all hover:bg-surface-2 active:scale-95 cursor-pointer"
      title="Dev Only: Toggle mobile/desktop simulation state"
    >
      {overrideState === "auto" && (
        <>
          <Monitor className="h-3.5 w-3.5 text-ink-subtle" />
          <span>Viewport: Auto</span>
        </>
      )}
      {overrideState === "mobile" && (
        <>
          <Smartphone className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-semibold">Simulate Mobile</span>
        </>
      )}
      {overrideState === "desktop" && (
        <>
          <Monitor className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-blue-500 font-semibold">Simulate Desktop</span>
        </>
      )}
    </button>
  )
}
