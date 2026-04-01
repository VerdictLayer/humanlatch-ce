from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMembership
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse
from app.services import audit as audit_svc

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    body: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(Workspace).filter(Workspace.slug == body.slug).first():
        raise HTTPException(status_code=400, detail="Slug already taken")

    workspace = Workspace(name=body.name, slug=body.slug, owner_id=current_user.id)
    db.add(workspace)
    db.flush()

    membership = WorkspaceMembership(workspace_id=workspace.id, user_id=current_user.id, role="owner")
    db.add(membership)

    audit_svc.log_event(
        db,
        workspace_id=workspace.id,
        event_type="workspace.created",
        actor_type="user",
        actor_id=current_user.id,
        resource_type="workspace",
        resource_id=workspace.id,
        metadata={"name": workspace.name, "slug": workspace.slug},
    )

    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("/", response_model=list[WorkspaceResponse])
def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = db.query(WorkspaceMembership).filter(WorkspaceMembership.user_id == current_user.id).all()
    workspace_ids = [m.workspace_id for m in memberships]
    return db.query(Workspace).filter(Workspace.id.in_(workspace_ids)).all()


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
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

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return workspace
