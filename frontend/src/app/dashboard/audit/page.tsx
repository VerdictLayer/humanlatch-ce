'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getWorkspaceId } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { formatRelative } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { AuditEvent } from '@/types'

function actorBadge(type: string) {
  if (type === 'user') return <Badge variant="blue">user</Badge>
  if (type === 'agent') return <Badge variant="indigo">agent</Badge>
  return <Badge variant="gray">system</Badge>
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const wsId = getWorkspaceId() || ''

  useEffect(() => {
    if (!wsId) return
    api.audit.list(wsId, { limit: 200 }).then(setEvents).finally(() => setLoading(false))
  }, [wsId])

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="All events in this workspace" />

      <Card className="p-0">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-10 rounded bg-[var(--app-panel-muted)] animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="p-6">
            <EmptyState
              eyebrow="Audit Trail"
              title="No audit history has been generated yet."
              description="The audit trail fills in as users sign in, policies change, and actions are proposed or reviewed. Once your first action runs through HumanLatch, this page becomes the replay log for what happened and why."
              checklist={[
                'Create a policy rule.',
                'Propose a test action.',
                'Review the resulting decisions and events here.',
              ]}
              actions={
                <>
                  <Link href="/dashboard/actions">
                    <Button size="sm">Send first action</Button>
                  </Link>
                  <Link href="/dashboard/policies">
                    <Button variant="secondary" size="sm">Create policy</Button>
                  </Link>
                </>
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Event</Th>
                <Th>Actor</Th>
                <Th>Actor ID</Th>
                <Th>Resource</Th>
                <Th>When</Th>
              </Tr>
            </Thead>
            <Tbody>
              {events.map((event) => (
                <Tr key={event.id}>
                  <Td>
                    <span className="font-mono text-xs text-[var(--app-text)]">{event.event_type}</span>
                  </Td>
                  <Td>{actorBadge(event.actor_type)}</Td>
                  <Td className="max-w-[160px] truncate text-xs text-[var(--app-text-muted)]">{event.actor_id}</Td>
                  <Td className="text-xs text-[var(--app-text-muted)]">
                    {event.resource_type}:{event.resource_id.slice(0, 8)}…
                  </Td>
                  <Td className="text-xs text-[var(--app-text-muted)]">{formatRelative(event.created_at)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
