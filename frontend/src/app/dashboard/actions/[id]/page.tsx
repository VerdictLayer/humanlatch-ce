'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionStatusBadge } from '@/components/dashboard/ActionStatusBadge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { formatDate, riskColor, riskLabel } from '@/lib/utils'
import type { ActionProposal } from '@/types'

function reviewPath(action: ActionProposal) {
  if (action.status === 'pending_approval') return 'Waiting for human approval before the capability can proceed.'
  if (action.status === 'approved_auto') return 'Automatically cleared by policy and risk rules.'
  if (action.status === 'approved_manual') return 'Approved by a human reviewer after escalation.'
  if (action.status === 'blocked') return 'Stopped by policy before execution.'
  if (action.status === 'rejected') return 'Denied by a human reviewer.'
  return 'No further action required.'
}

function environmentLabel(action: ActionProposal) {
  const env = action.context?.environment
  return typeof env === 'string' && env.length > 0 ? env : 'unknown'
}

export default function ActionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [action, setAction] = useState<ActionProposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const wsId = getWorkspaceId() || ''

  useEffect(() => {
    if (!wsId) return
    api.actions.get(id, wsId).then(setAction).finally(() => setLoading(false))
  }, [id, wsId])

  async function handleApprove() {
    setSubmitting(true)
    setError('')
    try {
      const updated = await api.actions.approve(id, wsId, note || undefined)
      setAction(updated)
      setApproveOpen(false)
      setNote('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!note.trim()) {
      setError('A note is required when rejecting.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const updated = await api.actions.reject(id, wsId, note)
      setAction(updated)
      setRejectOpen(false)
      setNote('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--app-accent)]" />
      </div>
    )
  }

  if (!action) return <div className="text-[var(--app-text-muted)]">Action not found.</div>

  return (
    <div>
      <PageHeader
        title="Approval Decision"
        subtitle="Review a proposed capability, understand how policy routed it, and approve or deny if required"
        actions={
          action.status === 'pending_approval' ? (
            <>
              <Button variant="danger" size="sm" onClick={() => { setNote(''); setError(''); setRejectOpen(true) }}>
                Reject
              </Button>
              <Button size="sm" onClick={() => { setNote(''); setError(''); setApproveOpen(true) }}>
                Approve
              </Button>
            </>
          ) : undefined
        }
      />

      <Card className="mb-5 overflow-hidden border-[var(--app-border-strong)] bg-[linear-gradient(135deg,var(--app-panel-strong),var(--app-panel))] p-0">
        <div className="grid gap-5 px-6 py-5 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">Capability Request</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">{action.summary}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              This screen is the approval gate for any AI-driven capability: cloud changes, chatbot actions, robot workflows, or manufacturing controls.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Route Through Control Plane</p>
            <p className="mt-3 text-sm font-semibold text-[var(--app-text)]">{reviewPath(action)}</p>
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              Proposed by {action.proposed_by} in {environmentLabel(action)}.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Decision Context</h3>
            <dl className="space-y-3">
              <Row label="Summary" value={action.summary} />
              <Row label="Target" value={action.target} />
              <Row label="Action Type" value={action.action_type} />
              <Row label="Proposed By" value={action.proposed_by} />
              <Row label="Environment" value={environmentLabel(action)} />
              <Row label="Created" value={formatDate(action.created_at)} />
              {action.decided_at && (
                <Row label="Decided" value={formatDate(action.decided_at)} />
              )}
              {action.decision_note && (
                <Row label="Decision Note" value={action.decision_note} />
              )}
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Requested Capability Payload</h3>
            <pre className="overflow-x-auto rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4 text-xs text-[var(--app-text)]">
              {JSON.stringify(action.payload, null, 2)}
            </pre>
          </Card>

          <Card>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Policy and Runtime Context</h3>
            <pre className="overflow-x-auto rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4 text-xs text-[var(--app-text)]">
              {JSON.stringify(action.context, null, 2)}
            </pre>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Approval Status</h3>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-[var(--app-text-muted)]">Outcome</p>
                <ActionStatusBadge status={action.status} />
              </div>
              <div>
                <p className="mb-1 text-xs text-[var(--app-text-muted)]">Risk Score</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${riskColor(action.risk_score)}`}>
                    {action.risk_score}
                  </span>
                  <span className={`text-sm ${riskColor(action.risk_score)}`}>
                    {riskLabel(action.risk_score)} risk
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--app-border)]">
                  <div
                    className={`h-1.5 rounded-full ${
                      action.risk_score < 30 ? 'bg-green-500' :
                      action.risk_score < 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${action.risk_score}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve Action"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button size="sm" loading={submitting} onClick={handleApprove}>Approve</Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-[var(--app-text-muted)]">
          You are approving: <strong className="text-[var(--app-text)]">{action.summary}</strong>
        </p>
        <Textarea
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add a note..."
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Action"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={submitting} onClick={handleReject}>Reject</Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-[var(--app-text-muted)]">
          You are rejecting: <strong className="text-[var(--app-text)]">{action.summary}</strong>
        </p>
        <Textarea
          label="Reason (required)"
          value={note}
          onChange={(e) => { setNote(e.target.value); setError('') }}
          rows={3}
          placeholder="Explain why this action is being rejected..."
          error={error}
        />
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-32 shrink-0 text-xs text-[var(--app-text-muted)]">{label}</dt>
      <dd className="break-all text-sm text-[var(--app-text)]">{value}</dd>
    </div>
  )
}
