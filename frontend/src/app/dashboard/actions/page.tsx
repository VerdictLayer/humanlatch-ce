'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionStatusBadge } from '@/components/dashboard/ActionStatusBadge'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { formatRelative, riskColor } from '@/lib/utils'
import { cx } from '@/lib/utils'
import type { ActionProposal, ProposeActionResult } from '@/types'

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending_approval' },
  { label: 'Approved', value: 'approved_manual' },
  { label: 'Auto-approved', value: 'approved_auto' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Blocked', value: 'blocked' },
]

type ProposalTemplate = {
  title: string
  action_type: string
  target: string
  summary: string
  payload: string
  context: string
}

const TEMPLATES = {
  cloud: {
    title: 'Cloud / IAM',
    action_type: 'aws.iam.policy_change',
    target: 'prod-admin-role',
    summary: 'Attach elevated access to a production IAM role',
    payload: `{
  "policy_arn": "arn:aws:iam::aws:policy/AdministratorAccess"
}`,
    context: `{
  "environment": "production",
  "requested_by": "agent:terraform-bot",
  "domain": "cloud"
}`,
  },
  chatbot: {
    title: 'Chatbot / Customer Ops',
    action_type: 'support.refund.issue',
    target: 'order-10428',
    summary: 'Issue a refund above the autonomous threshold',
    payload: `{
  "amount": 850,
  "currency": "USD",
  "customer_id": "cust_2041"
}`,
    context: `{
  "environment": "production",
  "requested_by": "agent:support-bot",
  "domain": "chatbot"
}`,
  },
  robotics: {
    title: 'Robotics',
    action_type: 'robot.motion.execute',
    target: 'cell-7-arm-a',
    summary: 'Move a robot into a maintenance zone that requires human confirmation',
    payload: `{
  "command": "enter_maintenance_zone",
  "speed": "reduced"
}`,
    context: `{
  "environment": "factory",
  "requested_by": "agent:cell-controller",
  "domain": "robotics"
}`,
  },
  manufacturing: {
    title: 'Manufacturing',
    action_type: 'manufacturing.line.override',
    target: 'line-3',
    summary: 'Override a conveyor safety threshold for a production line',
    payload: `{
  "threshold": 0.92,
  "duration_seconds": 180
}`,
    context: `{
  "environment": "production",
  "requested_by": "agent:line-optimizer",
  "domain": "manufacturing"
}`,
  },
} satisfies Record<string, ProposalTemplate>

function inferEnvironment(action: ActionProposal) {
  const env = action.context?.environment
  return typeof env === 'string' && env.length > 0 ? env : 'unknown'
}

function policyRoute(action: ActionProposal) {
  if (action.status === 'blocked') {
    return {
      label: 'Blocked by policy',
      detail: 'The action was stopped before execution.',
    }
  }
  if (action.status === 'pending_approval') {
    return {
      label: 'Approval required',
      detail: 'Policy or risk rules escalated this action to a human.',
    }
  }
  if (action.status === 'approved_auto') {
    return {
      label: 'Auto-approved',
      detail: 'The action passed policy and risk checks automatically.',
    }
  }
  if (action.status === 'approved_manual') {
    return {
      label: 'Human-approved',
      detail: 'A reviewer approved the action after policy evaluation.',
    }
  }
  if (action.status === 'rejected') {
    return {
      label: 'Rejected by reviewer',
      detail: 'A human denied the action after review.',
    }
  }
  return {
    label: 'Closed',
    detail: 'This action is no longer active.',
  }
}

function nextStep(action: ActionProposal) {
  if (action.status === 'pending_approval') return 'Review in approvals queue'
  if (action.status === 'blocked') return 'Adjust policy or action payload'
  if (action.status === 'rejected') return 'Inspect rejection note and retry'
  if (action.status === 'approved_auto') return 'Audit execution trail'
  if (action.status === 'approved_manual') return 'Confirm execution and audit'
  return 'Open details'
}

