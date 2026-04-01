import { Badge } from '@/components/ui/Badge'
import type { ActionStatus } from '@/types'

const STATUS_CONFIG: Record<ActionStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'indigo' }> = {
  pending_approval: { label: 'Pending', variant: 'yellow' },
  approved_auto: { label: 'Auto-approved', variant: 'green' },
  approved_manual: { label: 'Approved', variant: 'green' },
  rejected: { label: 'Rejected', variant: 'red' },
  blocked: { label: 'Blocked', variant: 'red' },
  cancelled: { label: 'Cancelled', variant: 'gray' },
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'gray' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
