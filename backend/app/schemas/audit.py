from datetime import datetime
from typing import Any, Dict
from pydantic import BaseModel, Field


class AuditEventResponse(BaseModel):
    id: str
    workspace_id: str
    event_type: str
    actor_type: str
    actor_id: str
    resource_type: str
    resource_id: str
    metadata: Dict[str, Any] = Field(validation_alias="audit_metadata")
    created_at: datetime

    model_config = {"from_attributes": True}
