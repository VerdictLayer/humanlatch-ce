from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def log_event(
    db: Session,
    workspace_id: str,
    event_type: str,
    actor_type: str,
    actor_id: str,
    resource_type: str,
    resource_id: str,
    metadata: dict | None = None,
) -> AuditEvent:
    event = AuditEvent(
        workspace_id=workspace_id,
        event_type=event_type,
        actor_type=actor_type,
        actor_id=actor_id,
        resource_type=resource_type,
        resource_id=resource_id,
        audit_metadata=metadata or {},
    )
    db.add(event)
    db.flush()
    return event
