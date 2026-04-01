'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardThemeProvider } from '@/components/layout/DashboardThemeContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { api } from '@/lib/api'
import { getToken, getWorkspaceId, setWorkspaceId } from '@/lib/auth'
import type { User } from '@/types'
import type { DashboardTheme } from '@/components/layout/DashboardThemeContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [theme, setTheme] = useState<DashboardTheme>('developer')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('dashboard-theme') : null
    if (saved === 'developer' || saved === 'enterprise') {
      setTheme(saved)
    }
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }

    async function init() {
      try {
        const [me, workspaces] = await Promise.all([api.auth.me(), api.workspaces.list()])
        setUser(me)

        let wsId = getWorkspaceId()
        if (!wsId && workspaces.length > 0) {
          wsId = workspaces[0].id
          setWorkspaceId(wsId)
        }

        if (wsId) {
          const pending = await api.actions.list(wsId, { status: 'pending_approval' })
          setPendingCount(pending.length)
        }
      } catch {
        router.replace('/login')
      } finally {
        setReady(true)
      }
    }

    init()
  }, [router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--app-accent)]" />
      </div>
    )
  }

  function handleThemeChange(nextTheme: DashboardTheme) {
    setTheme(nextTheme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dashboard-theme', nextTheme)
    }
  }

  return (
    <DashboardThemeProvider theme={theme}>
      <div
        data-theme={theme}
        className="flex h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_24%),linear-gradient(180deg,var(--app-bg)_0%,var(--app-bg)_100%)] text-[var(--app-text)]"
      >
        <Sidebar
          userEmail={user?.email || ''}
          pendingCount={pendingCount}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
        <main className="flex-1 overflow-y-auto">
          <div className={theme === 'enterprise' ? 'mx-auto max-w-7xl px-8 py-8' : 'mx-auto max-w-6xl px-6 py-8'}>
            {children}
          </div>
        </main>
      </div>
    </DashboardThemeProvider>
  )
}
