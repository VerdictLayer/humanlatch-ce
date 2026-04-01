# HumanLatch JavaScript SDK

JavaScript/TypeScript SDK for sending AI-driven capability proposals to a HumanLatch control plane.

Use this SDK when your app, agent, robot controller, chatbot, or manufacturing system needs to ask:

- Can I run this capability automatically?
- Do I need a human approval first?
- Is this blocked by policy?

The SDK works against either:

- self-hosted HumanLatch CE
- a remotely hosted HumanLatch API

## Install

```bash
npm install @humanlatch/sdk
```

## Create a Client

```ts
import { HumanLatchClient } from "@humanlatch/sdk";

const client = new HumanLatchClient({
  baseUrl: "https://your-humanlatch.example.com",
  workspaceId: "your-workspace-id",
  apiKey: process.env.HUMANLATCH_API_KEY,
});
```

Use `token` for user-authenticated flows or `apiKey` for agent/service integrations.

## Core Flow

```ts
const result = await client.proposeAction({
  action_type: "support.refund.issue",
  target: "order-10428",
  summary: "Issue a refund above the autonomous threshold",
  payload: {
    amount: 850,
    currency: "USD",
    customer_id: "cust_2041",
  },
  context: {
    environment: "production",
    requested_by: "agent:support-bot",
    domain: "chatbot",
  },
});

if (client.isApproved(result)) {
  await issueRefund();
} else if (client.requiresApproval(result)) {
  await queueForHumanApproval(result.id);
} else if (client.isBlocked(result)) {
  throw new Error("Blocked by HumanLatch policy");
}
```

## What You Send

Every proposed capability should include:

- `action_type`: machine-readable capability name
- `target`: thing being affected
- `summary`: human-readable explanation
- `payload`: structured execution details
- `context`: environment, source, actor, and policy context

## Domain Examples

### Cloud / DevOps

```ts
await client.proposeAction({
  action_type: "aws.iam.policy_change",
  target: "prod-admin-role",
  summary: "Attach elevated access to a production IAM role",
  payload: {
    policy_arn: "arn:aws:iam::aws:policy/AdministratorAccess",
  },
  context: {
    environment: "production",
    requested_by: "agent:terraform-bot",
    domain: "cloud",
  },
});
```

### Chatbot / Customer Operations

```ts
await client.proposeAction({
  action_type: "support.refund.issue",
  target: "order-10428",
  summary: "Issue a refund above the autonomous threshold",
  payload: {
    amount: 850,
    currency: "USD",
  },
  context: {
    environment: "production",
    requested_by: "agent:support-bot",
    domain: "chatbot",
  },
});
```

### Robotics

```ts
await client.proposeAction({
  action_type: "robot.motion.execute",
  target: "cell-7-arm-a",
  summary: "Move a robot into a maintenance zone",
  payload: {
    command: "enter_maintenance_zone",
    speed: "reduced",
  },
  context: {
    environment: "factory",
    requested_by: "agent:cell-controller",
    domain: "robotics",
  },
});
```

### Manufacturing

```ts
await client.proposeAction({
  action_type: "manufacturing.line.override",
  target: "line-3",
  summary: "Override a conveyor safety threshold",
  payload: {
    threshold: 0.92,
    duration_seconds: 180,
  },
  context: {
    environment: "production",
    requested_by: "agent:line-optimizer",
    domain: "manufacturing",
  },
});
```

## Additional Methods

```ts
await client.listActions({ status: "pending_approval", limit: 50 });
await client.getAction("action-id");
await client.approveAction("action-id", { note: "Approved by supervisor" });
await client.rejectAction("action-id", "Unsafe during shift handoff");
await client.cancelAction("action-id");
```

## Integration Model

HumanLatch is not tied to one domain.

Your app keeps its own UI, runtime, and execution engine. Before it performs a sensitive capability, it asks HumanLatch for a decision:

- `approved_auto`: execute now
- `pending_approval`: wait for human approval
- `blocked`: do not execute

That same control plane works for:

- infrastructure agents
- support bots
- warehouse robots
- manufacturing lines
- internal copilots

