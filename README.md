# HumanLatch CE

Self-hosted community edition of HumanLatch.

HumanLatch is a control plane for AI-driven actions. Instead of letting an agent execute a sensitive capability directly, the agent proposes the action to HumanLatch first. HumanLatch evaluates policy and risk, decides whether the action should auto-run, require human approval, or be blocked, and records the decision in an audit trail.

This repo is used for self-hosted deployments. It gives teams a local dashboard, backend API, policy engine, approval queue, audit views, and SDK scaffold they can run in their own environment.

## How HumanLatch is used

A typical flow looks like this:

1. An app, agent, robot controller, or automation system proposes an action.
2. HumanLatch evaluates the action against policy and risk.
3. The action is approved automatically, routed for human review, or blocked.
4. Operators use the dashboard to review pending actions and manage policy.
5. The system records the full decision trail for audit and replay.

## Local development

```bash
cp .env.example .env
docker compose up -d --build
```

UI: `http://localhost:3000`
API: `http://localhost:8000`

## Structure

- `frontend/` dashboard UI
- `backend/` API, auth, policy engine, audit, migrations
- `sdk/javascript/` JavaScript SDK scaffold
- `docker-compose.yml` local stack

## Important env vars

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `SECRET_KEY`
- `DATABASE_URL`
