from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PolicyRuleCreate(BaseModel):
    name: str
    description: str = ""
    action_type_pattern: str
    environment_pattern: Optional[str] = None
    target_pattern: Optional[str] = None
    outcome: str  # allow | require_approval | block
    priority: int = 0
    workspace_id: str


class PolicyRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    action_type_pattern: Optional[str] = None
    environment_pattern: Optional[str] = None
    target_pattern: Optional[str] = None
    outcome: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class PolicyRuleResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: str
    action_type_pattern: str
    environment_pattern: Optional[str]
    target_pattern: Optional[str]
    outcome: str
    priority: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PolicyEvaluateRequest(BaseModel):
    workspace_id: str
    action_type: str
    target: str
    context: dict = {}


class PolicyEvaluateResponse(BaseModel):
    risk_score: int
    policy_outcome: Optional[str]
    final_status: str
