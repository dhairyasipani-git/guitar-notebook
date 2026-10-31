import { IconChevronLeft, IconSettings } from '@tabler/icons-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useEdgeSwipeBack, useGoBack } from '../hooks/useBackNavigation'
import { useHotkeys } from '../hooks/useHotkeys'
import { isTyping } from '../lib/hotkeys'
import { ConfirmProvider } from './ConfirmDialog'
import { GuitarBackdrop, Pick } from './Decor'

export function Layout() {
  const goBack = useGoBack()
  useEdgeSwipeBack(goBack)
  // Esc leaves a text box first; pressed again, it goes back.
  useHotkeys({
    escape: () => {
      const active = document.activeElement
      if (active instanceof HTMLElement && isTyping(active)) active.blur()
      else goBack?.()
    },
  })

  return (
    <ConfirmProvider>
    <GuitarBackdrop />
    <div className="app">
      <header className="topbar">
        {goBack && (
          <button type="button" className="icon-btn back-btn" aria-label="Back" onClick={goBack}>
            <IconChevronLeft size={22} aria-hidden="true" />
          </button>
        )}
        <Link to="/" className="brand">
          <Pick label="" size={26} />
          Guitar notebook
        </Link>
        <nav className="topbar-actions" aria-label="Main">
          <NavLink to="/backup" className="icon-btn" aria-label="Settings">
            <IconSettings size={19} aria-hidden="true" />
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
    </ConfirmProvider>
  )
}
