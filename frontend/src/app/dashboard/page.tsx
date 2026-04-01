'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDashboardTheme } from '@/components/layout/DashboardThemeContext'
import { api } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActionStatusBadge } from '@/components/dashboard/ActionStatusBadge'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelative, riskColor } from '@/lib/utils'
import type { ActionProposal } from '@/types'

export default function DashboardPage() {
  const [actions, setActions] = useState<ActionProposal[]>([])
  const [loading, setLoading] = useState(true)
  const theme = useDashboardTheme()
  const isEnterprise = theme === 'enterprise'

  const wsId = getWorkspaceId()

  useEffect(() => {
    if (!wsId) return
    api.actions.list(wsId, { limit: 50 }).then(setActions).finally(() => setLoading(false))
  }, [wsId])

  const pending = actions.filter((a) => a.status === 'pending_approval')
  const blocked = actions.filter((a) => a.status === 'blocked')
  const approvedAuto = actions.filter((a) => a.status === 'approved_auto')
  const approvedManual = actions.filter((a) => a.status === 'approved_manual')
  const recent = actions.slice(0, 10)
  const total = actions.length
  const reviewRate = total > 0 ? Math.round(((approvedManual.length + approvedAuto.length) / total) * 100) : 0
  const decisioned = approvedManual.length + approvedAuto.length + blocked.length
  const decisionRate = total > 0 ? Math.round((decisioned / total) * 100) : 0
  const isEmptyWorkspace = !loading && total === 0

  return (
    <div>
      <PageHeader
        title={isEnterprise ? 'Executive Dashboard' : 'Dashboard'}
        subtitle={
          isEnterprise
            ? 'Business-facing oversight of approvals, policy posture, and operational exposure'
            : 'Operational posture for agent actions, policy controls, and approval throughput'
        }
        actions={
          pending.length > 0 ? (
            <Link href="/dashboard/approvals">
              <Button size="sm">
                Review {pending.length} pending
              </Button>
            </Link>
          ) : undefined
        }
      />

      {isEmptyWorkspace ? (
        <EmptyState
          eyebrow="New Workspace"
          title="Your workspace is ready. Now connect a capability and define how HumanLatch should route it."
          description="Fresh accounts start empty on purpose. The next step is to define what your AI system wants to do, decide what should be auto-approved versus escalated, and then send a test action through the control plane."
          checklist={[
            'Create your first policy rule for allow, approval, or block decisions.',
            'Send a test action from the Actions page or your own app.',
            'Generate an API key when an agent needs to call HumanLatch directly.',
          ]}
          actions={
            <>
              <Link href="/dashboard/actions">
                <Button size="sm">Propose a test action</Button>
              </Link>
              <Link href="/dashboard/policies">
                <Button variant="secondary" size="sm">Create first policy</Button>
              </Link>
              <Link href="/developers">
                <Button variant="ghost" size="sm">Read integration docs</Button>
              </Link>
            </>
          }
        />
      ) : null}

      {!isEmptyWorkspace && !loading && isEnterprise && (
        <div className="mb-8 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <Card className="overflow-hidden border-[var(--app-border-strong)] bg-[linear-gradient(180deg,#ffffff,var(--app-panel))] p-0">
            <div className="border-b border-[var(--app-border)] px-7 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Quarterly Governance Snapshot</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                    {pending.length > 0 ? `${pending.length} approvals need executive attention.` : 'Approval operations are within policy thresholds.'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
                    This view is tuned for stakeholder reviews: cleaner hierarchy, fewer low-signal details, and clearer control metrics.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Throughput</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--app-accent)]">{decisionRate}%</p>
                  <p className="mt-1 text-xs text-[var(--app-text-muted)]">Actions with a completed outcome</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 px-7 py-6 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Total Actions</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--app-text)]">{total}</p>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">All tracked agent actions in this workspace.</p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Review Rate</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--app-accent)]">{reviewRate}%</p>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">Automatically or manually approved.</p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Blocked Exposure</p>
                <p className="mt-3 text-4xl font-semibold text-red-500">{blocked.length}</p>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">Actions stopped by policy or risk controls.</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-5">
            <Card className="bg-[linear-gradient(180deg,#ffffff,var(--app-panel))]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Leadership Notes</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">Pending approvals</p>
                  <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                    {pending.length > 0 ? 'Queue managers should clear escalations before the next deployment window.' : 'No pending actions require manual intervention.'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">Operational mode</p>
                  <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                    Enterprise mode now uses a stakeholder-oriented hierarchy instead of the dense operator dashboard.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-[linear-gradient(180deg,#ffffff,var(--app-panel))]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Control Mix</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[var(--app-panel-muted)] px-4 py-3">
                  <span className="text-sm text-[var(--app-text-muted)]">Pending</span>
                  <span className="text-sm font-semibold text-[var(--app-text)]">{pending.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--app-panel-muted)] px-4 py-3">
                  <span className="text-sm text-[var(--app-text-muted)]">Approved</span>
                  <span className="text-sm font-semibold text-[var(--app-text)]">{approvedManual.length + approvedAuto.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--app-panel-muted)] px-4 py-3">
                  <span className="text-sm text-[var(--app-text-muted)]">Blocked</span>
                  <span className="text-sm font-semibold text-[var(--app-text)]">{blocked.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {!isEmptyWorkspace && !loading && !isEnterprise && (
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.8fr_1fr]">
          <Card className="overflow-hidden border-[var(--app-border-strong)] bg-[linear-gradient(135deg,var(--app-panel-strong),var(--app-panel))] p-0">
            <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Executive Summary</p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                  Approval controls are active across {total} recorded agent actions.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
                  Keep the developer theme for dense operator workflows. Enterprise mode now has its own stakeholder-oriented composition.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Review Rate</p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--app-accent)]">{reviewRate}%</p>
                  <p className="mt-1 text-xs text-[var(--app-text-muted)]">Approved automatically or manually</p>
                </div>
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">High-Risk Queue</p>
                  <p className="mt-2 text-3xl font-semibold text-red-500">{pending.length + blocked.length}</p>
                  <p className="mt-1 text-xs text-[var(--app-text-muted)]">Pending approvals and blocked actions</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,var(--app-panel-strong),var(--app-panel))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Operating Modes</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--app-text)]">Developer Theme</p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Dense dark interface for approvals, traces, and operational speed.</p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--app-text)]">Enterprise Theme</p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Card-driven presentation with lighter surfaces and stronger executive framing.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!isEmptyWorkspace && loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)]" />
          ))}
        </div>
      ) : !isEmptyWorkspace ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Pending Approvals" value={pending.length} color="yellow" subtitle="Awaiting review" />
          <StatsCard title="Auto-Approved" value={approvedAuto.length} color="green" subtitle="Low risk" />
          <StatsCard title="Approved" value={approvedManual.length} color="indigo" subtitle="Human approved" />
          <StatsCard title="Blocked" value={blocked.length} color="red" subtitle="Policy violations" />
        </div>
      ) : null}

      {!isEmptyWorkspace ? (
      <Card className={isEnterprise ? 'bg-[linear-gradient(180deg,#ffffff,var(--app-panel))]' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--app-text)]">{isEnterprise ? 'Recent Decisions' : 'Recent Actions'}</h2>
          <Link href="/dashboard/actions" className="text-xs text-[var(--app-accent)] hover:opacity-80">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[var(--app-panel-muted)]" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="py-12 text-center text-[var(--app-text-soft)]">
            <p className="text-sm">No actions yet.</p>
            <p className="text-xs mt-1">Submit an action via the API to get started.</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>Target</Th>
                <Th>Risk</Th>
                <Th>Status</Th>
                <Th>When</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recent.map((action) => (
                <Tr
                  key={action.id}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/dashboard/actions/${action.id}`
                    }
                  }}
                >
                  <Td>
                    <span className="font-mono text-xs text-[var(--app-text)]">{action.action_type}</span>
                  </Td>
                  <Td className="max-w-[160px] truncate text-[var(--app-text)]">{action.target}</Td>
                  <Td>
                    <span className={`font-mono text-xs font-bold ${riskColor(action.risk_score)}`}>
                      {action.risk_score}
                    </span>
                  </Td>
                  <Td>
                    <ActionStatusBadge status={action.status} />
                  </Td>
                  <Td className="text-xs text-[var(--app-text-soft)]">{formatRelative(action.created_at)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
      ) : null}
    </div>
  )
}
