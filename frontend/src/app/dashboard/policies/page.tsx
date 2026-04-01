'use client'

import { useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import type { PolicyRule, PolicyOutcome } from '@/types'

const OUTCOME_BADGE: Record<PolicyOutcome, { label: string; variant: 'green' | 'yellow' | 'red' }> = {
  allow: { label: 'Allow', variant: 'green' },
  require_approval: { label: 'Require Approval', variant: 'yellow' },
  block: { label: 'Block', variant: 'red' },
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyRule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const wsId = getWorkspaceId() || ''

  const [form, setForm] = useState({
    name: '',
    description: '',
    action_type_pattern: '',
    environment_pattern: '',
    target_pattern: '',
    outcome: 'require_approval' as PolicyOutcome,
    priority: '0',
  })

  function load() {
    if (!wsId) return
    setLoading(true)
    api.policies.list(wsId).then(setPolicies).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [wsId])

  function resetForm() {
    setForm({ name: '', description: '', action_type_pattern: '', environment_pattern: '', target_pattern: '', outcome: 'require_approval', priority: '0' })
    setError('')
  }

  async function handleCreate() {
    setError('')
    setSubmitting(true)
    try {
      const rule = await api.policies.create(wsId, {
        ...form,
        environment_pattern: form.environment_pattern || null,
        target_pattern: form.target_pattern || null,
        priority: parseInt(form.priority, 10),
      })
      setPolicies((prev) => [rule, ...prev])
      setModalOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(rule: PolicyRule) {
    try {
      const updated = await api.policies.update(rule.id, wsId, { is_active: !rule.is_active })
      setPolicies((prev) => prev.map((p) => (p.id === rule.id ? updated : p)))
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this policy rule?')) return
    try {
      await api.policies.delete(id, wsId)
      setPolicies((prev) => prev.filter((p) => p.id !== id))
    } catch {}
  }

  return (
    <div>
      <PageHeader
        title="Policies"
        subtitle="Rules that control how actions are evaluated"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setModalOpen(true) }}>
            + New Policy
          </Button>
        }
      />

      <Card className="p-0">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded bg-[var(--app-panel-muted)] animate-pulse" />)}
          </div>
        ) : policies.length === 0 ? (
          <div className="p-6">
            <EmptyState
              eyebrow="Policy Setup"
              title="No policy rules are configured yet."
              description="Without custom rules, HumanLatch will fall back to conservative behavior. Define the first rules that tell the control plane what should be allowed automatically, what should wait for humans, and what should never run."
              checklist={[
                'Allow low-risk read or lookup actions.',
                'Require approval for sensitive production changes.',
                'Block dangerous capabilities like secrets export or unsafe motion.',
              ]}
              actions={
                <Button size="sm" onClick={() => { resetForm(); setModalOpen(true) }}>
                  Create first policy
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Action Pattern</Th>
                <Th>Environment</Th>
                <Th>Outcome</Th>
                <Th>Priority</Th>
                <Th>Active</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {policies.map((rule) => {
                const outcomeConf = OUTCOME_BADGE[rule.outcome]
                return (
                  <Tr key={rule.id}>
                    <Td>
                      <div>
                        <p className="font-medium text-[var(--app-text)]">{rule.name}</p>
                        {rule.description && <p className="text-xs text-[var(--app-text-muted)]">{rule.description}</p>}
                      </div>
                    </Td>
                    <Td><span className="font-mono text-xs">{rule.action_type_pattern}</span></Td>
                    <Td className="text-xs">{rule.environment_pattern || '—'}</Td>
                    <Td><Badge variant={outcomeConf.variant}>{outcomeConf.label}</Badge></Td>
                    <Td>{rule.priority}</Td>
                    <Td>
                      <button
                        onClick={() => handleToggle(rule)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          rule.is_active ? 'bg-indigo-600' : 'bg-[#2a2d3a]'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          rule.is_active ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </Td>
                    <Td>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                        Delete
                      </Button>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Policy Rule"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" loading={submitting} onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Allow non-prod reads" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..." />
          <Input label="Action Type Pattern" value={form.action_type_pattern} onChange={(e) => setForm((f) => ({ ...f, action_type_pattern: e.target.value }))} placeholder="aws.iam.* or *" />
          <Input label="Environment Pattern (optional)" value={form.environment_pattern} onChange={(e) => setForm((f) => ({ ...f, environment_pattern: e.target.value }))} placeholder="production or *" />
          <Input label="Target Pattern (optional)" value={form.target_pattern} onChange={(e) => setForm((f) => ({ ...f, target_pattern: e.target.value }))} placeholder="*-prod-* or leave blank" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Outcome</label>
            <select
              value={form.outcome}
              onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value as PolicyOutcome }))}
              className="w-full rounded-lg bg-[#0f1117] border border-[#2a2d3a] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="allow">Allow</option>
              <option value="require_approval">Require Approval</option>
              <option value="block">Block</option>
            </select>
          </div>
          <Input label="Priority" type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} placeholder="0" />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </Modal>
    </div>
  )
}
