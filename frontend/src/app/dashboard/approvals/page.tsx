'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Textarea } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { formatRelative, riskColor } from '@/lib/utils'
import Link from 'next/link'
import type { ActionProposal } from '@/types'

export default function ApprovalsPage() {
  const router = useRouter()
  const [actions, setActions] = useState<ActionProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const wsId = getWorkspaceId() || ''

  function load() {
    if (!wsId) return
    setLoading(true)
    api.actions.list(wsId, { status: 'pending_approval', limit: 100 }).then(setActions).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [wsId])

  async function handleApprove(id: string) {
    setSubmitting(true)
    try {
      await api.actions.approve(id, wsId)
      setActions((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setErrors((prev) => ({ ...prev, [id]: err instanceof ApiError ? err.message : 'Failed' }))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject(id: string) {
    if (!rejectNote.trim()) {
      setErrors((prev) => ({ ...prev, [id]: 'Note is required' }))
      return
    }
    setSubmitting(true)
    try {
      await api.actions.reject(id, wsId, rejectNote)
      setActions((prev) => prev.filter((a) => a.id !== id))
      setRejectingId(null)
      setRejectNote('')
    } catch (err) {
      setErrors((prev) => ({ ...prev, [id]: err instanceof ApiError ? err.message : 'Failed' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Approvals Queue"
        subtitle={`${actions.length} action${actions.length !== 1 ? 's' : ''} pending review`}
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)]" />
          ))}
        </div>
      ) : actions.length === 0 ? (
        <EmptyState
          eyebrow="Queue Status"
          title="No actions are waiting for human review."
          description="That can mean either nothing has been proposed yet, or your current policies are auto-approving or blocking requests without escalation. The next move is usually to send a test action or tighten a policy so risky capabilities require review."
          checklist={[
            'Send a test action from the Actions page.',
            'Mark sensitive capabilities as require approval.',
            'Use this queue for the decisions humans should own.',
          ]}
          actions={
            <>
              <Link href="/dashboard/actions">
                <Button size="sm">Open actions</Button>
              </Link>
              <Link href="/dashboard/policies">
                <Button variant="secondary" size="sm">Adjust policies</Button>
              </Link>
            </>
          }
        />
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <Card key={action.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-sm font-bold ${riskColor(action.risk_score)}`}>
                      {action.risk_score}
                    </span>
                    <span className="font-mono text-xs text-[var(--app-text-muted)]">{action.action_type}</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--app-text)]">{action.summary}</p>
                  <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                    Target: {action.target} · {action.proposed_by} · {formatRelative(action.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/actions/${action.id}`)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={submitting}
                    onClick={() => {
                      setRejectingId(rejectingId === action.id ? null : action.id)
                      setRejectNote('')
                      setErrors({})
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    loading={submitting}
                    onClick={() => handleApprove(action.id)}
                  >
                    Approve
                  </Button>
                </div>
              </div>

              {rejectingId === action.id && (
                <div className="space-y-2 border-t border-[var(--app-border)] pt-3">
                  <Textarea
                    placeholder="Reason for rejection (required)..."
                    value={rejectNote}
                    onChange={(e) => { setRejectNote(e.target.value); setErrors({}) }}
                    rows={2}
                    error={errors[action.id]}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setRejectingId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="danger" loading={submitting} onClick={() => handleReject(action.id)}>
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              )}

              {errors[action.id] && rejectingId !== action.id && (
                <p className="text-xs text-red-400">{errors[action.id]}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
