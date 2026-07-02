import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const checkIsMobile = () => {
      if (typeof window === "undefined") return
      const override = localStorage.getItem("dev_force_mobile")
      if (override === "true") {
        setIsMobile(true)
      } else if (override === "false") {
        setIsMobile(false)
      } else {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
    }

    checkIsMobile()

    const handleOverrideChange = () => {
      checkIsMobile()
    }

    window.addEventListener("dev-force-mobile-change", handleOverrideChange)
    mql.addEventListener("change", checkIsMobile)
    window.addEventListener("resize", checkIsMobile)

    return () => {
      window.removeEventListener("dev-force-mobile-change", handleOverrideChange)
      mql.removeEventListener("change", checkIsMobile)
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  return !!isMobile
}
