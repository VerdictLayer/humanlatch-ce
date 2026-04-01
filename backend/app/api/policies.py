from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.policy import PolicyRule
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.schemas.policy import PolicyEvaluateRequest, PolicyEvaluateResponse, PolicyRuleCreate, PolicyRuleResponse, PolicyRuleUpdate
from app.services import audit as audit_svc
from app.services.policy import evaluate_policy

router = APIRouter(prefix="/api/v1/policies", tags=["policies"])

ROLE_HIERARCHY = {"owner": 5, "admin": 4, "approver": 3, "viewer": 2, "agent_client": 1}


def _check_membership(workspace_id: str, user_id: str, db: Session, min_role: str = "viewer") -> WorkspaceMembership:
    membership = (
        db.query(WorkspaceMembership)
        .filter(WorkspaceMembership.workspace_id == workspace_id, WorkspaceMembership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    if ROLE_HIERARCHY.get(membership.role, 0) < ROLE_HIERARCHY.get(min_role, 0):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return membership


@router.get("/", response_model=list[PolicyRuleResponse])
def list_policies(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db)
    return (
        db.query(PolicyRule)
        .filter(PolicyRule.workspace_id == workspace_id)
        .order_by(PolicyRule.priority.desc())
        .all()
    )


@router.post("/", response_model=PolicyRuleResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    body: PolicyRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(body.workspace_id, current_user.id, db, min_role="admin")

    rule = PolicyRule(
        workspace_id=body.workspace_id,
        name=body.name,
        description=body.description,
        action_type_pattern=body.action_type_pattern,
        environment_pattern=body.environment_pattern,
        target_pattern=body.target_pattern,
        outcome=body.outcome,
        priority=body.priority,
        created_by=current_user.id,
    )
    db.add(rule)

    audit_svc.log_event(
        db,
        workspace_id=body.workspace_id,
        event_type="policy.created",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="policy",
        resource_id=rule.id,
        metadata={"name": body.name},
    )

    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=PolicyRuleResponse)
def update_policy(
    rule_id: str,
    body: PolicyRuleUpdate,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db, min_role="admin")

    rule = db.query(PolicyRule).filter(PolicyRule.id == rule_id, PolicyRule.workspace_id == workspace_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Policy rule not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(rule, field, value)

    audit_svc.log_event(
        db,
        workspace_id=workspace_id,
        event_type="policy.updated",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="policy",
        resource_id=rule_id,
        metadata=body.model_dump(exclude_none=True),
    )

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(
    rule_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db, min_role="admin")

    rule = db.query(PolicyRule).filter(PolicyRule.id == rule_id, PolicyRule.workspace_id == workspace_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Policy rule not found")

    audit_svc.log_event(
        db,
        workspace_id=workspace_id,
        event_type="policy.deleted",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="policy",
        resource_id=rule_id,
        metadata={"name": rule.name},
    )

    db.delete(rule)
    db.commit()


@router.post("/evaluate", response_model=PolicyEvaluateResponse)
def evaluate_policy_dryrun(
    body: PolicyEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(body.workspace_id, current_user.id, db)

    risk_score, policy_outcome, final_status = evaluate_policy(
        db, body.workspace_id, body.action_type, body.target, body.context
    )

    return PolicyEvaluateResponse(
        risk_score=risk_score,
        policy_outcome=policy_outcome,
        final_status=final_status,
    )
