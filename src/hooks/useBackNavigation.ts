import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// A back swipe has to start this close to the left edge and travel this far.
const EDGE_PX = 24
const SWIPE_BACK_PX = 80
const MAX_DRIFT_PX = 60

/** One level up: a tab goes back to its class, everything else to the class list. */
export function parentPath(pathname: string): string {
  const tabMatch = /^(\/class\/[^/]+)\/tab\//.exec(pathname)
  return tabMatch ? tabMatch[1] : '/'
}

/** Goes back the way you came, or one level up if the app was opened on this page. Null on the home page. */
export function useGoBack(): (() => void) | null {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  const goBack = useCallback(() => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (historyIndex > 0) navigate(-1)
    else navigate(parentPath(pathname), { replace: true })
  }, [navigate, pathname])

  return isHome ? null : goBack
}

function isInstalledApp(): boolean {
  const standalone = (navigator as { standalone?: boolean }).standalone === true
  return standalone || (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
}

/**
 * Swipe in from the left edge to go back, like iOS. Only in the installed app:
 * in a browser tab, the browser's own back swipe already does this.
 */
export function useEdgeSwipeBack(goBack: (() => void) | null): void {
  const goBackRef = useRef(goBack)
  useEffect(() => {
    goBackRef.current = goBack
  })

  useEffect(() => {
    if (!isInstalledApp()) return
    let start: { x: number; y: number } | null = null
    const handleStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch.clientX <= EDGE_PX ? { x: touch.clientX, y: touch.clientY } : null
    }
    const handleEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const isBackSwipe = touch.clientX - start.x >= SWIPE_BACK_PX && Math.abs(touch.clientY - start.y) <= MAX_DRIFT_PX
      start = null
      if (isBackSwipe) goBackRef.current?.()
    }
    document.addEventListener('touchstart', handleStart, { passive: true })
    document.addEventListener('touchend', handleEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleStart)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [])
}
