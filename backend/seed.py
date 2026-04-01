#!/usr/bin/env python3
"""Seed script — creates demo user, workspace, policies, and sample actions."""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from app.db.session import SessionLocal
from app.core.security import hash_password, generate_api_key
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMembership
from app.models.api_key import ApiKey
from app.models.policy import PolicyRule
from app.models.action import ActionProposal
from app.models.audit import AuditEvent


def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@humanlatch.dev").first():
            print("Already seeded — skipping.")
            return

        print("Seeding database...")

        # --- User ---
        user = User(
            email="admin@humanlatch.dev",
            hashed_password=hash_password("changeme123"),
            full_name="Demo Admin",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.flush()
        print(f"  Created user: {user.email}")

        # --- Workspace ---
        workspace = Workspace(
            name="Demo Workspace",
            slug="demo",
            owner_id=user.id,
            plan="community",
        )
        db.add(workspace)
        db.flush()

        membership = WorkspaceMembership(workspace_id=workspace.id, user_id=user.id, role="owner")
        db.add(membership)
        print(f"  Created workspace: {workspace.name}")

        # --- API Key ---
        full_key, prefix, key_hash = generate_api_key()
        api_key = ApiKey(
            workspace_id=workspace.id,
            name="Demo Agent Key",
            key_prefix=prefix,
            key_hash=key_hash,
            created_by=user.id,
        )
        db.add(api_key)
        db.flush()
        print(f"  Created API key: {full_key}  (save this — shown only once)")

        # --- Policies ---
        policies = [
            PolicyRule(
                workspace_id=workspace.id,
                name="Allow non-prod reads",
                description="Auto-approve read-only operations in non-production environments",
                action_type_pattern="*.read",
                environment_pattern="staging",
                outcome="allow",
                priority=100,
                created_by=user.id,
            ),
            PolicyRule(
                workspace_id=workspace.id,
                name="Require approval for production changes",
                description="All production changes require human approval",
                action_type_pattern="*",
                environment_pattern="production",
                outcome="require_approval",
                priority=50,
                created_by=user.id,
            ),
            PolicyRule(
                workspace_id=workspace.id,
                name="Block secrets export",
                description="Never allow secrets to be exported automatically",
                action_type_pattern="*.secrets.export",
                outcome="block",
                priority=200,
                created_by=user.id,
            ),
        ]
        for p in policies:
            db.add(p)
        db.flush()
        print(f"  Created {len(policies)} policy rules")

        # --- Sample Actions ---
        now = datetime.now(timezone.utc)
        actions_data = [
            {
                "action_type": "aws.iam.policy_change",
                "target": "prod-admin-role",
                "summary": "Attach AdministratorAccess to prod-admin-role",
                "payload": {"account_id": "123456789012", "policy_arn": "arn:aws:iam::aws:policy/AdministratorAccess"},
                "context": {"environment": "production", "requested_by": "agent:terraform-bot", "source": "terraform"},
                "risk_score": 80,
                "status": "pending_approval",
                "proposed_by": "agent:terraform-bot",
                "created_at": now - timedelta(minutes=5),
            },
            {
                "action_type": "aws.ec2.security_group_change",
                "target": "sg-prod-web-0123",
                "summary": "Open port 443 inbound on production web security group",
                "payload": {"port": 443, "protocol": "tcp", "cidr": "0.0.0.0/0"},
                "context": {"environment": "production", "requested_by": "agent:infra-bot"},
                "risk_score": 60,
                "status": "pending_approval",
                "proposed_by": "agent:infra-bot",
                "created_at": now - timedelta(minutes=15),
            },
            {
                "action_type": "aws.s3.bucket_policy_change",
                "target": "dev-assets-bucket",
                "summary": "Update S3 bucket policy for dev assets",
                "payload": {"bucket": "dev-assets-bucket"},
                "context": {"environment": "staging", "requested_by": "agent:deploy-bot"},
                "risk_score": 20,
                "status": "approved_auto",
                "proposed_by": "agent:deploy-bot",
                "created_at": now - timedelta(hours=1),
            },
            {
                "action_type": "aws.route53.record_delete",
                "target": "api.prod.example.com",
                "summary": "Delete DNS record api.prod.example.com",
                "payload": {"zone_id": "Z1234567890", "record_type": "A"},
                "context": {"environment": "production", "requested_by": "agent:dns-bot"},
                "risk_score": 100,
                "status": "blocked",
                "proposed_by": "agent:dns-bot",
                "created_at": now - timedelta(hours=2),
            },
            {
                "action_type": "terraform.apply",
                "target": "prod-eks-cluster",
                "summary": "Apply Terraform changes to production EKS cluster",
                "payload": {"plan_id": "plan-abc123", "resource_count": 12},
                "context": {"environment": "production", "requested_by": "agent:ci-bot", "source": "github-actions"},
                "risk_score": 50,
                "status": "rejected",
                "proposed_by": "agent:ci-bot",
                "decided_by": user.id,
                "decided_at": now - timedelta(hours=3),
                "decision_note": "Not approved during change freeze window.",
                "created_at": now - timedelta(hours=3, minutes=10),
            },
        ]

        for a in actions_data:
            action = ActionProposal(
                workspace_id=workspace.id,
                action_type=a["action_type"],
                target=a["target"],
                summary=a["summary"],
                payload=a["payload"],
                context=a["context"],
                risk_score=a["risk_score"],
                status=a["status"],
                proposed_by=a["proposed_by"],
                decided_by=a.get("decided_by"),
                decided_at=a.get("decided_at"),
                decision_note=a.get("decision_note"),
                created_at=a["created_at"],
                updated_at=a["created_at"],
            )
            db.add(action)
            db.flush()

            db.add(AuditEvent(
                workspace_id=workspace.id,
                event_type="action.proposed",
                actor_type="agent",
                actor_id=a["proposed_by"],
                resource_type="action",
                resource_id=action.id,
                audit_metadata={"action_type": a["action_type"], "risk_score": a["risk_score"], "status": a["status"]},
                created_at=a["created_at"],
            ))

        print(f"  Created {len(actions_data)} sample actions")

        # Audit: user registered
        db.add(AuditEvent(
            workspace_id=workspace.id,
            event_type="user.registered",
            actor_type="user",
            actor_id=user.id,
            resource_type="user",
            resource_id=user.id,
            audit_metadata={"email": user.email},
            created_at=now - timedelta(days=1),
        ))

        db.commit()
        print("\nSeed complete!")
        print(f"  Login: admin@humanlatch.dev / changeme123")
        print(f"  Dashboard: http://localhost:3000")
        print(f"  API docs: http://localhost:8000/docs")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
