export type Role = 'owner' | 'admin' | 'approver' | 'viewer' | 'agent_client'
export type ActionStatus = 'pending_approval' | 'approved_auto' | 'approved_manual' | 'rejected' | 'blocked' | 'cancelled'
export type PolicyOutcome = 'allow' | 'require_approval' | 'block'
export type ActorType = 'user' | 'agent' | 'system'

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
}

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
  owner_id: string
  created_at: string
}

export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface ApiKeyCreated extends ApiKey {
  full_key: string
}

export interface ActionProposal {
  id: string
  workspace_id: string
  action_type: string
  target: string
  summary: string
  payload: Record<string, unknown>
  context: Record<string, unknown>
  risk_score: number
  status: ActionStatus
  proposed_by: string
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
  created_at: string
  updated_at: string
}

export interface ProposeActionResult {
  id: string
  status: ActionStatus
  risk_score: number
  summary: string
}

export interface PolicyRule {
  id: string
  workspace_id: string
  name: string
  description: string
  action_type_pattern: string
  environment_pattern: string | null
  target_pattern: string | null
  outcome: PolicyOutcome
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditEvent {
  id: string
  workspace_id: string
  event_type: string
  actor_type: ActorType
  actor_id: string
  resource_type: string
  resource_id: string
  metadata: Record<string, unknown>
  created_at: string
}
