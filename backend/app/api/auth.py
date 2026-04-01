import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMembership
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services import audit as audit_svc
from app.services.bot_protection import validate_registration

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _make_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug[:50]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    validate_registration(bot_field=body.company, turnstile_token=body.turnstile_token)

    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.flush()

    # Auto-create personal workspace
    base_slug = _make_slug(body.full_name) or "workspace"
    slug = base_slug
    count = 1
    while db.query(Workspace).filter(Workspace.slug == slug).first():
        slug = f"{base_slug}-{count}"
        count += 1

    workspace = Workspace(name=f"{body.full_name}'s Workspace", slug=slug, owner_id=user.id)
    db.add(workspace)
    db.flush()

    membership = WorkspaceMembership(workspace_id=workspace.id, user_id=user.id, role="owner")
    db.add(membership)

    audit_svc.log_event(
        db,
        workspace_id=workspace.id,
        event_type="user.registered",
        actor_type="user",
        actor_id=user.id,
        resource_type="user",
        resource_id=user.id,
        metadata={"email": user.email},
    )

    db.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email, User.is_active == True).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Log in first workspace found for audit
    membership = db.query(WorkspaceMembership).filter(WorkspaceMembership.user_id == user.id).first()
    if membership:
        audit_svc.log_event(
            db,
            workspace_id=membership.workspace_id,
            event_type="user.logged_in",
            actor_type="user",
            actor_id=user.id,
            resource_type="user",
            resource_id=user.id,
            metadata={},
        )
        db.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout():
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
