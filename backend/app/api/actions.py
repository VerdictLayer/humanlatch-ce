from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_user_or_api_key
from app.db.session import get_db
from app.models.action import ActionProposal
from app.models.api_key import ApiKey
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.schemas.action import (
    ActionDecisionRequest,
    ActionResponse,
    ProposeActionRequest,
    ProposeActionResponse,
    RejectActionRequest,
)
from app.services import audit as audit_svc
from app.services.policy import evaluate_policy

router = APIRouter(prefix="/api/v1/actions", tags=["actions"])

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


@router.post("/propose", response_model=ProposeActionResponse, status_code=status.HTTP_201_CREATED)
def propose_action(
    body: ProposeActionRequest,
    workspace_id: str = Query(...),
    principal=Depends(get_current_user_or_api_key),
    db: Session = Depends(get_db),
):
    # Resolve proposed_by and verify workspace access
    if isinstance(principal, ApiKey):
        if principal.workspace_id != workspace_id:
            raise HTTPException(status_code=403, detail="API key does not belong to this workspace")
        proposed_by = f"api_key:{principal.key_prefix}"
        api_key_id = principal.id
    else:
        _check_membership(workspace_id, principal.id, db, min_role="viewer")
        proposed_by = f"user:{principal.id}"
        api_key_id = None

    risk_score, policy_outcome, final_status = evaluate_policy(
        db, workspace_id, body.action_type, body.target, body.context
    )

    action = ActionProposal(
        workspace_id=workspace_id,
        action_type=body.action_type,
        target=body.target,
        summary=body.summary,
        payload=body.payload,
        context=body.context,
        risk_score=risk_score,
        status=final_status,
        proposed_by=proposed_by,
        api_key_id=api_key_id,
    )
    db.add(action)

    actor_id = principal.id if isinstance(principal, User) else principal.key_prefix
    audit_svc.log_event(
        db,
        workspace_id=workspace_id,
        event_type="action.proposed",
        actor_type="user" if isinstance(principal, User) else "agent",
        actor_id=actor_id,
        resource_type="action",
        resource_id=action.id,
        metadata={"action_type": body.action_type, "risk_score": risk_score, "status": final_status},
    )

    db.commit()
    db.refresh(action)

    return ProposeActionResponse(
        id=action.id,
        status=action.status,
        risk_score=action.risk_score,
        summary=action.summary,
    )


@router.get("/", response_model=list[ActionResponse])
def list_actions(
    workspace_id: str = Query(...),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db)

    q = db.query(ActionProposal).filter(ActionProposal.workspace_id == workspace_id)
    if status_filter:
        q = q.filter(ActionProposal.status == status_filter)
    return q.order_by(ActionProposal.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{action_id}", response_model=ActionResponse)
def get_action(
    action_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db)

    action = db.query(ActionProposal).filter(
        ActionProposal.id == action_id, ActionProposal.workspace_id == workspace_id
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action


@router.post("/{action_id}/approve", response_model=ActionResponse)
def approve_action(
    action_id: str,
    body: ActionDecisionRequest,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db, min_role="approver")

    action = db.query(ActionProposal).filter(
        ActionProposal.id == action_id, ActionProposal.workspace_id == workspace_id
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action.status != "pending_approval":
        raise HTTPException(status_code=400, detail=f"Action is not pending approval (status: {action.status})")

    action.status = "approved_manual"
    action.decided_by = current_user.id
    action.decided_at = datetime.now(timezone.utc)
    action.decision_note = body.note

    audit_svc.log_event(
        db,
        workspace_id=workspace_id,
        event_type="action.approved",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="action",
        resource_id=action_id,
        metadata={"note": body.note},
    )

    db.commit()
    db.refresh(action)
    return action


@router.post("/{action_id}/reject", response_model=ActionResponse)
def reject_action(
    action_id: str,
    body: RejectActionRequest,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db, min_role="approver")

    action = db.query(ActionProposal).filter(
        ActionProposal.id == action_id, ActionProposal.workspace_id == workspace_id
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action.status != "pending_approval":
        raise HTTPException(status_code=400, detail=f"Action is not pending approval (status: {action.status})")

    action.status = "rejected"
    action.decided_by = current_user.id
    action.decided_at = datetime.now(timezone.utc)
    action.decision_note = body.note

    audit_svc.log_event(
        db,
        workspace_id=workspace_id,
        event_type="action.rejected",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="action",
        resource_id=action_id,
        metadata={"note": body.note},
    )

    db.commit()
    db.refresh(action)
    return action


@router.post("/{action_id}/cancel", response_model=ActionResponse)
def cancel_action(
    action_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_membership(workspace_id, current_user.id, db)

    action = db.query(ActionProposal).filter(
        ActionProposal.id == action_id, ActionProposal.workspace_id == workspace_id
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action.status not in ("pending_approval",):
        raise HTTPException(status_code=400, detail="Only pending actions can be cancelled")

    action.status = "cancelled"
    action.decided_at = datetime.now(timezone.utc)

    audit_svc.log_event(
        db,
        workspace_id=workspace_id,
        event_type="action.cancelled",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="action",
        resource_id=action_id,
        metadata={},
    )

    db.commit()
    db.refresh(action)
    return action
