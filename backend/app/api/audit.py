from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.schemas.audit import AuditEventResponse

router = APIRouter(prefix="/api/v1/audit-events", tags=["audit"])


@router.get("/", response_model=list[AuditEventResponse])
def list_audit_events(
    workspace_id: str = Query(...),
    event_type: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = (
        db.query(WorkspaceMembership)
        .filter(WorkspaceMembership.workspace_id == workspace_id, WorkspaceMembership.user_id == current_user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")

    q = db.query(AuditEvent).filter(AuditEvent.workspace_id == workspace_id)
    if event_type:
        q = q.filter(AuditEvent.event_type == event_type)
    if actor_id:
        q = q.filter(AuditEvent.actor_id == actor_id)
    if resource_type:
        q = q.filter(AuditEvent.resource_type == resource_type)

    return q.order_by(AuditEvent.created_at.desc()).offset(offset).limit(limit).all()
