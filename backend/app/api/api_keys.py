from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.deps import get_current_user
from app.core.security import generate_api_key
from app.db.session import get_db
from app.models.api_key import ApiKey
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse
from app.services import audit as audit_svc

router = APIRouter(prefix="/api/api-keys", tags=["api-keys"])

ROLE_HIERARCHY = {"owner": 5, "admin": 4, "approver": 3, "viewer": 2, "agent_client": 1}


def _require_admin(workspace_id: str, user: User, db: Session):
    membership = (
        db.query(WorkspaceMembership)
        .filter(WorkspaceMembership.workspace_id == workspace_id, WorkspaceMembership.user_id == user.id)
        .first()
    )
    if not membership or ROLE_HIERARCHY.get(membership.role, 0) < ROLE_HIERARCHY["admin"]:
        raise HTTPException(status_code=403, detail="Admin role required")


@router.post("/", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    body: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(body.workspace_id, current_user, db)

    full_key, prefix, key_hash = generate_api_key()
    api_key = ApiKey(
        workspace_id=body.workspace_id,
        name=body.name,
        key_prefix=prefix,
        key_hash=key_hash,
        created_by=current_user.id,
    )
    db.add(api_key)

    audit_svc.log_event(
        db,
        workspace_id=body.workspace_id,
        event_type="api_key.created",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="api_key",
        resource_id=api_key.id,
        metadata={"name": body.name},
    )

    db.commit()
    db.refresh(api_key)

    return ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        is_active=api_key.is_active,
        last_used_at=api_key.last_used_at,
        created_at=api_key.created_at,
        full_key=full_key,
    )


@router.get("/", response_model=list[ApiKeyResponse])
def list_api_keys(
    workspace_id: str,
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

    return db.query(ApiKey).filter(ApiKey.workspace_id == workspace_id).all()


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    key_id: str,
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(workspace_id, current_user, db)

    api_key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.workspace_id == workspace_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.is_active = False

    audit_svc.log_event(
        db,
        workspace_id=workspace_id,
        event_type="api_key.deleted",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="api_key",
        resource_id=key_id,
        metadata={"name": api_key.name},
    )

    db.commit()
