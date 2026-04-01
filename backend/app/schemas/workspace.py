from datetime import datetime
from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str
    slug: str


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    owner_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MembershipResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}
