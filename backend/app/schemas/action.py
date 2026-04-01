from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel


class ProposeActionRequest(BaseModel):
    action_type: str
    target: str
    summary: str
    payload: Dict[str, Any] = {}
    context: Dict[str, Any] = {}


class ActionDecisionRequest(BaseModel):
    note: Optional[str] = None


class RejectActionRequest(BaseModel):
    note: str


class ActionResponse(BaseModel):
    id: str
    workspace_id: str
    action_type: str
    target: str
    summary: str
    payload: Dict[str, Any]
    context: Dict[str, Any]
    risk_score: int
    status: str
    proposed_by: str
    decided_by: Optional[str]
    decided_at: Optional[datetime]
    decision_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProposeActionResponse(BaseModel):
    id: str
    status: str
    risk_score: int
    summary: str
