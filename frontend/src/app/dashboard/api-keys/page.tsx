'use client'

import { useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { formatDate, formatRelative } from '@/lib/utils'
import type { ApiKey, ApiKeyCreated } from '@/types'

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyOpen, setNewKeyOpen] = useState(false)
  const [newKeyData, setNewKeyData] = useState<ApiKeyCreated | null>(null)
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const wsId = getWorkspaceId() || ''

  function load() {
    if (!wsId) return
    setLoading(true)
    api.apiKeys.list(wsId).then(setKeys).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [wsId])

  async function handleCreate() {
    if (!name.trim()) { setError('Name is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const created = await api.apiKeys.create(wsId, name)
      setNewKeyData(created)
      setCreateOpen(false)
      setNewKeyOpen(true)
      setName('')
      setKeys((prev) => [created, ...prev])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this API key? This cannot be undone.')) return
    try {
      await api.apiKeys.delete(id, wsId)
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: false } : k))
    } catch {}
  }

  async function handleCopy() {
    if (!newKeyData) return
    await navigator.clipboard.writeText(newKeyData.full_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <PageHeader
        title="API Keys"
        subtitle="Keys for agent clients to propose actions"
        actions={
          <Button size="sm" onClick={() => { setName(''); setError(''); setCreateOpen(true) }}>
            + Create Key
          </Button>
        }
      />

      <Card className="p-0">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-[#0f1117] rounded animate-pulse" />)}
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <p className="text-sm">No API keys yet.</p>
            <p className="text-xs mt-1">Create a key so your agents can propose actions.</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Prefix</Th>
                <Th>Status</Th>
                <Th>Last Used</Th>
                <Th>Created</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {keys.map((key) => (
                <Tr key={key.id}>
                  <Td className="font-medium">{key.name}</Td>
                  <Td><span className="font-mono text-xs text-slate-400">{key.key_prefix}…</span></Td>
                  <Td>
                    <Badge variant={key.is_active ? 'green' : 'gray'}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {key.last_used_at ? formatRelative(key.last_used_at) : 'Never'}
                  </Td>
                  <Td className="text-xs text-slate-500">{formatDate(key.created_at)}</Td>
                  <Td>
                    {key.is_active && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(key.id)}>
                        Deactivate
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create API Key"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" loading={submitting} onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <Input
          label="Key name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="e.g. terraform-agent"
          error={error}
        />
      </Modal>

      {/* Show new key modal */}
      <Modal
        open={newKeyOpen}
        onClose={() => { setNewKeyOpen(false); setCopied(false) }}
        title="API Key Created"
        footer={
          <Button onClick={() => { setNewKeyOpen(false); setCopied(false) }}>Done</Button>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-400">
            Copy this key now — it will not be shown again.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-indigo-300 break-all">
              {newKeyData?.full_key}
            </code>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
