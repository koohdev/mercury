"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    if (typeof window === "undefined") return

    // Detect iOS / iPadOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (!isIOS) return

    const cleanupStuckLocks = () => {
      // Find if there are any active/open modal overlays, dialogs, sheet contents, or drawers
      const hasActiveModal = document.querySelector('[role="dialog"]') || 
                            document.querySelector('[data-state="open"]') ||
                            document.querySelector('.radix-themes')

      // If no active modals are present in the DOM, ensure body is completely unlocked
      if (!hasActiveModal) {
        let changed = false
        if (document.body.hasAttribute("data-scroll-locked")) {
          document.body.removeAttribute("data-scroll-locked")
          changed = true
        }
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = ""
          document.body.style.removeProperty("pointer-events")
          changed = true
        }
        if (document.body.style.overflow === "hidden") {
          document.body.style.overflow = ""
          document.body.style.removeProperty("overflow")
          changed = true
        }
        if (changed) {
          console.log("[iOS PWA Fix] Successfully cleared stuck scroll/pointer locks.")
        }
      }
    }

    // Observe changes to document.body styling and class/attributes (e.g. Radix Dialog mutations)
    const observer = new MutationObserver(() => {
      cleanupStuckLocks()
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked", "class"],
    })

    // Also run cleanup on document/window focus changes and navigation
    cleanupStuckLocks()
    window.addEventListener("focus", cleanupStuckLocks)

    return () => {
      observer.disconnect()
      window.removeEventListener("focus", cleanupStuckLocks)
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
