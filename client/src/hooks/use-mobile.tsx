import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_MAX_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const onChange = () => {
      const w = window.innerWidth
      setIsTablet(w >= MOBILE_BREAKPOINT && w < TABLET_MAX_BREAKPOINT)
    }
    const mqlMin = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`)
    const mqlMax = window.matchMedia(`(max-width: ${TABLET_MAX_BREAKPOINT - 1}px)`)
    mqlMin.addEventListener("change", onChange)
    mqlMax.addEventListener("change", onChange)
    onChange()
    return () => {
      mqlMin.removeEventListener("change", onChange)
      mqlMax.removeEventListener("change", onChange)
    }
  }, [])

  return !!isTablet
}
