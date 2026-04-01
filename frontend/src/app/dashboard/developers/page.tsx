'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { getWorkspaceId } from '@/lib/auth'

const nodeExample = `const response = await fetch(\`\${HUMANLATCH_URL}/api/v1/actions/propose?workspace_id=\${WORKSPACE_ID}\`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${TOKEN}\`
  },
  body: JSON.stringify({
    action_type: 'support.refund.issue',
    target: 'order-10428',
    summary: 'Issue a refund above the autonomous threshold',
    payload: { amount: 850, currency: 'USD' },
    context: { environment: 'production', requested_by: 'agent:support-bot' }
  })
})

const decision = await response.json()

if (decision.status === 'approved_auto') {
  await issueRefund()
} else if (decision.status === 'pending_approval') {
  await waitForApproval(decision.id)
} else if (decision.status === 'blocked') {
  throw new Error('Blocked by policy')
}`

const pythonExample = `decision = requests.post(
    f"{HUMANLATCH_URL}/api/v1/actions/propose",
    params={"workspace_id": WORKSPACE_ID},
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={
        "action_type": "robot.motion.execute",
        "target": "cell-7-arm-a",
        "summary": "Move a robot into a maintenance zone",
        "payload": {"command": "enter_maintenance_zone"},
        "context": {"environment": "factory", "requested_by": "agent:cell-controller"},
    },
).json()

if decision["status"] == "approved_auto":
    execute_motion()
elif decision["status"] == "pending_approval":
    queue_for_human_review(decision["id"])
elif decision["status"] == "blocked":
    raise RuntimeError("Blocked by policy")`

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4 text-xs leading-6 text-[var(--app-text)]">
      {code}
    </pre>
  )
}

function DomainCard({
  title,
  capability,
  why,
}: {
  title: string
  capability: string
  why: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
      <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Example capability</p>
      <p className="mt-1 text-sm text-[var(--app-text)]">{capability}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">{why}</p>
    </div>
  )
}

export default function DevelopersPage() {
  const workspaceId = getWorkspaceId() || 'your-workspace-id'

  return (
    <div>
      <PageHeader
        title="Developers"
        subtitle="Wire any AI-driven capability into HumanLatch, whether you host this UI yourself or point your app at a remote control plane"
      />

      <div className="space-y-6">
        <Card className="overflow-hidden border-[var(--app-border-strong)] bg-[linear-gradient(135deg,var(--app-panel-strong),var(--app-panel))] p-0">
          <div className="border-b border-[var(--app-border)] px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">How It Works</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">
              Your app proposes a capability before it executes. HumanLatch returns the route.
            </h2>
          </div>
          <div className="grid gap-4 px-6 py-5 md:grid-cols-4">
            <DomainCard title="1. App or Agent" capability="Decides it wants to act" why="This could be a devops bot, chatbot, robot controller, or manufacturing optimizer." />
            <DomainCard title="2. Propose" capability="Send action_type, target, summary, payload, context" why="The request goes to your self-hosted instance or a remote HumanLatch API." />
            <DomainCard title="3. Policy Route" capability="approved_auto, pending_approval, blocked" why="Policy and risk rules decide whether the capability can proceed, must wait, or must stop." />
            <DomainCard title="4. Execute or Wait" capability="Run, pause, or deny" why="Your app only executes if HumanLatch allows it." />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Integration Paths</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--app-text)]">Use HumanLatch as a hosted or remote API</p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Developers keep their own product UI and infrastructure, but send capability proposals to your server before executing risky actions.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--app-text)]">Host this dashboard yourself</p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Teams can self-host the dashboard and API together for internal approval workflows, regulated factories, robotics labs, or secure enterprise environments.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Workspace</p>
            <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Example workspace_id</p>
              <p className="mt-2 break-all font-mono text-sm text-[var(--app-text)]">{workspaceId}</p>
              <p className="mt-3 text-sm text-[var(--app-text-muted)]">
                Use this workspace ID with your API calls. Create API keys in the API Keys page when agents should propose actions directly.
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Copy-Paste Examples</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--app-text)]">Node / TypeScript</p>
              <CodeBlock code={nodeExample} />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--app-text)]">Python</p>
              <CodeBlock code={pythonExample} />
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]">Why This Matters Beyond Cloud</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DomainCard
              title="Cloud / DevOps"
              capability="Attach elevated IAM access"
              why="Require a human before risky infrastructure or security changes execute."
            />
            <DomainCard
              title="Chatbots"
              capability="Issue a large refund"
              why="Let the bot handle low-risk cases, but force approval for sensitive financial actions."
            />
            <DomainCard
              title="Robotics"
              capability="Enter a maintenance zone"
              why="Pause the robot until a supervisor approves a potentially hazardous motion."
            />
            <DomainCard
              title="Manufacturing"
              capability="Override a line safety threshold"
              why="Block or escalate actions that could affect safety, yield, or compliance."
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
