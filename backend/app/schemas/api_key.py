from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ApiKeyCreate(BaseModel):
    name: str
    workspace_id: str


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(ApiKeyResponse):
    full_key: str