export default function ActionsPage() {
  const router = useRouter()
  const [actions, setActions] = useState<ActionProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState<ProposeActionResult | null>(null)
  const [form, setForm] = useState({
    action_type: TEMPLATES.cloud.action_type,
    target: TEMPLATES.cloud.target,
    summary: TEMPLATES.cloud.summary,
    payload: TEMPLATES.cloud.payload,
    context: TEMPLATES.cloud.context,
  })
  const wsId = getWorkspaceId()

  useEffect(() => {
    if (!wsId) return
    setLoading(true)
    api.actions
      .list(wsId, { status: filter || undefined, limit: 100 })
      .then(setActions)
      .finally(() => setLoading(false))
  }, [wsId, filter])

  const pending = actions.filter((action) => action.status === 'pending_approval')
  const blocked = actions.filter((action) => action.status === 'blocked')
  const autoApproved = actions.filter((action) => action.status === 'approved_auto')

  function applyTemplate(key: keyof typeof TEMPLATES) {
    const template = TEMPLATES[key]
    setForm({
      action_type: template.action_type,
      target: template.target,
      summary: template.summary,
      payload: template.payload,
      context: template.context,
    })
    setFormError('')
    setResult(null)
  }

  async function handlePropose() {
    if (!wsId) return
    setSubmitting(true)
    setFormError('')
    try {
      const payload = JSON.parse(form.payload)
      const context = JSON.parse(form.context)
      const proposed = await api.actions.propose(wsId, {
        action_type: form.action_type,
        target: form.target,
        summary: form.summary,
        payload,
        context,
      })
      setResult(proposed)
      await api.actions.list(wsId, { status: filter || undefined, limit: 100 }).then(setActions)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to propose action')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Actions"
        subtitle="Control every proposed action from policy decision to human approval and audit"
        actions={
          <Button size="sm" onClick={() => { setModalOpen(true); setResult(null); setFormError('') }}>
            Propose Test Action
          </Button>
        }
      />

      {!loading && (
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <Card className="overflow-hidden border-[var(--app-border-strong)] bg-[linear-gradient(135deg,var(--app-panel-strong),var(--app-panel))] p-0">
            <div className="border-b border-[var(--app-border)] px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Control Plane Flow</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                Agents propose actions. Policy decides the route. Humans approve only when needed.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-text-muted)]">
                This view should help operators answer three questions fast: what was proposed, how policy routed it, and what action to take next.
              </p>
            </div>
            <div className="grid gap-3 px-6 py-5 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Pending Review</p>
                <p className="mt-2 text-3xl font-semibold text-yellow-500">{pending.length}</p>
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">Actions routed to humans for approval.</p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Auto-Approved</p>
                <p className="mt-2 text-3xl font-semibold text-green-500">{autoApproved.length}</p>
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">Actions cleared by policy and risk rules.</p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Blocked</p>
                <p className="mt-2 text-3xl font-semibold text-red-500">{blocked.length}</p>
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">Actions denied before execution.</p>
              </div>
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,var(--app-panel-strong),var(--app-panel))]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Operator Shortcuts</p>
            <div className="mt-4 space-y-3">
              <Link href="/dashboard/approvals" className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4 transition-colors hover:border-[var(--app-border-strong)]">
                <p className="text-sm font-semibold text-[var(--app-text)]">Open approvals queue</p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Review the actions that need a human decision.</p>
              </Link>
              <Link href="/dashboard/policies" className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4 transition-colors hover:border-[var(--app-border-strong)]">
                <p className="text-sm font-semibold text-[var(--app-text)]">Tune policy rules</p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Adjust auto-approve, require-approval, or block behavior.</p>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cx(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              filter === f.value
                ? 'bg-[var(--app-accent)] text-white'
                : 'text-[var(--app-text-muted)] hover:bg-[var(--app-panel-muted)] hover:text-[var(--app-text)]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 rounded bg-[var(--app-panel-muted)] animate-pulse" />
            ))}
          </div>
        ) : actions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              eyebrow="No Actions Yet"
              title="Nothing has been proposed to this workspace yet."
              description="HumanLatch only becomes useful after an app, agent, robot controller, or chatbot proposes a capability before execution. Start by sending a test action here, then wire the same flow into your own system."
              checklist={[
                'Pick a domain template to simulate a real integration.',
                'Review the returned route: auto-approved, pending approval, or blocked.',
                'Use the same propose call from your app or agent.',
              ]}
              actions={
                <>
                  <Button size="sm" onClick={() => { setModalOpen(true); setResult(null); setFormError('') }}>
                    Propose test action
                  </Button>
                  <Link href="/developers">
                    <Button variant="secondary" size="sm">Read integration docs</Button>
                  </Link>
                  <Link href="/dashboard/policies">
                    <Button variant="ghost" size="sm">Set policy rules</Button>
                  </Link>
                </>
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Proposed Action</Th>
                <Th>Policy Route</Th>
                <Th>Outcome</Th>
                <Th>Risk</Th>
                <Th>Source</Th>
                <Th>Next Step</Th>
              </Tr>
            </Thead>
            <Tbody>
              {actions.map((action) => (
                <Tr key={action.id} onClick={() => router.push(`/dashboard/actions/${action.id}`)}>
                  <Td>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--app-text)]">{action.summary}</p>
                      <p className="font-mono text-xs text-[var(--app-text-muted)]">{action.action_type}</p>
                      <p className="text-xs text-[var(--app-text-muted)]">Target: {action.target}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--app-text)]">{policyRoute(action).label}</p>
                      <p className="max-w-[260px] text-xs leading-5 text-[var(--app-text-muted)]">{policyRoute(action).detail}</p>
                    </div>
                  </Td>
                  <Td>
                    <ActionStatusBadge status={action.status} />
                  </Td>
                  <Td>
                    <span className={`font-mono text-sm font-bold ${riskColor(action.risk_score)}`}>{action.risk_score}</span>
                  </Td>
                  <Td>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--app-text)]">{action.proposed_by}</p>
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Env: {inferEnvironment(action)} · {formatRelative(action.created_at)}
                      </p>
                    </div>
                  </Td>
                  <Td className="max-w-[220px] whitespace-normal text-xs text-[var(--app-text-muted)]">
                    {nextStep(action)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Propose Test Action"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Close</Button>
            <Button size="sm" loading={submitting} onClick={handlePropose}>Send To Control Plane</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
            <p className="text-sm font-semibold text-[var(--app-text)]">What this does</p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              This simulates what a developer app, robot controller, chatbot, or manufacturing system would do before executing a capability.
              It sends the request to HumanLatch and gets back one of three outcomes: auto-approve, require approval, or block.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--app-text)]">Start from a domain template</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-3 py-3 text-left transition-colors hover:border-[var(--app-border-strong)]"
                >
                  <span className="block text-sm font-semibold text-[var(--app-text)]">{TEMPLATES[key].title}</span>
                  <span className="mt-1 block text-xs text-[var(--app-text-muted)]">{TEMPLATES[key].summary}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Capability Type"
            value={form.action_type}
            onChange={(e) => setForm((prev) => ({ ...prev, action_type: e.target.value }))}
            placeholder="support.refund.issue"
          />
          <Input
            label="Target"
            value={form.target}
            onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
            placeholder="order-10428"
          />
          <Textarea
            label="Human-readable summary"
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            rows={2}
            placeholder="Issue a refund above the autonomous threshold"
          />
          <Textarea
            label="Payload JSON"
            value={form.payload}
            onChange={(e) => setForm((prev) => ({ ...prev, payload: e.target.value }))}
            rows={6}
          />
          <Textarea
            label="Context JSON"
            value={form.context}
            onChange={(e) => setForm((prev) => ({ ...prev, context: e.target.value }))}
            rows={6}
          />

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          {result && (
            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--app-text)]">Control plane response</p>
              <div className="mt-3 flex items-center gap-3">
                <ActionStatusBadge status={result.status} />
                <span className={`font-mono text-sm font-bold ${riskColor(result.risk_score)}`}>Risk {result.risk_score}</span>
              </div>
              <p className="mt-3 text-sm text-[var(--app-text-muted)]">
                {result.status === 'approved_auto' && 'This capability can execute immediately.'}
                {result.status === 'pending_approval' && 'This capability must wait for a human approval decision.'}
                {result.status === 'blocked' && 'This capability should not execute. Adjust policy or the request.'}
                {result.status !== 'approved_auto' && result.status !== 'pending_approval' && result.status !== 'blocked' && 'The control plane recorded the request.'}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
