'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { User, Workspace } from '@/types'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--app-border)] py-3 last:border-0">
      <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
      <span className="text-sm text-[var(--app-text)]">{value}</span>
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const wsId = getWorkspaceId() || ''

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {})
    if (wsId) {
      api.workspaces.get(wsId).then(setWorkspace).catch(() => {})
    }
  }, [wsId])

  return (
    <div>
      <PageHeader title="Settings" subtitle="Workspace and account information" />

      <div className="space-y-5">
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Workspace</h3>
          {workspace ? (
            <>
              <Row label="Name" value={workspace.name} />
              <Row label="Slug" value={<span className="font-mono text-xs">{workspace.slug}</span>} />
              <Row label="Plan" value={
                <Badge variant={workspace.plan === 'community' ? 'gray' : 'indigo'}>
                  {workspace.plan}
                </Badge>
              } />
              <Row label="ID" value={<span className="font-mono text-xs text-[var(--app-text-muted)]">{workspace.id}</span>} />
            </>
          ) : (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 rounded bg-[var(--app-panel-muted)]" />)}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Account</h3>
          {user ? (
            <>
              <Row label="Name" value={user.full_name} />
              <Row label="Email" value={user.email} />
              <Row label="Status" value={
                <Badge variant={user.is_active ? 'green' : 'red'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              } />
            </>
          ) : (
            <div className="animate-pulse space-y-3">
              {[...Array(2)].map((_, i) => <div key={i} className="h-8 rounded bg-[var(--app-panel-muted)]" />)}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Edition</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-accent-soft)]">
              <svg className="h-4 w-4 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--app-text)]">HumanLatch CE</p>
              <p className="text-xs text-[var(--app-text-muted)]">Community Edition · Open source</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
